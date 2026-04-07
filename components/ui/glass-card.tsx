import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "solid" | "subtle";
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl border shadow-xl",
          {
            "backdrop-blur-md bg-white/10 border-white/20 dark:bg-gray-900/10 dark:border-gray-700/20":
              variant === "default",
            "backdrop-blur-md bg-white/30 border-white/30 dark:bg-gray-900/30 dark:border-gray-700/30":
              variant === "solid",
            "backdrop-blur-sm bg-white/5 border-white/10 dark:bg-gray-900/5 dark:border-gray-700/10":
              variant === "subtle",
          },
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
GlassCard.displayName = "GlassCard";

export { GlassCard };
