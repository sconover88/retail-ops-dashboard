import { cn } from "@/lib/utils/cn";
import { GlassCard } from "@/components/ui/glass-card";
import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  className?: string;
}

export function KpiCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  className,
}: KpiCardProps) {
  return (
    <GlassCard className={cn("p-6", className)}>
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {title}
          </span>
          <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {value}
          </span>
          {change && (
            <span
              className={cn("text-xs font-medium", {
                "text-emerald-600 dark:text-emerald-400": changeType === "positive",
                "text-red-600 dark:text-red-400": changeType === "negative",
                "text-gray-500 dark:text-gray-400": changeType === "neutral",
              })}
            >
              {change}
            </span>
          )}
        </div>
        <div className="rounded-lg bg-sky-500/10 p-2.5 dark:bg-sky-400/10">
          <Icon className="h-5 w-5 text-sky-600 dark:text-sky-400" />
        </div>
      </div>
    </GlassCard>
  );
}
