import React, { useState, useEffect, useRef, useCallback } from 'react';
import { INITIAL_ITEMS, INITIAL_SUMMARY } from './data/initialData';
import { DashboardSummary, ProductItem, SyncConfig } from './types/dashboard';
import { Header } from './components/Header';
import { SpaceProductivityBanner } from './components/SpaceProductivityBanner';
import { KpiCards } from './components/KpiCards';
import { ChartsSection } from './components/ChartsSection';
import { DataTable } from './components/DataTable';
import { RealtimeSyncModal } from './components/RealtimeSyncModal';
import { MerchandisingInsights } from './components/MerchandisingInsights';
import {
  generateExportCsv,
  normalizeGoogleSheetsUrl,
  parseSpreadsheetCsv,
} from './utils/csvSync';
import { formatIDR } from './utils/formatters';
import { Radio, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';

const STORAGE_KEY_ITEMS = 'dining_zone_items_v1';
const STORAGE_KEY_SUMMARY = 'dining_zone_summary_v1';
const STORAGE_KEY_CONFIG = 'dining_zone_sync_config_v1';

export default function App() {
  // Load persisted items or fallback to initial data
  const [items, setItems] = useState<ProductItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ITEMS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return INITIAL_ITEMS;
  });

  // Load summary state
  const [summary, setSummary] = useState<DashboardSummary>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SUMMARY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_SUMMARY;
  });

  // Real-time synchronization state
  const [syncConfig, setSyncConfig] = useState<SyncConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          lastSyncedAt: parsed.lastSyncedAt ? new Date(parsed.lastSyncedAt) : new Date(),
          status: 'idle',
          isSimulating: false,
        };
      }
    } catch {
      // ignore
    }
    return {
      sheetsUrl: '',
      autoSyncEnabled: false,
      syncIntervalSec: 30,
      lastSyncedAt: new Date(),
      isSimulating: false,
      status: 'idle',
    };
  });

  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SUMMARY, JSON.stringify(summary));
    } catch {
      // ignore
    }
  }, [summary]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY_CONFIG,
        JSON.stringify({
          sheetsUrl: syncConfig.sheetsUrl,
          autoSyncEnabled: syncConfig.autoSyncEnabled,
          syncIntervalSec: syncConfig.syncIntervalSec,
          lastSyncedAt: syncConfig.lastSyncedAt,
        })
      );
    } catch {
      // ignore
    }
  }, [syncConfig.sheetsUrl, syncConfig.autoSyncEnabled, syncConfig.syncIntervalSec, syncConfig.lastSyncedAt]);

  // Derived metrics
  const currentTotalSales = items.reduce((acc, it) => acc + it.value, 0);
  const currentTotalQty = items.reduce((acc, it) => acc + it.qty, 0);
  const activeSkusCount = items.filter((it) => it.qty > 0).length;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Fetch data from Google Sheets CSV
  const fetchGoogleSheetsData = useCallback(async () => {
    if (!syncConfig.sheetsUrl.trim()) return;

    setSyncConfig((prev) => ({ ...prev, status: 'syncing', errorMessage: undefined }));
    const targetUrl = normalizeGoogleSheetsUrl(syncConfig.sheetsUrl);

    try {
      // Try direct fetch or cors proxy
      let response: Response;
      try {
        response = await fetch(targetUrl);
      } catch {
        // Fallback with public corsproxy if blocked
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
        response = await fetch(proxyUrl);
      }

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}`);
      }

      const csvText = await response.text();
      const parsed = parseSpreadsheetCsv(csvText);

      if (parsed.items.length === 0) {
        throw new Error('Tidak ditemukan data baris produk dalam file spreadsheet.');
      }

      setItems(parsed.items);
      setSummary((prev) => ({
        ...prev,
        bmSales: parsed.bmSales || prev.bmSales,
        periodSales: parsed.periodSales || prev.periodSales,
        crossSellingSales: parsed.crossSellingSales || parsed.items.reduce((a, b) => a + b.value, 0),
        totalQty: parsed.totalQty || parsed.items.reduce((a, b) => a + b.qty, 0),
      }));

      setSyncConfig((prev) => ({
        ...prev,
        status: 'success',
        lastSyncedAt: new Date(),
      }));

      showToast(`Spreadsheet berhasil disinkronkan (${parsed.items.length} SKU diperbarui).`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyinkronkan data.';
      setSyncConfig((prev) => ({
        ...prev,
        status: 'error',
        errorMessage: msg,
      }));
      showToast(`Gagal sync: ${msg}`);
    }
  }, [syncConfig.sheetsUrl]);

  // Auto-sync polling timer
  useEffect(() => {
    if (!syncConfig.autoSyncEnabled || !syncConfig.sheetsUrl.trim()) {
      return;
    }

    const intervalId = setInterval(() => {
      fetchGoogleSheetsData();
    }, syncConfig.syncIntervalSec * 1000);

    return () => clearInterval(intervalId);
  }, [syncConfig.autoSyncEnabled, syncConfig.sheetsUrl, syncConfig.syncIntervalSec, fetchGoogleSheetsData]);

  // Real-time POS Simulation Stream
  useEffect(() => {
    if (!syncConfig.isSimulating) return;

    const timer = setInterval(() => {
      // Pick a random moving SKU or popular item
      setItems((prevItems) => {
        if (prevItems.length === 0) return prevItems;
        // 70% chance to pick among top 10 items, 30% random
        const candidates = prevItems.filter((it) => it.value > 0);
        const pool = candidates.length > 0 ? candidates : prevItems;
        const randomIndex = Math.floor(Math.random() * pool.length);
        const target = pool[randomIndex];

        const unitPrice =
          target.qty > 0 ? Math.round(target.value / target.qty) : 125000;
        const newQty = target.qty + 1;
        const newValue = target.value + unitPrice;

        showToast(
          `Transaksi Realtime: ${target.description.substring(0, 28)} (+1 pcs · ${formatIDR(unitPrice)})`
        );

        return prevItems.map((item) => {
          if (item.kls === target.kls) {
            return {
              ...item,
              qty: newQty,
              value: newValue,
            };
          }
          return item;
        });
      });

      setSyncConfig((prev) => ({
        ...prev,
        lastSyncedAt: new Date(),
      }));
    }, 8500);

    return () => clearInterval(timer);
  }, [syncConfig.isSimulating]);

  // Item modifications
  const handleUpdateItem = (updated: ProductItem) => {
    setItems((prev) => prev.map((it) => (it.kls === updated.kls ? updated : it)));
    showToast(`SKU ${updated.kls} berhasil diperbarui.`);
  };

  const handleAddItem = (newItem: Omit<ProductItem, 'no'>) => {
    setItems((prev) => {
      const nextNo = prev.length + 1;
      return [...prev, { ...newItem, no: nextNo }];
    });
    showToast(`SKU baru "${newItem.description}" berhasil ditambahkan.`);
  };

  const handleDeleteItem = (kls: string) => {
    setItems((prev) =>
      prev
        .filter((it) => it.kls !== kls)
        .map((it, idx) => ({ ...it, no: idx + 1 }))
    );
    showToast(`SKU ${kls} telah dihapus.`);
  };

  const handleResetData = () => {
    if (window.confirm('Kembalikan seluruh data ke isi awal spreadsheet?')) {
      setItems(INITIAL_ITEMS);
      setSummary(INITIAL_SUMMARY);
      showToast('Data dikembalikan ke kondisi awal spreadsheet.');
    }
  };

  const handleExportCsv = () => {
    const csv = generateExportCsv(items, summary.areaSqm);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Dining_Zone_Organizer_221m2_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Spreadsheet CSV berhasil diunduh.');
  };

  const handleUploadCsvFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        try {
          const parsed = parseSpreadsheetCsv(text);
          if (parsed.items.length > 0) {
            setItems(parsed.items);
            if (parsed.bmSales || parsed.periodSales) {
              setSummary((prev) => ({
                ...prev,
                bmSales: parsed.bmSales || prev.bmSales,
                periodSales: parsed.periodSales || prev.periodSales,
              }));
            }
            setSyncConfig((prev) => ({
              ...prev,
              lastSyncedAt: new Date(),
              status: 'success',
            }));
            setIsSyncModalOpen(false);
            showToast(`File "${file.name}" berhasil diunggah (${parsed.items.length} SKU).`);
          } else {
            alert('File CSV tidak memiliki data produk yang dapat dibaca.');
          }
        } catch (err) {
          alert('Gagal memproses file CSV: ' + err);
        }
      }
    };
    reader.readAsText(file);
  };

  const handleScrollToSection = (section: string) => {
    setActiveSection(section);
    if (section === 'overview') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const el = document.getElementById(section);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Bar Contract (1-line Brand Wordmark - Nav Links - Primary Sync Action) */}
      <Header
        syncConfig={syncConfig}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onManualRefresh={fetchGoogleSheetsData}
        activeSection={activeSection}
        onNavigate={handleScrollToSection}
      />

      {/* Real-time Toast Notification (Zero-Pill clean floating banner) */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-lg border border-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Workspace Canvas */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        {/* Section 1: Executive Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
              <span>Laporan Kinerja Ritel</span>
              <span aria-hidden="true">·</span>
              <span>Dining Zone Cluster</span>
              <span aria-hidden="true">·</span>
              <span>Periode: {summary.periodLabel}</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Summary Organizer Report
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Dashboard analitik penjualan cross-selling Organizer pada area Dining Zone dengan luasan {summary.areaSqm} m², terhubung realtime ke data spreadsheet.
            </p>
          </div>

          {/* Sync Status Badge (Zero-pill text format) */}
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-white border border-slate-200 px-3.5 py-2 rounded-lg shadow-2xs self-start md:self-auto">
            <span
              className={`w-2 h-2 rounded-full ${
                syncConfig.isSimulating
                  ? 'bg-emerald-500 animate-pulse'
                  : syncConfig.status === 'syncing'
                  ? 'bg-indigo-500 animate-spin'
                  : 'bg-emerald-500'
              }`}
            />
            <span className="font-medium text-slate-700">
              {syncConfig.isSimulating
                ? 'POS Stream Berjalan'
                : syncConfig.autoSyncEnabled
                ? `Auto-Sync (${syncConfig.syncIntervalSec}s)`
                : 'Realtime Ready'}
            </span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="font-tabular">
              {syncConfig.lastSyncedAt
                ? syncConfig.lastSyncedAt.toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })
                : '-'}
            </span>
          </div>
        </div>

        {/* Section 2: Space Productivity (Luasan 221 Meter Persegi) */}
        <SpaceProductivityBanner
          areaSqm={summary.areaSqm}
          onUpdateArea={(newArea) => setSummary((prev) => ({ ...prev, areaSqm: newArea }))}
          crossSellingSales={currentTotalSales}
          totalQty={currentTotalQty}
          periodSales={summary.periodSales}
          bmSales={summary.bmSales}
          totalSkus={items.length}
          activeSkus={activeSkusCount}
        />

        {/* Section 3: Primary KPI Cards */}
        <KpiCards
          bmSales={summary.bmSales}
          periodSales={summary.periodSales}
          periodLabel={summary.periodLabel}
          items={items}
        />

        {/* Section 4: Merchandising Strategic Takeaways */}
        <MerchandisingInsights
          items={items}
          areaSqm={summary.areaSqm}
          periodSales={summary.periodSales}
        />

        {/* Section 5: Charts & Performance Visualizations */}
        <ChartsSection items={items} />

        {/* Section 6: Comprehensive Spreadsheet Data Grid */}
        <DataTable
          items={items}
          onUpdateItem={handleUpdateItem}
          onAddItem={handleAddItem}
          onDeleteItem={handleDeleteItem}
          onResetData={handleResetData}
          onExportCsv={handleExportCsv}
          areaSqm={summary.areaSqm}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            Summary Organizer · Dining Zone (Luas 221 m²) · 54 SKU Terdaftar
          </div>
          <div className="text-slate-400">
            Terhubung dengan format data spreadsheet CS_Dining_zone
          </div>
        </div>
      </footer>

      {/* Real-time Sync Configuration Modal */}
      <RealtimeSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        syncConfig={syncConfig}
        onUpdateConfig={(updates) => setSyncConfig((prev) => ({ ...prev, ...updates }))}
        onTriggerSync={fetchGoogleSheetsData}
        onUploadCsvFile={handleUploadCsvFile}
        onToggleSimulation={() =>
          setSyncConfig((prev) => ({ ...prev, isSimulating: !prev.isSimulating }))
        }
        onResetToDefault={handleResetData}
      />
    </div>
  );
}
