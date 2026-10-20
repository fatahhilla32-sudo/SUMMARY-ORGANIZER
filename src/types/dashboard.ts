export type ItemCategory = 'CONTINUE' | 'DISCONTINUE';

export interface ProductItem {
  no: number;
  kls: string;
  description: string;
  category: ItemCategory;
  subcategory: string;
  qty: number;
  value: number;
}

export interface DashboardSummary {
  bmSales: number;
  periodSales: number;
  areaSqm: number;
  periodLabel: string;
  crossSellingSales: number;
  totalQty: number;
  contributionPct: number;
}

export interface SyncConfig {
  sheetsUrl: string;
  autoSyncEnabled: boolean;
  syncIntervalSec: number;
  lastSyncedAt: Date | null;
  isSimulating: boolean;
  status: 'idle' | 'syncing' | 'success' | 'error';
  errorMessage?: string;
}

export interface SubcategoryMetric {
  name: string;
  totalValue: number;
  totalQty: number;
  skuCount: number;
  activeSkuCount: number;
  contributionPct: number;
}
