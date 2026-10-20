import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';
import { ProductItem } from '../types/dashboard';
import { formatCompactIDR, formatIDR, formatNumber } from '../utils/formatters';

interface ChartsSectionProps {
  items: ProductItem[];
}

const CATEGORY_COLORS = ['#4f46e5', '#f59e0b']; // Indigo for Continue, Amber for Discontinue
const SUBCATEGORY_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];

export const ChartsSection: React.FC<ChartsSectionProps> = ({ items }) => {
  const [metricView, setMetricView] = useState<'value' | 'qty'>('value');

  // Top 10 items
  const sortedItems = [...items]
    .filter((it) => it.value > 0 || it.qty > 0)
    .sort((a, b) => (metricView === 'value' ? b.value - a.value : b.qty - a.qty))
    .slice(0, 10)
    .map((it) => ({
      name: it.description.length > 25 ? `${it.description.substring(0, 25)}...` : it.description,
      fullName: it.description,
      kls: it.kls,
      category: it.category,
      value: it.value,
      qty: it.qty,
      unitPrice: it.qty > 0 ? Math.round(it.value / it.qty) : 0,
    }));

  // Continue vs Discontinue
  const continueItems = items.filter((it) => it.category === 'CONTINUE');
  const discontinueItems = items.filter((it) => it.category === 'DISCONTINUE');

  const categoryPieData = [
    {
      name: 'Continue (35 SKU)',
      value: continueItems.reduce((acc, it) => acc + (metricView === 'value' ? it.value : it.qty), 0),
      rawSales: continueItems.reduce((acc, it) => acc + it.value, 0),
      rawQty: continueItems.reduce((acc, it) => acc + it.qty, 0),
      skus: 35,
    },
    {
      name: 'Discontinue (19 SKU)',
      value: discontinueItems.reduce((acc, it) => acc + (metricView === 'value' ? it.value : it.qty), 0),
      rawSales: discontinueItems.reduce((acc, it) => acc + it.value, 0),
      rawQty: discontinueItems.reduce((acc, it) => acc + it.qty, 0),
      skus: 19,
    },
  ];

  // Subcategory grouping
  const subcategoryMap = new Map<
    string,
    { name: string; value: number; qty: number; skus: number; activeSkus: number }
  >();

  items.forEach((it) => {
    const existing = subcategoryMap.get(it.subcategory) || {
      name: it.subcategory,
      value: 0,
      qty: 0,
      skus: 0,
      activeSkus: 0,
    };
    existing.value += it.value;
    existing.qty += it.qty;
    existing.skus += 1;
    if (it.qty > 0) existing.activeSkus += 1;
    subcategoryMap.set(it.subcategory, existing);
  });

  const subcategoryData = Array.from(subcategoryMap.values()).sort((a, b) =>
    metricView === 'value' ? b.value - a.value : b.qty - a.qty
  );

  // Active vs Zero-Movement SKUs
  const activeCount = items.filter((it) => it.qty > 0).length;
  const zeroMovementCount = items.filter((it) => it.qty === 0).length;

  return (
    <div id="analytics" className="space-y-6">
      {/* Section Title and Metric Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs text-slate-500 mb-1">
            <span>Visualisasi Merchandising</span>
            <span aria-hidden="true" className="mx-1">·</span>
            <span>Performance Analysis</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Performa Produk & Klaster Kategori
          </h2>
        </div>

        {/* Metric Selector Button Group */}
        <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setMetricView('value')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              metricView === 'value'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Berdasarkan Nilai (IDR)
          </button>
          <button
            onClick={() => setMetricView('qty')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              metricView === 'qty'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Berdasarkan Kuantitas (Qty)
          </button>
        </div>
      </div>

      {/* Grid: Top 10 Bestselling and Category Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top 10 Bestselling Products */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Top 10 Produk Terlaris ({metricView === 'value' ? 'Nilai Penjualan' : 'Kuantitas Unit'})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Produk unggulan penyumbang omset terbesar di area Organizer
              </p>
            </div>
            <span className="text-xs text-slate-500 font-tabular">
              {metricView === 'value' ? 'Dalam Rupiah' : 'Dalam Pcs'}
            </span>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sortedItems}
                layout="vertical"
                margin={{ top: 5, right: 25, left: 10, bottom: 5 }}
              >
                <XAxis
                  type="number"
                  tickFormatter={(val) =>
                    metricView === 'value' ? formatCompactIDR(val) : `${val} pcs`
                  }
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={150}
                  tick={{ fontSize: 11, fill: '#334155' }}
                />
                <Tooltip
                  formatter={(val: any) => {
                    const numericVal = typeof val === 'number' ? val : Number(val || 0);
                    return metricView === 'value'
                      ? [formatIDR(numericVal), 'Penjualan']
                      : [`${numericVal} pcs`, 'Kuantitas'];
                  }}
                  labelFormatter={(name) => {
                    const found = sortedItems.find((it) => it.name === name);
                    return found ? `${found.fullName} (${found.kls})` : String(name);
                  }}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar
                  dataKey={metricView === 'value' ? 'value' : 'qty'}
                  radius={[0, 4, 4, 0]}
                  fill="#4f46e5"
                >
                  {sortedItems.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.category === 'CONTINUE' ? '#4f46e5' : '#f59e0b'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-indigo-600 inline-block" />
                <span>Continue</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" />
                <span>Discontinue</span>
              </span>
            </div>
            <span className="text-slate-400">Walter Trolley & Milo Bin dominan</span>
          </div>
        </div>

        {/* Continue vs Discontinue Donut Chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Porsi Continue vs Discontinue
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Distribusi kontribusi stok berjalan vs stok dihentikan
            </p>

            <div className="h-56 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {categoryPieData.map((_entry, index) => (
                      <Cell
                        key={`pie-cell-${index}`}
                        fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => {
                      const numericVal = typeof val === 'number' ? val : Number(val || 0);
                      return metricView === 'value'
                        ? [formatIDR(numericVal), 'Total Nilai']
                        : [`${numericVal} pcs`, 'Total Unit'];
                    }}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Continue (35 SKU):</span>
              <span className="font-semibold text-slate-900 font-tabular">
                {formatIDR(categoryPieData[0].rawSales)} · {categoryPieData[0].rawQty} pcs
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Discontinue (19 SKU):</span>
              <span className="font-semibold text-slate-900 font-tabular">
                {formatIDR(categoryPieData[1].rawSales)} · {categoryPieData[1].rawQty} pcs
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Subcategory Performance & SKU Movement Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subcategory Breakdown */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Breakdown Klaster Subkategori
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Perbandingan performa per lini display Organizer
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={subcategoryData}
                margin={{ top: 10, right: 10, left: 10, bottom: 25 }}
              >
                <XAxis
                  dataKey="name"
                  angle={-15}
                  textAnchor="end"
                  interval={0}
                  tick={{ fontSize: 11, fill: '#475569' }}
                />
                <YAxis
                  tickFormatter={(val) =>
                    metricView === 'value' ? formatCompactIDR(val) : `${val} pcs`
                  }
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />
                <Tooltip
                  formatter={(val: any) => {
                    const numericVal = typeof val === 'number' ? val : Number(val || 0);
                    return metricView === 'value'
                      ? [formatIDR(numericVal), 'Nilai Penjualan']
                      : [`${numericVal} pcs`, 'Unit Terjual'];
                  }}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar
                  dataKey={metricView === 'value' ? 'value' : 'qty'}
                  radius={[4, 4, 0, 0]}
                  fill="#3b82f6"
                >
                  {subcategoryData.map((_entry, index) => (
                    <Cell
                      key={`subcat-cell-${index}`}
                      fill={SUBCATEGORY_COLORS[index % SUBCATEGORY_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Inventory Velocity / Movement Summary */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Kesehatan Perputaran SKU
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Analisis pergerakan produk dalam periode berjalan
            </p>

            <div className="space-y-4 mt-6">
              <div>
                <div className="flex justify-between text-xs font-medium mb-1.5">
                  <span className="text-slate-700">SKU Aktif Bergerak (Moving)</span>
                  <span className="text-emerald-700 font-tabular font-bold">
                    {activeCount} SKU ({((activeCount / items.length) * 100).toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(activeCount / items.length) * 100}%` }}
                  />
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Menghasilkan 100% total sales Rp 24.162.612
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1.5">
                  <span className="text-slate-700">SKU Nol Penjualan (Zero-Movement)</span>
                  <span className="text-amber-700 font-tabular font-bold">
                    {zeroMovementCount} SKU ({((zeroMovementCount / items.length) * 100).toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(zeroMovementCount / items.length) * 100}%` }}
                  />
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  25 SKU belum ada pergerakan transaksi di display 221 m²
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-600">
            <span className="font-semibold text-slate-800">Rekomendasi Merchandising:</span>
            <p className="mt-1 text-slate-500 leading-relaxed">
              Prioritaskan re-layout display 25 SKU non-moving agar tidak membebani alokasi luasan 221 m².
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
