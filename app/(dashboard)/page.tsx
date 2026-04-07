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
import { formatCurrency, formatCompact } from "@/lib/utils/formatters";
import { SalesTrend } from "@/components/charts/sales-trend";

interface KpiData {
  totalRevenue: number;
  totalOrders: number;
  productCount: number;
  avgOrderValue: number;
  staffCount: number;
  lowStockCount: number;
}

export default function DashboardPage() {
  const [kpi, setKpi] = useState<KpiData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadKpi() {
      const supabase = createClient();

      const salesRes = await supabase.from("sales").select("total_price");
      const productsRes = await supabase
        .from("products")
        .select("id", { count: "exact", head: true });
      const profilesRes = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true });
      const inventoryRes = await supabase
        .from("inventory")
        .select("quantity, reorder_point");

      const sales = salesRes.data ?? [];
      const totalRevenue = sales.reduce(
        (sum, s) => sum + Number(s.total_price ?? 0),
        0
      );
      const totalOrders = sales.length;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      const inventory = inventoryRes.data ?? [];
      const lowStock = inventory.filter(
        (i) => i.quantity <= i.reorder_point
      ).length;

      setKpi({
        totalRevenue,
        totalOrders,
        productCount: productsRes.count ?? 0,
        avgOrderValue,
        staffCount: profilesRes.count ?? 0,
        lowStockCount: lowStock,
      });
      setLoading(false);
    }

    loadKpi();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Dashboard
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Overview of all store performance
        </p>
      </div>

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
    </div>
  );
}
