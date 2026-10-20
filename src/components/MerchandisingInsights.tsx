import React from 'react';
import { ProductItem } from '../types/dashboard';
import { formatIDR, formatPercent } from '../utils/formatters';
import { Lightbulb, TrendingUp, AlertTriangle, Layers } from 'lucide-react';

interface MerchandisingInsightsProps {
  items: ProductItem[];
  areaSqm: number;
  periodSales: number;
}

export const MerchandisingInsights: React.FC<MerchandisingInsightsProps> = ({
  items,
  areaSqm,
  periodSales,
}) => {
  const totalSales = items.reduce((acc, it) => acc + it.value, 0);
  const totalQty = items.reduce((acc, it) => acc + it.qty, 0);

  // Trolley performance
  const trolleyItems = items.filter((it) => it.description.includes('TROLLEY'));
  const trolleySales = trolleyItems.reduce((acc, it) => acc + it.value, 0);
  const trolleyQty = trolleyItems.reduce((acc, it) => acc + it.qty, 0);
  const trolleyPct = totalSales > 0 ? (trolleySales / totalSales) * 100 : 0;

  // Bin performance
  const binItems = items.filter((it) => it.description.includes('BIN'));
  const binSales = binItems.reduce((acc, it) => acc + it.value, 0);
  const binQty = binItems.reduce((acc, it) => acc + it.qty, 0);

  // Discontinue items
  const disconItems = items.filter((it) => it.category === 'DISCONTINUE');
  const disconSales = disconItems.reduce((acc, it) => acc + it.value, 0);
  const disconMoving = disconItems.filter((it) => it.qty > 0).length;
  const disconZero = disconItems.filter((it) => it.qty === 0).length;

  // Dead stock
  const zeroMovement = items.filter((it) => it.qty === 0);
  const deadFloorArea = areaSqm > 0 && items.length > 0 ? ((zeroMovement.length / items.length) * areaSqm).toFixed(1) : '0';

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
          <span>Executive Summary & Merchandising Strategy</span>
          <span aria-hidden="true">·</span>
          <span>Dining Zone Cluster</span>
        </div>
        <h3 className="text-xl font-bold tracking-tight text-slate-900">
          Evaluasi Kinerja Retail & Rekomendasi Alokasi Ruang
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Insight 1: Trolley Dominance */}
        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex gap-3.5">
          <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg shrink-0 h-fit">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Lini Walter Kitchen Trolley Sebagai Pendorong Utama
            </h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Varian Walter Kitchen Trolley (Putih, Pink, Gloss Black, Green) membukukan penjualan{' '}
              <strong>{formatIDR(trolleySales)}</strong> ({trolleyQty} unit), menyumbang{' '}
              <strong>{formatPercent(trolleyPct, 1)}</strong> dari total omset Organizer. Walter Trolley Putih adalah SKU nomor 1 tertinggi ({formatIDR(3681081)}).
            </p>
            <div className="text-[11px] text-slate-500 mt-2">
              Rekomendasi: Berikan posisi display "Eye-Level" & "Feature Gondola" di pintu masuk Dining Zone 221 m².
            </div>
          </div>
        </div>

        {/* Insight 2: Pedal Bin High Velocity */}
        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex gap-3.5">
          <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg shrink-0 h-fit">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Perputaran Cepat Milo & Cleo Pedal Bin
            </h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Kategori tempat sampah pedal mencatatkan <strong>{binQty} unit terjual</strong> dengan omset{' '}
              <strong>{formatIDR(binSales)}</strong>. Warna Pink (22 pcs) dan Green (17 pcs) memiliki rotasi tercepat dan disukai pelanggan area Dining.
            </p>
            <div className="text-[11px] text-slate-500 mt-2">
              Rekomendasi: Siapkan buffer stock yang memadai untuk Milo Pedal Bin 8L agar tidak terjadi kehabisan stok (Out of Stock).
            </div>
          </div>
        </div>

        {/* Insight 3: Floor Space Optimization */}
        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex gap-3.5">
          <div className="p-2 bg-amber-100 text-amber-700 rounded-lg shrink-0 h-fit">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Optimalisasi {zeroMovement.length} SKU Tanpa Penjualan
            </h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Sebanyak <strong>{zeroMovement.length} dari {items.length} SKU (46,3%)</strong> belum mencatat transaksi di periode berjalan, yang setara dengan pemakaian estimasi ~{deadFloorArea} m² dari 221 m² luasan area.
            </p>
            <div className="text-[11px] text-slate-500 mt-2">
              Rekomendasi: Evaluasi SKU seperti Lolla Storage Box Blue, Winston Rack, dan Storage Box 5L Blue/Pink untuk direlokasi atau bundling diskon.
            </div>
          </div>
        </div>

        {/* Insight 4: Discontinue SKU Clearance */}
        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex gap-3.5">
          <div className="p-2 bg-slate-200 text-slate-700 rounded-lg shrink-0 h-fit">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Strategi Cuci Gudang Barang Discontinue
            </h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Dari 19 SKU discontinue, <strong>{disconMoving} SKU bergerak</strong> menghasilkan {formatIDR(disconSales)} (26 unit), sedangkan <strong>{disconZero} SKU masih belum terjual</strong> (seperti Slim Soap Dispenser, Easy Store Caddy).
            </p>
            <div className="text-[11px] text-slate-500 mt-2">
              Rekomendasi: Buat bin promo khusus "Clearance Sale Discontinue" di dekat meja kasir untuk mempercepat likuidasi modal kerja.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
