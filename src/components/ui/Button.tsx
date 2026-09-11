import React from "react";
import { cn } from "../../lib/utils";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={loading || props.disabled}
        className={cn(
          "inline-flex items-center justify-center rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
          {
            "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-indigo-500/25":
              variant === "primary",
            "bg-white/5 text-white hover:bg-white/10":
              variant === "secondary",
            "border border-white/10 hover:bg-white/[0.04] text-slate-200":
              variant === "outline",
            "hover:bg-white/[0.04] text-slate-300": variant === "ghost",
            "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20":
              variant === "danger",
            "h-9 px-3 text-sm": size === "sm",
            "h-11 px-4 py-2": size === "md",
            "h-14 px-8 text-lg rounded-full": size === "lg",
            "h-10 w-10": size === "icon",
          },
          className,
        )}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
