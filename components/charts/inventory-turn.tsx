"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { GlassCard } from "@/components/ui/glass-card";

interface InventoryTurnProps {
  data: { category: string; turnover: number }[];
  className?: string;
}

export function InventoryTurn({ data, className }: InventoryTurnProps) {
  return (
    <GlassCard className={className}>
      <div className="p-6">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Inventory Turnover by Category
        </h3>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="category" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="turnover" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </GlassCard>
  );
}
