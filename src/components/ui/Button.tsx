import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success";
type Size = "sm" | "md" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  full?: boolean;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-md font-semibold transition focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-on-primary hover:bg-primary-container",
  secondary: "bg-surface text-on-surface border border-border hover:bg-surface-container-low",
  ghost: "bg-transparent text-on-surface hover:bg-surface-container-low",
  danger: "bg-danger-600 text-white hover:bg-red-700",
  success: "bg-success-600 text-white hover:bg-emerald-700",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-body-sm",
  md: "h-10 px-4 text-body-md",
  icon: "h-9 w-9",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading, full, children, className = "", ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={`${base} ${variants[variant]} ${sizes[size]} ${full ? "w-full" : ""} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
});
