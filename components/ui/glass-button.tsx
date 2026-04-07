import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
}

const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, variant = "default", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          {
            "backdrop-blur-sm bg-white/20 border border-white/30 hover:bg-white/30 dark:bg-gray-800/20 dark:border-gray-600/30 dark:hover:bg-gray-700/30":
              variant === "default",
            "bg-sky-500/80 backdrop-blur-sm text-white border border-sky-400/30 hover:bg-sky-500/90 dark:bg-sky-600/80 dark:border-sky-500/30 dark:hover:bg-sky-600/90":
              variant === "primary",
            "bg-red-500/80 backdrop-blur-sm text-white border border-red-400/30 hover:bg-red-500/90 dark:bg-red-600/80 dark:border-red-500/30 dark:hover:bg-red-600/90":
              variant === "danger",
            "hover:bg-white/10 dark:hover:bg-gray-800/20":
              variant === "ghost",
          },
          {
            "h-8 px-3 text-sm": size === "sm",
            "h-10 px-4 text-sm": size === "md",
            "h-12 px-6 text-base": size === "lg",
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
GlassButton.displayName = "GlassButton";

export { GlassButton };
