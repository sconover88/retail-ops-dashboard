"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { GlassCard } from "@/components/ui/glass-card";

interface SalesTrendProps {
  data: { date: string; fullDate?: string; revenue: number }[];
  className?: string;
}

export function SalesTrend({ data, className }: SalesTrendProps) {
  return (
    <GlassCard className={className}>
      <div className="p-6">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Sales Trend
        </h3>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value) => [`$${Number(value).toLocaleString()}`, "Revenue"]}
                labelFormatter={(_label, payload) => {
                  const item = payload?.[0]?.payload;
                  return item?.fullDate ? `${_label} — ${item.fullDate}` : _label;
                }}
                contentStyle={{ backgroundColor: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.5rem", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}
                labelStyle={{ color: "#94a3b8", fontWeight: 500 }}
                itemStyle={{ color: "#e2e8f0" }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#0ea5e9"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </GlassCard>
  );
}
