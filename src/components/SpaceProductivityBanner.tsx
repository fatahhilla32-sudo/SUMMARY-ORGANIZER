import React, { useState } from 'react';
import { formatIDR, formatNumber, formatPercent } from '../utils/formatters';
import { Maximize2, Edit3, Check } from 'lucide-react';

interface SpaceProductivityBannerProps {
  areaSqm: number;
  onUpdateArea: (newArea: number) => void;
  crossSellingSales: number;
  totalQty: number;
  periodSales: number;
  bmSales: number;
  totalSkus: number;
  activeSkus: number;
}

export const SpaceProductivityBanner: React.FC<SpaceProductivityBannerProps> = ({
  areaSqm,
  onUpdateArea,
  crossSellingSales,
  totalQty,
  periodSales,
  bmSales,
  totalSkus,
  activeSkus,
}) => {
  const [isEditingArea, setIsEditingArea] = useState(false);
  const [tempArea, setTempArea] = useState(areaSqm.toString());

  const handleSaveArea = () => {
    const val = parseFloat(tempArea);
    if (!isNaN(val) && val > 0) {
      onUpdateArea(val);
    }
    setIsEditingArea(false);
  };

  const salesDensity = areaSqm > 0 ? Math.round(crossSellingSales / areaSqm) : 0;
  const storeSalesDensity = areaSqm > 0 ? Math.round(periodSales / areaSqm) : 0;
  const mtdSalesDensity = areaSqm > 0 ? Math.round(bmSales / areaSqm) : 0;
  const qtyDensity = areaSqm > 0 ? (totalQty / areaSqm).toFixed(2) : '0';
  const sqmPerSku = areaSqm > 0 && totalSkus > 0 ? (areaSqm / totalSkus).toFixed(2) : '0';
  const dormantSkus = totalSkus - activeSkus;
  const activeRate = totalSkus > 0 ? (activeSkus / totalSkus) * 100 : 0;

  return (
    <div id="space-productivity" className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
      {/* Header & Space Definition */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Retail Floor Productivity</span>
            <span aria-hidden="true">·</span>
            <span>Dining Zone</span>
            <span aria-hidden="true">·</span>
            <span>Organizer Display Cluster</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Analisis Produktivitas Ruang (Luasan {areaSqm} m²)
          </h2>
        </div>

        {/* Area editor widget */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
            <Maximize2 className="w-4 h-4 text-slate-500" />
            <span className="text-slate-500">Luas Area:</span>
            {isEditingArea ? (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={tempArea}
                  onChange={(e) => setTempArea(e.target.value)}
                  className="w-16 px-1.5 py-0.5 text-xs font-semibold border border-indigo-400 rounded bg-white font-tabular"
                  autoFocus
                />
                <button
                  onClick={handleSaveArea}
                  className="p-1 text-emerald-600 hover:text-emerald-700 cursor-pointer"
                  title="Simpan luasan"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <span className="font-bold text-slate-900 font-tabular">{areaSqm} m²</span>
            )}
            {!isEditingArea && (
              <button
                onClick={() => {
                  setTempArea(areaSqm.toString());
                  setIsEditingArea(true);
                }}
                className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer ml-1"
                title="Ubah luasan area"
              >
                <Edit3 className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid of Key Space Productivity Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-6">
        <div>
          <span className="text-xs font-medium text-slate-500 block mb-1">
            Sales Density (Cross-Selling)
          </span>
          <div className="text-2xl font-bold text-slate-900 font-tabular tracking-tight">
            {formatIDR(salesDensity)}
            <span className="text-xs font-normal text-slate-500 ml-1">/ m²</span>
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Dari total omset cross-selling {formatIDR(crossSellingSales)}
          </div>
        </div>

        <div>
          <span className="text-xs font-medium text-slate-500 block mb-1">
            Volume Density Penjualan
          </span>
          <div className="text-2xl font-bold text-slate-900 font-tabular tracking-tight">
            {qtyDensity}
            <span className="text-xs font-normal text-slate-500 ml-1">pcs / m²</span>
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Total {formatNumber(totalQty)} pcs produk organizer terjual
          </div>
        </div>

        <div>
          <span className="text-xs font-medium text-slate-500 block mb-1">
            Alokasi Ruang per SKU
          </span>
          <div className="text-2xl font-bold text-slate-900 font-tabular tracking-tight">
            {sqmPerSku}
            <span className="text-xs font-normal text-slate-500 ml-1">m² / SKU</span>
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Kapasitas {totalSkus} total SKU terdaftar
          </div>
        </div>

        <div>
          <span className="text-xs font-medium text-slate-500 block mb-1">
            Efisiensi Display Aktif
          </span>
          <div className="text-2xl font-bold text-slate-900 font-tabular tracking-tight">
            {formatPercent(activeRate, 1)}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            {activeSkus} SKU bergerak · {dormantSkus} SKU tanpa penjualan
          </div>
        </div>
      </div>

      {/* Additional Zone Comparison Footnote */}
      <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-y-2">
        <div className="flex items-center gap-4 flex-wrap">
          <span>
            <strong className="text-slate-800">Zone Store Sales Density:</strong> {formatIDR(storeSalesDensity)} / m²
          </span>
          <span aria-hidden="true" className="text-slate-300 hidden sm:inline">|</span>
          <span>
            <strong className="text-slate-800">MTD Store Sales Density:</strong> {formatIDR(mtdSalesDensity)} / m²
          </span>
        </div>
        <div className="text-slate-500">
          Organizer menyumbang kontribusi 7,60% terhadap revenue zona
        </div>
      </div>
    </div>
  );
};
