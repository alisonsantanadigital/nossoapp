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
          "inline-flex items-center justify-center rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
          {
            "bg-sky-500 text-white hover:bg-sky-400 shadow-lg shadow-sky-500/20":
              variant === "primary",
            "bg-slate-100 text-slate-900 hover:bg-slate-200":
              variant === "secondary",
            "border border-slate-300 hover:bg-slate-100 text-slate-200":
              variant === "outline",
            "hover:bg-slate-100 text-slate-600": variant === "ghost",
            "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20":
              variant === "danger",
            "h-9 px-3 text-sm": size === "sm",
            "h-11 px-4 py-2": size === "md",
            "h-14 px-8 text-lg rounded-2xl": size === "lg",
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
