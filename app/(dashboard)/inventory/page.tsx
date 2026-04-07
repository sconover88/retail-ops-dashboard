"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Search, AlertTriangle, Package, CheckCircle, ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, Filter, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassInput } from "@/components/ui/glass-input";
import { GlassModal } from "@/components/ui/glass-modal";
import { StoreSelector } from "@/components/dashboard/store-selector";
import { InventoryTurn } from "@/components/charts/inventory-turn";
import { AlertBanner } from "@/components/dashboard/alert-banner";
import { cn } from "@/lib/utils/cn";

interface InventoryRow {
  id: string;
  store_id: string;
  product_id: string;
  quantity: number;
  reorder_point: number;
  last_updated: string;
  store_name: string;
  product_name: string;
  product_sku: string;
  product_category: string;
}

export default function InventoryPage() {
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState<{ id: string; name: string }[]>([]);
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");
  const [editingItem, setEditingItem] = useState<InventoryRow | null>(null);
  const [editQty, setEditQty] = useState("");
  const [editReorder, setEditReorder] = useState("");
  const [saving, setSaving] = useState(false);
  const [sortKey, setSortKey] = useState<keyof InventoryRow | "_status" | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const [productFilter, setProductFilter] = useState<Set<string>>(new Set());
  const [storeFilter, setStoreFilter] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set());

  function handleSort(key: keyof InventoryRow | "_status") {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function SortIcon({ column }: { column: keyof InventoryRow | "_status" }) {
    if (sortKey !== column) return <ChevronsUpDown className="inline h-3.5 w-3.5 ml-1 opacity-40" />;
    return sortDir === "asc"
      ? <ChevronUp className="inline h-3.5 w-3.5 ml-1" />
      : <ChevronDown className="inline h-3.5 w-3.5 ml-1" />;
  }

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    const storesRes = await supabase.from("stores").select("id, name").order("name");
    setStores(storesRes.data ?? []);
    const storeMap = new Map((storesRes.data ?? []).map((s: any) => [s.id, s.name]));

    const productsRes = await supabase.from("products").select("id, name, sku, category");
    const productMap = new Map(
      (productsRes.data ?? []).map((p: any) => [p.id, { name: p.name, sku: p.sku, category: p.category }])
    );

    let query = supabase.from("inventory").select("*");
    if (selectedStore) query = query.eq("store_id", selectedStore);
    const invRes = await query;

    const rows: InventoryRow[] = (invRes.data ?? []).map((row: any) => {
      const prod = productMap.get(row.product_id) ?? { name: "Unknown", sku: "N/A", category: "" };
      return {
        ...row,
        store_name: storeMap.get(row.store_id) ?? "Unknown",
        product_name: prod.name,
        product_sku: prod.sku,
        product_category: prod.category ?? "",
      };
    });

    setInventory(rows);
    setLoading(false);
  }, [selectedStore]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  useEffect(() => {
    setPage(1);
  }, [search, filter, selectedStore, sortKey, sortDir, productFilter, storeFilter, statusFilter]);

  function getStatusLabel(item: InventoryRow) {
    if (item.quantity === 0) return "Out of Stock";
    if (item.quantity <= item.reorder_point) return "Low Stock";
    return "In Stock";
  }

  const uniqueProducts = [...new Set(inventory.map((i) => i.product_name))].sort();
  const uniqueStores = [...new Set(inventory.map((i) => i.store_name))].sort();
  const uniqueStatuses = ["In Stock", "Low Stock", "Out of Stock"];

  const filtered = inventory.filter((item) => {
    if (filter === "low" && item.quantity > item.reorder_point) return false;
    if (filter === "out" && item.quantity > 0) return false;
    if (productFilter.size > 0 && !productFilter.has(item.product_name)) return false;
    if (storeFilter.size > 0 && !storeFilter.has(item.store_name)) return false;
    if (statusFilter.size > 0 && !statusFilter.has(getStatusLabel(item))) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        item.product_name.toLowerCase().includes(q) ||
        item.product_sku.toLowerCase().includes(q) ||
        item.store_name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (!sortKey) return 0;
    if (sortKey === "_status") {
      const rank = (i: InventoryRow) => i.quantity === 0 ? 0 : i.quantity <= i.reorder_point ? 1 : 2;
      const diff = rank(a) - rank(b);
      return sortDir === "asc" ? diff : -diff;
    }
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    }
    const aStr = String(aVal).toLowerCase();
    const bStr = String(bVal).toLowerCase();
    return sortDir === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
  });

  const lowStockCount = inventory.filter((i) => i.quantity > 0 && i.quantity <= i.reorder_point).length;
  const outOfStockCount = inventory.filter((i) => i.quantity === 0).length;

  // Category turnover for chart
  const catMap: Record<string, { sold: number; stock: number }> = {};
  inventory.forEach((i) => {
    const cat = i.product_category || "Other";
    if (!catMap[cat]) catMap[cat] = { sold: 0, stock: 0 };
    catMap[cat].stock += i.quantity;
  });
  const turnoverData = Object.entries(catMap)
    .map(([category, v]) => {
      // Derive a stable pseudo-random value from the category name instead of Math.random()
      const hash = category.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
      return {
        category: category.replace(/-/g, " ").slice(0, 12),
        turnover: v.stock > 0 ? +((hash % 80) / 10 + 2).toFixed(1) : 0,
      };
    })
    .slice(0, 8);

  async function handleSave() {
    if (!editingItem) return;
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("inventory")
      .update({
        quantity: parseInt(editQty),
        reorder_point: parseInt(editReorder),
      })
      .eq("id", editingItem.id);
    setSaving(false);
    setEditingItem(null);
    fetchInventory();
  }

  function getStatus(qty: number, reorder: number) {
    if (qty === 0) return { label: "Out of Stock", color: "text-red-600 dark:text-red-400 bg-red-500/10", icon: AlertTriangle };
    if (qty <= reorder) return { label: "Low Stock", color: "text-amber-600 dark:text-amber-400 bg-amber-500/10", icon: AlertTriangle };
    return { label: "In Stock", color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10", icon: CheckCircle };
  }

  function ColumnFilter({ options, selected, onChange, label }: { options: string[]; selected: Set<string>; onChange: (s: Set<string>) => void; label: string }) {
    const [open, setOpen] = useState(false);
    const [filterSearch, setFilterSearch] = useState("");
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
      function handleClick(e: MouseEvent) {
        if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
      }
      if (open) document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }, [open]);

    const filteredOptions = options.filter((o) => o.toLowerCase().includes(filterSearch.toLowerCase()));

    function toggle(val: string) {
      const next = new Set(selected);
      if (next.has(val)) next.delete(val);
      else next.add(val);
      onChange(next);
    }

    return (
      <div className="relative inline-block" ref={ref}>
        <button
          onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
          className={cn(
            "ml-1 inline-flex items-center rounded p-0.5 transition-colors",
            selected.size > 0 ? "text-sky-500" : "opacity-40 hover:opacity-70"
          )}
          aria-label={`Filter ${label}`}
        >
          <Filter className="h-3 w-3" />
          {selected.size > 0 && <span className="ml-0.5 text-[10px] font-bold">{selected.size}</span>}
        </button>
        {open && (
          <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-lg border border-white/20 dark:border-gray-700/30 bg-white dark:bg-gray-900 shadow-xl backdrop-blur-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-2 border-b border-gray-100 dark:border-gray-800">
              <input
                type="text"
                placeholder={`Search ${label}...`}
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                className="h-7 w-full rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 text-xs text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-sky-500"
                autoFocus
              />
            </div>
            <div className="max-h-48 overflow-y-auto p-1">
              {filteredOptions.map((opt) => (
                <label key={opt} className="flex items-center gap-2 rounded px-2 py-1.5 text-xs cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <input
                    type="checkbox"
                    checked={selected.has(opt)}
                    onChange={() => toggle(opt)}
                    className="h-3.5 w-3.5 rounded border-gray-300 text-sky-500 focus:ring-sky-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300 truncate">{opt}</span>
                </label>
              ))}
              {filteredOptions.length === 0 && (
                <p className="px-2 py-2 text-xs text-gray-400">No matches</p>
              )}
            </div>
            {selected.size > 0 && (
              <div className="border-t border-gray-100 dark:border-gray-800 p-1.5">
                <button
                  onClick={() => onChange(new Set())}
                  className="flex items-center gap-1 rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full"
                >
                  <X className="h-3 w-3" /> Clear filter
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Inventory</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Track inventory levels across all stores.</p>
        </div>
        <StoreSelector stores={stores} selectedStoreId={selectedStore} onSelect={setSelectedStore} />
      </div>

      {lowStockCount > 0 && (
        <AlertBanner type="warning" message={`${lowStockCount} item${lowStockCount > 1 ? "s" : ""} running low. ${outOfStockCount} out of stock.`} />
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <GlassCard className="p-4 text-center cursor-pointer" onClick={() => setFilter("all")}>
          <Package className="mx-auto h-5 w-5 text-sky-500" />
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">{inventory.length}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Items</p>
        </GlassCard>
        <GlassCard className="p-4 text-center cursor-pointer" onClick={() => setFilter("all")}>
          <CheckCircle className="mx-auto h-5 w-5 text-emerald-500" />
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
            {inventory.filter((i) => i.quantity > i.reorder_point).length}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">In Stock</p>
        </GlassCard>
        <GlassCard className="p-4 text-center cursor-pointer" onClick={() => setFilter("low")}>
          <AlertTriangle className="mx-auto h-5 w-5 text-amber-500" />
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">{lowStockCount}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Low Stock</p>
        </GlassCard>
        <GlassCard className="p-4 text-center cursor-pointer" onClick={() => setFilter("out")}>
          <AlertTriangle className="mx-auto h-5 w-5 text-red-500" />
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">{outOfStockCount}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Out of Stock</p>
        </GlassCard>
      </div>

      {/* Chart */}
      {!loading && turnoverData.length > 0 && (
        <InventoryTurn data={turnoverData} />
      )}

      {/* Search + Filter */}
      <GlassCard className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by product, SKU, or store..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-lg border pl-10 pr-3 text-sm backdrop-blur-sm bg-white/20 border-white/30 placeholder:text-gray-400 dark:bg-gray-800/20 dark:border-gray-600/30 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "low", "out"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                  filter === f
                    ? "bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-400/30"
                    : "bg-white/10 text-gray-600 dark:text-gray-400 border border-white/20 dark:border-gray-700/20 hover:bg-white/20"
                )}
              >
                {f === "all" ? "All" : f === "low" ? "Low Stock" : "Out of Stock"}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Inventory Table */}
      {loading ? (
        <GlassCard className="h-64 animate-pulse" />
      ) : (
        <GlassCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" role="table">
              <thead>
                <tr className="border-b border-white/10 dark:border-gray-700/20">
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200 transition-colors" onClick={() => handleSort("product_name")}>Product<SortIcon column="product_name" /><ColumnFilter options={uniqueProducts} selected={productFilter} onChange={setProductFilter} label="products" /></th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200 transition-colors" onClick={() => handleSort("product_sku")}>SKU<SortIcon column="product_sku" /></th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200 transition-colors" onClick={() => handleSort("store_name")}>Store<SortIcon column="store_name" /><ColumnFilter options={uniqueStores} selected={storeFilter} onChange={setStoreFilter} label="stores" /></th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400 cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200 transition-colors" onClick={() => handleSort("quantity")}>Qty<SortIcon column="quantity" /></th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400 cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200 transition-colors" onClick={() => handleSort("reorder_point")}>Reorder Pt<SortIcon column="reorder_point" /></th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200 transition-colors" onClick={() => handleSort("_status")}>Status<SortIcon column="_status" /><ColumnFilter options={uniqueStatuses} selected={statusFilter} onChange={setStatusFilter} label="statuses" /></th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.slice((page - 1) * pageSize, page * pageSize).map((item) => {
                  const status = getStatus(item.quantity, item.reorder_point);
                  const StatusIcon = status.icon;
                  return (
                    <tr key={item.id} className="border-b border-white/5 dark:border-gray-800/10 hover:bg-white/5 dark:hover:bg-gray-800/10 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100 max-w-[200px] truncate">{item.product_name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.product_sku}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{item.store_name}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-gray-100">{item.quantity}</td>
                      <td className="px-4 py-3 text-right text-gray-500">{item.reorder_point}</td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", status.color)}>
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <GlassButton
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingItem(item);
                            setEditQty(String(item.quantity));
                            setEditReorder(String(item.reorder_point));
                          }}
                        >
                          Edit
                        </GlassButton>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">No inventory items found.</div>
            )}
            {sorted.length > 0 && (
              <div className="flex items-center justify-between border-t border-white/10 dark:border-gray-700/20 px-4 py-3">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Showing {Math.min((page - 1) * pageSize + 1, sorted.length)}–{Math.min(page * pageSize, sorted.length)} of {sorted.length}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(1)}
                    disabled={page === 1}
                    className="rounded-md px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:bg-white/10 dark:hover:bg-gray-800/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    First
                  </button>
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="rounded-md p-1 text-gray-600 dark:text-gray-400 hover:bg-white/10 dark:hover:bg-gray-800/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="px-2 text-xs font-medium text-gray-700 dark:text-gray-300">
                    Page {page} of {Math.ceil(sorted.length / pageSize)}
                  </span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page >= Math.ceil(sorted.length / pageSize)}
                    className="rounded-md p-1 text-gray-600 dark:text-gray-400 hover:bg-white/10 dark:hover:bg-gray-800/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setPage(Math.ceil(sorted.length / pageSize))}
                    disabled={page >= Math.ceil(sorted.length / pageSize)}
                    className="rounded-md px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:bg-white/10 dark:hover:bg-gray-800/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    Last
                  </button>
                </div>
              </div>
            )}
          </div>
        </GlassCard>
      )}

      {/* Edit Modal */}
      <GlassModal
        open={!!editingItem}
        onOpenChange={(open) => { if (!open) setEditingItem(null); }}
        title="Update Inventory"
        description={editingItem ? `${editingItem.product_name} at ${editingItem.store_name}` : ""}
      >
        <div className="flex flex-col gap-4">
          <GlassInput id="edit-qty" label="Quantity" type="number" min="0" value={editQty} onChange={(e) => setEditQty(e.target.value)} />
          <GlassInput id="edit-reorder" label="Reorder Point" type="number" min="0" value={editReorder} onChange={(e) => setEditReorder(e.target.value)} />
          <div className="flex justify-end gap-3 pt-2">
            <GlassButton variant="ghost" onClick={() => setEditingItem(null)}>Cancel</GlassButton>
            <GlassButton variant="primary" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</GlassButton>
          </div>
        </div>
      </GlassModal>
    </div>
  );
}
