import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "success" | "warning" | "danger" | "primary";
  icon?: ReactNode;
}

const dotTone: Record<string, string> = {
  neutral: "bg-outline",
  success: "bg-success-600",
  warning: "bg-warning-500",
  danger: "bg-danger-600",
  primary: "bg-primary",
};

export function StatCard({ label, value, hint, tone = "neutral", icon }: StatCardProps) {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-label-md uppercase tracking-wider text-on-surface-variant">{label}</p>
          <p className="mt-1 text-headline-md font-semibold text-on-surface">{value}</p>
          {hint && <p className="mt-0.5 text-body-sm text-on-surface-variant">{hint}</p>}
        </div>
        <span className={`h-2.5 w-2.5 rounded-full ${dotTone[tone]}`} title={tone} />
        {icon}
      </div>
    </div>
  );
}
