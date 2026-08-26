import type { ReactNode } from "react";
import { initiales } from "@/lib/utils";

interface Column<T> {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  rows: T[];
  empty?: string;
}

export function Table<T>({ columns, rows, empty = "Sin datos." }: TableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-border bg-surface-container-low">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-3 py-2.5 text-label-md uppercase tracking-wider text-on-surface-variant ${col.className ?? ""}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-3 py-10 text-center text-body-md text-on-surface-variant">
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr
                key={i}
                className="border-b border-border transition-colors last:border-0 hover:bg-background-alt"
              >
                {columns.map((col) => (
                  <td key={col.key} className={`px-3 py-2.5 text-table-data text-on-surface ${col.className ?? ""}`}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export function Avatar({ nombre }: { nombre: string }) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary-container text-label-md font-semibold text-primary">
      {initiales(nombre)}
    </span>
  );
}
