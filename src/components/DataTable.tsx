import React, { useState, useMemo } from 'react';
import { ProductItem, ItemCategory } from '../types/dashboard';
import { formatIDR, formatNumber, formatPercent } from '../utils/formatters';
import {
  Search,
  ArrowUpDown,
  Plus,
  Download,
  RotateCcw,
  Trash2,
  Edit2,
  Check,
  X,
} from 'lucide-react';

interface DataTableProps {
  items: ProductItem[];
  onUpdateItem: (updated: ProductItem) => void;
  onAddItem: (newItem: Omit<ProductItem, 'no'>) => void;
  onDeleteItem: (kls: string) => void;
  onResetData: () => void;
  onExportCsv: () => void;
  areaSqm: number;
}

type SortField = 'no' | 'kls' | 'description' | 'category' | 'qty' | 'value' | 'unitPrice';

export const DataTable: React.FC<DataTableProps> = ({
  items,
  onUpdateItem,
  onAddItem,
  onDeleteItem,
  onResetData,
  onExportCsv,
  areaSqm,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | ItemCategory>('ALL');
  const [movementFilter, setMovementFilter] = useState<'ALL' | 'MOVING' | 'ZERO'>('ALL');
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<SortField>('no');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Quick Inline Editing
  const [editingKls, setEditingKls] = useState<string | null>(null);
  const [editQty, setEditQty] = useState<number>(0);
  const [editValue, setEditValue] = useState<number>(0);
  const [editCategory, setEditCategory] = useState<ItemCategory>('CONTINUE');

  // Add Item Modal / Inline state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newKls, setNewKls] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCat, setNewCat] = useState<ItemCategory>('CONTINUE');
  const [newSubcat, setNewSubcat] = useState('Storage Boxes & Baskets');
  const [newQty, setNewQty] = useState(0);
  const [newValue, setNewValue] = useState(0);

  const subcategories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((it) => set.add(it.subcategory));
    return Array.from(set);
  }, [items]);

  const totalRevenue = useMemo(() => {
    return items.reduce((acc, it) => acc + it.value, 0);
  }, [items]);

  // Filtered & Sorted items
  const processedItems = useMemo(() => {
    return items
      .filter((it) => {
        // Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchKls = it.kls.toLowerCase().includes(q);
          const matchDesc = it.description.toLowerCase().includes(q);
          if (!matchKls && !matchDesc) return false;
        }

        // Category filter
        if (categoryFilter !== 'ALL' && it.category !== categoryFilter) {
          return false;
        }

        // Movement filter
        if (movementFilter === 'MOVING' && it.qty === 0) return false;
        if (movementFilter === 'ZERO' && it.qty > 0) return false;

        // Subcategory filter
        if (subcategoryFilter !== 'ALL' && it.subcategory !== subcategoryFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        let valA: string | number = 0;
        let valB: string | number = 0;

        if (sortField === 'no') {
          valA = a.no;
          valB = b.no;
        } else if (sortField === 'kls') {
          valA = a.kls;
          valB = b.kls;
        } else if (sortField === 'description') {
          valA = a.description.toLowerCase();
          valB = b.description.toLowerCase();
        } else if (sortField === 'category') {
          valA = a.category;
          valB = b.category;
        } else if (sortField === 'qty') {
          valA = a.qty;
          valB = b.qty;
        } else if (sortField === 'value') {
          valA = a.value;
          valB = b.value;
        } else if (sortField === 'unitPrice') {
          valA = a.qty > 0 ? a.value / a.qty : 0;
          valB = b.qty > 0 ? b.value / b.qty : 0;
        }

        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
      });
  }, [
    items,
    searchQuery,
    categoryFilter,
    movementFilter,
    subcategoryFilter,
    sortField,
    sortAsc,
  ]);

  const handleStartEdit = (item: ProductItem) => {
    setEditingKls(item.kls);
    setEditQty(item.qty);
    setEditValue(item.value);
    setEditCategory(item.category);
  };

  const handleSaveEdit = (item: ProductItem) => {
    onUpdateItem({
      ...item,
      qty: Math.max(0, editQty),
      value: Math.max(0, editValue),
      category: editCategory,
    });
    setEditingKls(null);
  };

  const handleCancelEdit = () => {
    setEditingKls(null);
  };

  const handleCreateNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc.trim()) return;
    onAddItem({
      kls: newKls.trim() || `SKU-${Date.now().toString().slice(-6)}`,
      description: newDesc.trim().toUpperCase(),
      category: newCat,
      subcategory: newSubcat,
      qty: Math.max(0, newQty),
      value: Math.max(0, newValue),
    });
    setNewKls('');
    setNewDesc('');
    setNewQty(0);
    setNewValue(0);
    setShowAddForm(false);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  return (
    <div id="spreadsheet" className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
      {/* Table Header Section */}
      <div className="p-6 border-b border-slate-200 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>Spreadsheet Database</span>
              <span aria-hidden="true">·</span>
              <span>Dining Zone Organizer</span>
              <span aria-hidden="true">·</span>
              <span>Area {areaSqm} m²</span>
            </div>
            <h3 className="text-xl font-bold tracking-tight text-slate-900">
              Data Penjualan Seluruh SKU Organizer
            </h3>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah SKU</span>
            </button>

            <button
              onClick={onExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor CSV</span>
            </button>

            <button
              onClick={onResetData}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer p-1.5"
              title="Reset ke data awal spreadsheet"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari SKU atau nama produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg text-xs">
            <button
              onClick={() => setCategoryFilter('ALL')}
              className={`flex-1 py-1 px-2 rounded-md transition-colors cursor-pointer text-center font-medium ${
                categoryFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({items.length})
            </button>
            <button
              onClick={() => setCategoryFilter('CONTINUE')}
              className={`flex-1 py-1 px-2 rounded-md transition-colors cursor-pointer text-center font-medium ${
                categoryFilter === 'CONTINUE'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Continue (35)
            </button>
            <button
              onClick={() => setCategoryFilter('DISCONTINUE')}
              className={`flex-1 py-1 px-2 rounded-md transition-colors cursor-pointer text-center font-medium ${
                categoryFilter === 'DISCONTINUE'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Discontinue (19)
            </button>
          </div>

          {/* Movement Filter */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg text-xs">
            <button
              onClick={() => setMovementFilter('ALL')}
              className={`flex-1 py-1 px-2 rounded-md transition-colors cursor-pointer text-center font-medium ${
                movementFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Status
            </button>
            <button
              onClick={() => setMovementFilter('MOVING')}
              className={`flex-1 py-1 px-2 rounded-md transition-colors cursor-pointer text-center font-medium ${
                movementFilter === 'MOVING'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bergerak ({items.filter((it) => it.qty > 0).length})
            </button>
            <button
              onClick={() => setMovementFilter('ZERO')}
              className={`flex-1 py-1 px-2 rounded-md transition-colors cursor-pointer text-center font-medium ${
                movementFilter === 'ZERO'
                  ? 'bg-white text-amber-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Nol ({items.filter((it) => it.qty === 0).length})
            </button>
          </div>

          {/* Subcategory Select */}
          <div>
            <select
              value={subcategoryFilter}
              onChange={(e) => setSubcategoryFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700"
            >
              <option value="ALL">Semua Subkategori</option>
              {subcategories.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Add Item Form Drawer/Card */}
      {showAddForm && (
        <form
          onSubmit={handleCreateNewItem}
          className="p-5 bg-slate-50 border-b border-slate-200 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900">Tambah SKU Baru ke Spreadsheet</h4>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                KLS / Kode SKU
              </label>
              <input
                type="text"
                placeholder="Contoh: 10463999"
                value={newKls}
                onChange={(e) => setNewKls(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white text-slate-900"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Deskripsi Produk *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: NORDIC MODULAR STORAGE BOX"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Kategori
              </label>
              <select
                value={newCat}
                onChange={(e) => setNewCat(e.target.value as ItemCategory)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white text-slate-900"
              >
                <option value="CONTINUE">CONTINUE</option>
                <option value="DISCONTINUE">DISCONTINUE</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Subkategori
              </label>
              <select
                value={newSubcat}
                onChange={(e) => setNewSubcat(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white text-slate-900"
              >
                {subcategories.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Qty / Value (Rp)
              </label>
              <div className="flex gap-1">
                <input
                  type="number"
                  min="0"
                  placeholder="Qty"
                  value={newQty}
                  onChange={(e) => setNewQty(parseInt(e.target.value) || 0)}
                  className="w-16 px-1.5 py-1.5 text-xs border border-slate-300 rounded bg-white text-slate-900 font-tabular"
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Value"
                  value={newValue}
                  onChange={(e) => setNewValue(parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded bg-white text-slate-900 font-tabular"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
            >
              Simpan ke Spreadsheet
            </button>
          </div>
        </form>
      )}

      {/* Spreadsheet Table View */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 select-none">
            <tr>
              <th
                onClick={() => handleSort('no')}
                className="py-3 px-3 w-12 text-center cursor-pointer hover:bg-slate-100"
              >
                <div className="flex items-center justify-center gap-1 font-semibold">
                  <span>No</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('kls')}
                className="py-3 px-3 w-28 cursor-pointer hover:bg-slate-100"
              >
                <div className="flex items-center gap-1 font-semibold">
                  <span>KLS / SKU</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('description')}
                className="py-3 px-3 cursor-pointer hover:bg-slate-100"
              >
                <div className="flex items-center gap-1 font-semibold">
                  <span>Deskripsi Produk</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('category')}
                className="py-3 px-3 w-28 cursor-pointer hover:bg-slate-100"
              >
                <div className="flex items-center gap-1 font-semibold">
                  <span>Kategori</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('qty')}
                className="py-3 px-3 w-24 text-right cursor-pointer hover:bg-slate-100"
              >
                <div className="flex items-center justify-end gap-1 font-semibold">
                  <span>Qty</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('value')}
                className="py-3 px-3 w-36 text-right cursor-pointer hover:bg-slate-100"
              >
                <div className="flex items-center justify-end gap-1 font-semibold">
                  <span>Nilai Penjualan</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('unitPrice')}
                className="py-3 px-3 w-28 text-right cursor-pointer hover:bg-slate-100 hidden lg:table-cell"
              >
                <div className="flex items-center justify-end gap-1 font-semibold">
                  <span>Harga/Pcs</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-3 w-20 text-right font-semibold hidden md:table-cell">
                Kontribusi
              </th>
              <th className="py-3 px-3 w-20 text-center font-semibold">Aksi</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {processedItems.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-400">
                  Tidak ada SKU yang cocok dengan filter atau pencarian Anda.
                </td>
              </tr>
            ) : (
              processedItems.map((item) => {
                const isEditing = editingKls === item.kls;
                const unitPrice = item.qty > 0 ? Math.round(item.value / item.qty) : 0;
                const contPct = totalRevenue > 0 ? (item.value / totalRevenue) * 100 : 0;

                return (
                  <tr
                    key={item.kls}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      item.qty === 0 ? 'bg-slate-50/30' : ''
                    }`}
                  >
                    {/* No */}
                    <td className="py-2.5 px-3 text-center font-tabular text-slate-400">
                      {item.no}
                    </td>

                    {/* KLS / SKU */}
                    <td className="py-2.5 px-3 font-tabular font-medium text-slate-700">
                      {item.kls}
                    </td>

                    {/* Description */}
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-slate-900 leading-tight">
                        {item.description}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {item.subcategory}
                      </div>
                    </td>

                    {/* Category (Zero-pill text styling) */}
                    <td className="py-2.5 px-3">
                      {isEditing ? (
                        <select
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value as ItemCategory)}
                          className="px-2 py-1 text-xs border border-indigo-400 rounded bg-white text-slate-900"
                        >
                          <option value="CONTINUE">CONTINUE</option>
                          <option value="DISCONTINUE">DISCONTINUE</option>
                        </select>
                      ) : (
                        <span
                          className={`font-semibold text-xs tracking-tight ${
                            item.category === 'CONTINUE'
                              ? 'text-indigo-700'
                              : 'text-amber-700'
                          }`}
                        >
                          {item.category === 'CONTINUE' ? 'Continue' : 'Discontinue'}
                        </span>
                      )}
                    </td>

                    {/* Qty */}
                    <td className="py-2.5 px-3 text-right font-tabular">
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          value={editQty}
                          onChange={(e) => setEditQty(parseInt(e.target.value) || 0)}
                          className="w-16 px-1.5 py-1 text-xs text-right border border-indigo-400 rounded bg-white text-slate-900 font-tabular"
                        />
                      ) : (
                        <span
                          className={`font-semibold ${
                            item.qty > 0 ? 'text-slate-900' : 'text-slate-400 font-normal'
                          }`}
                        >
                          {item.qty > 0 ? `${formatNumber(item.qty)} pcs` : '0 pcs'}
                        </span>
                      )}
                    </td>

                    {/* Value */}
                    <td className="py-2.5 px-3 text-right font-tabular">
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          value={editValue}
                          onChange={(e) => setEditValue(parseInt(e.target.value) || 0)}
                          className="w-28 px-1.5 py-1 text-xs text-right border border-indigo-400 rounded bg-white text-slate-900 font-tabular"
                        />
                      ) : (
                        <span
                          className={`font-semibold ${
                            item.value > 0 ? 'text-slate-900' : 'text-slate-400 font-normal'
                          }`}
                        >
                          {item.value > 0 ? formatIDR(item.value) : '-'}
                        </span>
                      )}
                    </td>

                    {/* Unit Price */}
                    <td className="py-2.5 px-3 text-right font-tabular text-slate-600 hidden lg:table-cell">
                      {unitPrice > 0 ? formatIDR(unitPrice) : '-'}
                    </td>

                    {/* Contribution */}
                    <td className="py-2.5 px-3 text-right font-tabular text-slate-600 hidden md:table-cell">
                      {item.value > 0 ? formatPercent(contPct, 1) : '-'}
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3 text-center">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleSaveEdit(item)}
                            className="p-1 text-emerald-600 hover:text-emerald-700 cursor-pointer"
                            title="Simpan"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                            title="Batal"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleStartEdit(item)}
                            className="p-1 text-slate-400 hover:text-indigo-600 cursor-pointer transition-colors"
                            title="Edit baris"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteItem(item.kls)}
                            className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer transition-colors"
                            title="Hapus baris"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Table Footer with Summary */}
          <tfoot className="bg-slate-50 border-t border-slate-200 font-semibold text-slate-800 text-xs">
            <tr>
              <td colSpan={4} className="py-3 px-3 text-left">
                Total Ringkasan ({processedItems.length} dari {items.length} SKU)
              </td>
              <td className="py-3 px-3 text-right font-tabular">
                {formatNumber(processedItems.reduce((acc, it) => acc + it.qty, 0))} pcs
              </td>
              <td className="py-3 px-3 text-right font-tabular text-slate-900">
                {formatIDR(processedItems.reduce((acc, it) => acc + it.value, 0))}
              </td>
              <td className="py-3 px-3 text-right font-tabular hidden lg:table-cell">
                {/* Avg Unit Price */}
                {(() => {
                  const q = processedItems.reduce((acc, it) => acc + it.qty, 0);
                  const v = processedItems.reduce((acc, it) => acc + it.value, 0);
                  return q > 0 ? formatIDR(Math.round(v / q)) : '-';
                })()}
              </td>
              <td className="py-3 px-3 text-right font-tabular hidden md:table-cell">
                {totalRevenue > 0
                  ? formatPercent(
                      (processedItems.reduce((acc, it) => acc + it.value, 0) / totalRevenue) *
                        100,
                      1
                    )
                  : '0%'}
              </td>
              <td className="py-3 px-3" />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
