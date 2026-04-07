"use client";

import { useEffect, useState } from "react";
import {
  DollarSign,
  ShoppingCart,
  Package,
  TrendingUp,
  Users,
  AlertTriangle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { formatCurrency, formatCompact } from "@/lib/utils/formatters";
import { SalesTrend } from "@/components/charts/sales-trend";
import { RevenueChart } from "@/components/charts/revenue-chart";
import { AlertBanner } from "@/components/dashboard/alert-banner";
import { StoreSelector } from "@/components/dashboard/store-selector";

interface KpiData {
  totalRevenue: number;
  totalOrders: number;
  productCount: number;
  avgOrderValue: number;
  staffCount: number;
  lowStockCount: number;
}

interface ChartPoint {
  date: string;
  revenue: number;
}

export default function DashboardPage() {
  const [kpi, setKpi] = useState<KpiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [salesTrend, setSalesTrend] = useState<ChartPoint[]>([]);
  const [stores, setStores] = useState<{ id: string; name: string }[]>([]);
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [seedDone, setSeedDone] = useState(false);

  async function loadData(storeId: string | null) {
    setLoading(true);
    const supabase = createClient();

    // Load stores for selector
    const storesRes = await supabase.from("stores").select("id, name").order("name");
    const storesList = storesRes.data ?? [];

    // Auto-seed if database is empty
    if (storesList.length === 0 && !seedDone) {
      setSeeding(true);
      const res = await fetch("/api/seed", { method: "POST" });
      setSeeding(false);
      if (res.ok) {
        setSeedDone(true);
        // Re-run loadData now that we have data
        loadData(storeId);
        return;
      }
    }

    setStores(storesList);

    // Sales query with optional store filter
    let salesQuery = supabase.from("sales").select("total_price, sale_date, store_id");
    if (storeId) salesQuery = salesQuery.eq("store_id", storeId);
    const salesRes = await salesQuery;

    const productsRes = await supabase
      .from("products")
      .select("id", { count: "exact", head: true });
    const profilesRes = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true });

    let invQuery = supabase.from("inventory").select("quantity, reorder_point, store_id");
    if (storeId) invQuery = invQuery.eq("store_id", storeId);
    const inventoryRes = await invQuery;

    const sales = salesRes.data ?? [];
    const totalRevenue = sales.reduce(
      (sum: number, s: any) => sum + Number(s.total_price ?? 0),
      0
    );
    const totalOrders = sales.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const inventory = inventoryRes.data ?? [];
    const lowStock = inventory.filter(
      (i: any) => i.quantity <= i.reorder_point
    ).length;

    setKpi({
      totalRevenue,
      totalOrders,
      productCount: productsRes.count ?? 0,
      avgOrderValue,
      staffCount: profilesRes.count ?? 0,
      lowStockCount: lowStock,
    });

    // Build sales trend (last 30 days)
    const trendMap: Record<string, number> = {};
    for (let d = 29; d >= 0; d--) {
      const date = new Date();
      date.setDate(date.getDate() - d);
      const key = date.toISOString().slice(0, 10);
      trendMap[key] = 0;
    }
    sales.forEach((s: any) => {
      const key = new Date(s.sale_date).toISOString().slice(0, 10);
      if (trendMap[key] !== undefined) {
        trendMap[key] += Number(s.total_price ?? 0);
      }
    });
    setSalesTrend(
      Object.entries(trendMap).map(([date, revenue]) => ({
        date: date.slice(5),
        revenue: Math.round(revenue),
      }))
    );

    setLoading(false);
  }

  useEffect(() => {
    loadData(selectedStore);
  }, [selectedStore]);

  async function handleSeed() {
    setSeeding(true);
    const res = await fetch("/api/seed", { method: "POST" });
    const data = await res.json();
    setSeeding(false);
    if (res.ok) {
      setSeedDone(true);
      loadData(selectedStore);
    } else {
      alert("Seed failed: " + (data.error ?? "Unknown error"));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Overview of all store performance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StoreSelector
            stores={stores}
            selectedStoreId={selectedStore}
            onSelect={setSelectedStore}
          />
          {!seedDone && (
            <GlassButton
              variant="primary"
              size="sm"
              onClick={handleSeed}
              disabled={seeding}
            >
              {seeding ? "Seeding..." : "Seed Data"}
            </GlassButton>
          )}
        </div>
      </div>

      {kpi && kpi.lowStockCount > 0 && (
        <AlertBanner
          type="warning"
          message={`${kpi.lowStockCount} product${kpi.lowStockCount > 1 ? "s" : ""} below reorder point across stores.`}
        />
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <GlassCard key={i} className="h-28 animate-pulse p-6">
              <div className="h-3 w-24 rounded bg-white/10 dark:bg-gray-800/20" />
              <div className="mt-3 h-6 w-32 rounded bg-white/10 dark:bg-gray-800/20" />
            </GlassCard>
          ))
        ) : (
          <>
            <KpiCard
              title="Total Revenue"
              value={formatCurrency(kpi?.totalRevenue ?? 0)}
              change="+12.5% from last month"
              changeType="positive"
              icon={DollarSign}
            />
            <KpiCard
              title="Total Orders"
              value={formatCompact(kpi?.totalOrders ?? 0)}
              change="+8.2% from last month"
              changeType="positive"
              icon={ShoppingCart}
            />
            <KpiCard
              title="Products"
              value={formatCompact(kpi?.productCount ?? 0)}
              change="Catalog size"
              changeType="neutral"
              icon={Package}
            />
            <KpiCard
              title="Avg Order Value"
              value={formatCurrency(kpi?.avgOrderValue ?? 0)}
              change="+3.8% from last month"
              changeType="positive"
              icon={TrendingUp}
            />
            <KpiCard
              title="Active Staff"
              value={String(kpi?.staffCount ?? 0)}
              changeType="neutral"
              icon={Users}
            />
            <KpiCard
              title="Low Stock Alerts"
              value={String(kpi?.lowStockCount ?? 0)}
              change={kpi?.lowStockCount ? `${kpi.lowStockCount} items below reorder point` : "All stocked"}
              changeType={kpi?.lowStockCount ? "negative" : "positive"}
              icon={AlertTriangle}
            />
          </>
        )}
      </div>

      {/* Charts */}
      {!loading && salesTrend.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <SalesTrend data={salesTrend} />
          <RevenueChart
            data={salesTrend.map((d) => ({
              month: d.date,
              revenue: d.revenue,
              profit: Math.round(d.revenue * 0.32),
            }))}
          />
        </div>
      )}
    </div>
  );
}
