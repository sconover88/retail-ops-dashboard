"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { GlassCard } from "@/components/ui/glass-card";

interface RevenueChartProps {
  data: { month: string; fullDate?: string; revenue: number; profit: number }[];
  className?: string;
}

export function RevenueChart({ data, className }: RevenueChartProps) {
  return (
    <GlassCard className={className}>
      <div className="p-6">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Revenue & Profit
        </h3>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value) => `$${Number(value).toLocaleString()}`}
                labelFormatter={(_label, payload) => {
                  const item = payload?.[0]?.payload;
                  return item?.fullDate ? `${_label} — ${item.fullDate}` : _label;
                }}
                contentStyle={{ backgroundColor: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.5rem", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}
                labelStyle={{ color: "#94a3b8", fontWeight: 500 }}
                itemStyle={{ color: "#e2e8f0" }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#0ea5e9"
                fill="#0ea5e9"
                fillOpacity={0.1}
              />
              <Area
                type="monotone"
                dataKey="profit"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.1}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </GlassCard>
  );
}
