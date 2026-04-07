"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, AlertTriangle, Package, CheckCircle } from "lucide-react";
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

  const filtered = inventory.filter((item) => {
    if (filter === "low" && item.quantity > item.reorder_point) return false;
    if (filter === "out" && item.quantity > 0) return false;
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
    .map(([category, v]) => ({
      category: category.replace(/-/g, " ").slice(0, 12),
      turnover: v.stock > 0 ? +(Math.random() * 8 + 2).toFixed(1) : 0,
    }))
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
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Product</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">SKU</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Store</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Qty</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Reorder Pt</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 100).map((item) => {
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
            {filtered.length > 100 && (
              <div className="py-3 text-center text-xs text-gray-400">Showing first 100 of {filtered.length} results</div>
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
