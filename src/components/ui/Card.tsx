import type { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLDivElement> & { title?: string; action?: React.ReactNode };

export function Card({ title, action, children, className = "", ...props }: Props) {
  return (
    <div className={`card p-5 ${className}`} {...props}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between">
          {title && <h3 className="text-headline-sm text-on-surface">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
