"use client";

import { useEffect, useState } from "react";
import { DollarSign, TrendingUp, TrendingDown, PieChart } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { GlassCard } from "@/components/ui/glass-card";
import { RevenueChart } from "@/components/charts/revenue-chart";
import { SalesTrend } from "@/components/charts/sales-trend";
import { StoreSelector } from "@/components/dashboard/store-selector";
import { formatCurrency } from "@/lib/utils/formatters";

interface StoreRevenue {
  store_id: string;
  store_name: string;
  revenue: number;
}

export default function FinancePage() {
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState<{ id: string; name: string }[]>([]);
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [weeklyData, setWeeklyData] = useState<{ date: string; revenue: number }[]>([]);
  const [monthlyData, setMonthlyData] = useState<{ month: string; revenue: number; profit: number }[]>([]);
  const [storeRevenues, setStoreRevenues] = useState<StoreRevenue[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const supabase = createClient();

      const storesRes = await supabase.from("stores").select("id, name").order("name");
      setStores(storesRes.data ?? []);
      const storeMap = new Map((storesRes.data ?? []).map((s: any) => [s.id, s.name]));

      let query = supabase.from("sales").select("total_price, unit_price, quantity, sale_date, store_id");
      if (selectedStore) query = query.eq("store_id", selectedStore);
      const salesRes = await query;
      const sales = salesRes.data ?? [];

      const rev = sales.reduce((s: number, v: any) => s + Number(v.total_price ?? 0), 0);
      const cost = rev * 0.62; // simulated COGS
      setTotalRevenue(rev);
      setTotalProfit(rev - cost);
      setTotalCost(cost);
      setOrderCount(sales.length);

      // Weekly trend (last 12 weeks)
      const weekMap: Record<string, number> = {};
      for (let w = 11; w >= 0; w--) {
        const d = new Date();
        d.setDate(d.getDate() - w * 7);
        const key = `W${12 - w}`;
        weekMap[key] = 0;
      }
      sales.forEach((s: any) => {
        const d = new Date(s.sale_date);
        const weeksAgo = Math.floor((Date.now() - d.getTime()) / (7 * 24 * 60 * 60 * 1000));
        if (weeksAgo < 12) {
          const key = `W${12 - weeksAgo}`;
          if (weekMap[key] !== undefined) weekMap[key] += Number(s.total_price ?? 0);
        }
      });
      setWeeklyData(Object.entries(weekMap).map(([date, revenue]) => ({ date, revenue: Math.round(revenue) })));

      // Monthly data (last 6 months)
      const mMap: Record<string, number> = {};
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      for (let m = 5; m >= 0; m--) {
        const d = new Date();
        d.setMonth(d.getMonth() - m);
        const key = months[d.getMonth()];
        mMap[key] = 0;
      }
      sales.forEach((s: any) => {
        const d = new Date(s.sale_date);
        const key = months[d.getMonth()];
        if (mMap[key] !== undefined) mMap[key] += Number(s.total_price ?? 0);
      });
      setMonthlyData(
        Object.entries(mMap).map(([month, revenue]) => ({
          month,
          revenue: Math.round(revenue),
          profit: Math.round(revenue * 0.38),
        }))
      );

      // Revenue by store
      const byStore: Record<string, number> = {};
      sales.forEach((s: any) => {
        byStore[s.store_id] = (byStore[s.store_id] ?? 0) + Number(s.total_price ?? 0);
      });
      setStoreRevenues(
        Object.entries(byStore)
          .map(([store_id, revenue]) => ({
            store_id,
            store_name: storeMap.get(store_id) ?? store_id,
            revenue,
          }))
          .sort((a, b) => b.revenue - a.revenue)
      );

      setLoading(false);
    }
    load();
  }, [selectedStore]);

  const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : "0";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Finance</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Financial overview and revenue analytics.</p>
        </div>
        <StoreSelector stores={stores} selectedStoreId={selectedStore} onSelect={setSelectedStore} />
      </div>

      {/* Finance KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <GlassCard key={i} className="h-28 animate-pulse p-6">
              <div className="h-3 w-20 rounded bg-white/10 dark:bg-gray-800/20" />
              <div className="mt-3 h-6 w-28 rounded bg-white/10 dark:bg-gray-800/20" />
            </GlassCard>
          ))
        ) : (
          <>
            <KpiCard title="Total Revenue" value={formatCurrency(totalRevenue)} icon={DollarSign} changeType="positive" change={`${orderCount} orders`} />
            <KpiCard title="Gross Profit" value={formatCurrency(totalProfit)} icon={TrendingUp} changeType="positive" change={`${profitMargin}% margin`} />
            <KpiCard title="Total COGS" value={formatCurrency(totalCost)} icon={TrendingDown} changeType="negative" change="62% of revenue" />
            <KpiCard title="Avg Order Value" value={formatCurrency(orderCount > 0 ? totalRevenue / orderCount : 0)} icon={PieChart} changeType="neutral" />
          </>
        )}
      </div>

      {/* Charts */}
      {!loading && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <SalesTrend data={weeklyData} className="" />
          <RevenueChart data={monthlyData} className="" />
        </div>
      )}

      {/* Revenue by Store */}
      {!loading && !selectedStore && storeRevenues.length > 0 && (
        <GlassCard className="p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">Revenue by Store</h3>
          <div className="space-y-3">
            {storeRevenues.map((s) => {
              const pct = totalRevenue > 0 ? (s.revenue / totalRevenue) * 100 : 0;
              return (
                <div key={s.store_id} className="flex items-center gap-4">
                  <span className="w-40 truncate text-sm text-gray-700 dark:text-gray-300">{s.store_name}</span>
                  <div className="flex-1 h-3 rounded-full bg-white/10 dark:bg-gray-800/20 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-sky-500/60"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-24 text-right text-sm font-medium text-gray-900 dark:text-gray-100">
                    {formatCurrency(s.revenue)}
                  </span>
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
