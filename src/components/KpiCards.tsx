import React from 'react';
import { formatIDR, formatNumber, formatPercent } from '../utils/formatters';
import { ProductItem } from '../types/dashboard';

interface KpiCardsProps {
  bmSales: number;
  periodSales: number;
  periodLabel: string;
  items: ProductItem[];
}

export const KpiCards: React.FC<KpiCardsProps> = ({
  bmSales,
  periodSales,
  periodLabel,
  items,
}) => {
  const crossSellingSales = items.reduce((sum, item) => sum + item.value, 0);
  const totalQty = items.reduce((sum, item) => sum + item.qty, 0);
  const contributionPct = periodSales > 0 ? (crossSellingSales / periodSales) * 100 : 0;
  const avgSellingPrice = totalQty > 0 ? Math.round(crossSellingSales / totalQty) : 0;

  const continueItems = items.filter((it) => it.category === 'CONTINUE');
  const continueSales = continueItems.reduce((s, it) => s + it.value, 0);
  const continueQty = continueItems.reduce((s, it) => s + it.qty, 0);

  const discontinueItems = items.filter((it) => it.category === 'DISCONTINUE');
  const discontinueSales = discontinueItems.reduce((s, it) => s + it.value, 0);
  const discontinueQty = discontinueItems.reduce((s, it) => s + it.qty, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Cross Selling Revenue */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span>Cross Selling Organizer</span>
            <span>{periodLabel}</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-tabular tracking-tight">
            {formatIDR(crossSellingSales)}
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Kontribusi ke Penjualan Toko</span>
          <span className="font-semibold text-slate-800 font-tabular">
            {formatPercent(contributionPct)}
          </span>
        </div>
      </div>

      {/* Card 2: Period Total Store Sales */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span>Total Sales ({periodLabel})</span>
            <span>Zona Utama</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-tabular tracking-tight">
            {formatIDR(periodSales)}
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Sales MTD (Store Target)</span>
          <span className="font-semibold text-slate-800 font-tabular">
            {formatIDR(bmSales)}
          </span>
        </div>
      </div>

      {/* Card 3: Quantity & Average Selling Price */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span>Total Unit Terjual</span>
            <span>Organizer</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-tabular tracking-tight">
            {formatNumber(totalQty)}
            <span className="text-sm font-normal text-slate-500 ml-1">pcs</span>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Harga Rata-Rata (ASP)</span>
          <span className="font-semibold text-slate-800 font-tabular">
            {formatIDR(avgSellingPrice)}
          </span>
        </div>
      </div>

      {/* Card 4: Continue vs Discontinue Split */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span>Status Kategori Barang</span>
            <span>54 Total SKU</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">Continue (35 SKU):</span>
              <span className="font-semibold text-slate-900 font-tabular">
                {formatIDR(continueSales)} ({continueQty} pcs)
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">Discontinue (19 SKU):</span>
              <span className="font-semibold text-slate-900 font-tabular">
                {formatIDR(discontinueSales)} ({discontinueQty} pcs)
              </span>
            </div>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Porsi Continue</span>
          <span className="font-semibold text-emerald-700 font-tabular">
            {crossSellingSales > 0
              ? formatPercent((continueSales / crossSellingSales) * 100, 1)
              : '0%'}
          </span>
        </div>
      </div>
    </div>
  );
};
