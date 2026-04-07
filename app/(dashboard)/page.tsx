import {
  DollarSign,
  ShoppingCart,
  Package,
  TrendingUp,
  Users,
  AlertTriangle,
} from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";

export default function DashboardPage() {
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
        <KpiCard
          title="Total Revenue"
          value="$124,563"
          change="+12.5% from last month"
          changeType="positive"
          icon={DollarSign}
        />
        <KpiCard
          title="Total Orders"
          value="1,234"
          change="+8.2% from last month"
          changeType="positive"
          icon={ShoppingCart}
        />
        <KpiCard
          title="Products"
          value="856"
          change="23 new this month"
          changeType="neutral"
          icon={Package}
        />
        <KpiCard
          title="Avg Order Value"
          value="$101.02"
          change="+3.8% from last month"
          changeType="positive"
          icon={TrendingUp}
        />
        <KpiCard
          title="Active Staff"
          value="48"
          change="2 new hires"
          changeType="neutral"
          icon={Users}
        />
        <KpiCard
          title="Low Stock Alerts"
          value="12"
          change="5 critical"
          changeType="negative"
          icon={AlertTriangle}
        />
      </div>
    </div>
  );
}
