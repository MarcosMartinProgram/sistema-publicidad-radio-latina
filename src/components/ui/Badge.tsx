import type { HTMLAttributes } from "react";

type Tone = "success" | "warning" | "danger" | "neutral" | "info" | "primary";

const tones: Record<Tone, { badge: string; dot: string }> = {
  success: { badge: "bg-success-600/10 text-success-600", dot: "bg-success-600" },
  warning: { badge: "bg-warning-500/10 text-warning-500", dot: "bg-warning-500" },
  danger: { badge: "bg-danger-600/10 text-danger-600", dot: "bg-danger-600" },
  neutral: { badge: "bg-surface-container-low text-on-surface-variant", dot: "bg-outline" },
  info: { badge: "bg-primary/10 text-primary", dot: "bg-primary" },
  primary: { badge: "bg-surface-container-high text-primary", dot: "bg-primary" },
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  dot?: boolean;
}

export function Badge({ tone = "neutral", dot, children, className = "", ...props }: BadgeProps) {
  const t = tones[tone];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-label-md ${t.badge} ${className}`}
      {...props}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${t.dot}`} />}
      {children}
    </span>
  );
}

export function EstatusCobroBadge({ estado }: { estado: string }) {
  const map: Record<string, { t: Tone; label: string }> = {
    pendiente: { t: "warning", label: "Pendiente" },
    aprobado: { t: "success", label: "Aprobado" },
    vencido: { t: "danger", label: "Vencido" },
  };
  const m = map[estado] ?? { t: "neutral", label: estado };
  return (
    <Badge tone={m.t} dot>
      {m.label}
    </Badge>
  );
}

export function EstatusPautaBadge({ estado }: { estado: string }) {
  const map: Record<string, { t: Tone; label: string }> = {
    activa: { t: "success", label: "Activa" },
    pausada: { t: "warning", label: "Pausada" },
    finalizada: { t: "primary", label: "Finalizada" },
  };
  const m = map[estado] ?? { t: "neutral", label: estado };
  return (
    <Badge tone={m.t} dot>
      {m.label}
    </Badge>
  );
}
