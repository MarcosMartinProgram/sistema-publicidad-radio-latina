import type { InputHTMLAttributes, SelectHTMLAttributes } from "react";
import { forwardRef } from "react";

interface FieldProps {
  label?: string;
  error?: string;
}

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & FieldProps
>(function Input({ label, error, className = "", id, ...props }, ref) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="label">
          {label}
        </label>
      )}
      <input ref={ref} id={id} className={`input ${error ? "border-danger-600" : ""} ${className}`} {...props} />
      {error && <p className="mt-1 text-body-sm text-danger-600">{error}</p>}
    </div>
  );
});

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement>, FieldProps {}

export function Select({ label, error, className = "", id, children, ...props }: SelectProps) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="label">
          {label}
        </label>
      )}
      <select id={id} className={`input ${error ? "border-danger-600" : ""} ${className}`} {...props}>
        {children}
      </select>
      {error && <p className="mt-1 text-body-sm text-danger-600">{error}</p>}
    </div>
  );
}
