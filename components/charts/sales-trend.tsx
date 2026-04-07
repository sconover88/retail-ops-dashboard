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
  data: { date: string; revenue: number }[];
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
              <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, "Revenue"]} />
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
