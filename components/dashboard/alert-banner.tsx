import { AlertTriangle, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { GlassCard } from "@/components/ui/glass-card";

interface AlertBannerProps {
  type: "info" | "warning" | "error";
  message: string;
  onDismiss?: () => void;
  className?: string;
}

const iconMap = {
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
};

const styleMap = {
  info: "border-sky-400/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  warning: "border-amber-400/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  error: "border-red-400/30 bg-red-500/10 text-red-700 dark:text-red-300",
};

export function AlertBanner({ type, message, onDismiss, className }: AlertBannerProps) {
  const Icon = iconMap[type];

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border px-4 py-3 text-sm backdrop-blur-sm",
        styleMap[type],
        className
      )}
      role="alert"
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Dismiss alert"
        >
          ×
        </button>
      )}
    </div>
  );
}
