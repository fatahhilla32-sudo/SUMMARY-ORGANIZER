import React, { useState } from 'react';
import { SyncConfig } from '../types/dashboard';
import {
  X,
  RefreshCw,
  ExternalLink,
  Upload,
  Radio,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';

interface RealtimeSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncConfig: SyncConfig;
  onUpdateConfig: (newConfig: Partial<SyncConfig>) => void;
  onTriggerSync: () => void;
  onUploadCsvFile: (file: File) => void;
  onToggleSimulation: () => void;
  onResetToDefault: () => void;
}

export const RealtimeSyncModal: React.FC<RealtimeSyncModalProps> = ({
  isOpen,
  onClose,
  syncConfig,
  onUpdateConfig,
  onTriggerSync,
  onUploadCsvFile,
  onToggleSimulation,
  onResetToDefault,
}) => {
  const [urlInput, setUrlInput] = useState(syncConfig.sheetsUrl);
  const [uploadError, setUploadError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSaveUrl = () => {
    onUpdateConfig({ sheetsUrl: urlInput });
    if (urlInput.trim()) {
      onTriggerSync();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
        setUploadError('Harap unggah file berformat .csv');
        return;
      }
      onUploadCsvFile(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-xl max-w-xl w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-0.5">
              <span>Integrasi Spreadsheet</span>
              <span aria-hidden="true">·</span>
              <span>Realtime Polling Engine</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Sinkronisasi Spreadsheet Real-Time
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto text-slate-700">
          {/* Status Indicator Bar */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <div className="flex items-center gap-2.5">
              {syncConfig.status === 'syncing' ? (
                <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
              ) : syncConfig.status === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-500" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              )}
              <div>
                <div className="font-semibold text-slate-900">
                  {syncConfig.status === 'syncing'
                    ? 'Menghubungkan ke Spreadsheet...'
                    : syncConfig.status === 'error'
                    ? 'Koneksi Gagal'
                    : syncConfig.isSimulating
                    ? 'Simulasi POS Realtime Sedang Berjalan'
                    : 'Siap & Tersinkronisasi'}
                </div>
                <div className="text-slate-500">
                  {syncConfig.lastSyncedAt
                    ? `Terakhir diperbarui: ${syncConfig.lastSyncedAt.toLocaleTimeString('id-ID')}`
                    : 'Data bawaan aktif (CS_Dining_zone)'}
                </div>
              </div>
            </div>

            <button
              onClick={onTriggerSync}
              disabled={syncConfig.status === 'syncing'}
              className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-md hover:bg-slate-100 disabled:opacity-50 cursor-pointer shadow-2xs"
            >
              Sinkronkan Sekarang
            </button>
          </div>

          {/* Option 1: Live Google Sheets URL */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-900">
              URL Google Sheets (Published to Web atau Share Link)
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-tabular text-slate-900"
              />
              <button
                onClick={handleSaveUrl}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer whitespace-nowrap"
              >
                Terapkan
              </button>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              <strong>Tips Google Sheets:</strong> Buka Sheet Anda &gt; File &gt; Bagikan &gt; Publikasikan ke web &gt; Pilih format <em>CSV</em>. Atau salin link spreadsheet publik dengan akses <em>"Siapa saja yang memiliki link"</em>.
            </p>
          </div>

          {/* Option 2: Auto-Sync Polling Interval */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-900">
                  Otomatis Sinkronisasi (Auto-Polling)
                </div>
                <div className="text-[11px] text-slate-500">
                  Perbarui data secara berkala tanpa perlu reload halaman
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={syncConfig.autoSyncEnabled}
                  onChange={(e) =>
                    onUpdateConfig({ autoSyncEnabled: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600" />
              </label>
            </div>

            {syncConfig.autoSyncEnabled && (
              <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 text-xs">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-600">Interval pembaruan:</span>
                <select
                  value={syncConfig.syncIntervalSec}
                  onChange={(e) =>
                    onUpdateConfig({ syncIntervalSec: Number(e.target.value) })
                  }
                  className="px-2 py-1 text-xs border border-slate-300 rounded bg-white font-medium text-slate-800"
                >
                  <option value={15}>Setiap 15 Detik</option>
                  <option value={30}>Setiap 30 Detik</option>
                  <option value={60}>Setiap 1 Menit</option>
                  <option value={300}>Setiap 5 Menit</option>
                </select>
              </div>
            )}
          </div>

          {/* Option 3: Live POS Sales Stream Simulation */}
          <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-lg flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Simulasi Transaksi Live (POS Stream)</span>
              </div>
              <div className="text-[11px] text-slate-600 mt-0.5">
                Simulasikan kasir toko yang sedang mencatat penjualan Organizer secara real-time
              </div>
            </div>

            <button
              onClick={onToggleSimulation}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                syncConfig.isSimulating
                  ? 'bg-rose-600 text-white hover:bg-rose-700'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {syncConfig.isSimulating ? 'Hentikan Live' : 'Mulai Live'}
            </button>
          </div>

          {/* Option 4: Manual File Upload & Default Reset */}
          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <label className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer text-slate-700">
              <Upload className="w-3.5 h-3.5" />
              <span>Unggah File Spreadsheet (.csv)</span>
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            <button
              onClick={onResetToDefault}
              className="text-slate-500 hover:text-slate-800 text-xs underline cursor-pointer"
            >
              Pulihkan Data Asli (CS_Dining_zone)
            </button>
          </div>

          {uploadError && (
            <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded border border-rose-200">
              {uploadError}
            </p>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
