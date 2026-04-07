import { GlassCard } from "@/components/ui/glass-card";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-white/10 dark:bg-gray-800/20 ${className ?? ""}`}
    />
  );
}

export function CardSkeleton() {
  return (
    <GlassCard className="p-6">
      <Skeleton className="h-3 w-24 mb-3" />
      <Skeleton className="h-7 w-32 mb-2" />
      <Skeleton className="h-3 w-20" />
    </GlassCard>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <GlassCard className="p-4">
      <Skeleton className="h-8 w-full mb-4" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full mb-2" />
      ))}
    </GlassCard>
  );
}
