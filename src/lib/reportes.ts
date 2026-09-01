/** Lógica pura de reportes. Se calcula sobre cobros aprobados (ingresos reales). */
import type { CobroConPauta } from "./types";

export type PeriodoReporte = "mensual" | "anual" | "intervalo";

export interface SerieIngreso {
  clave: string;
  etiqueta: string;
  cantidad: number;
  total: number;
}

export interface GrupoCliente {
  cliente: string;
  cantidad: number;
  total: number;
}

export interface GrupoCampana {
  campana: string;
  cliente: string;
  cantidad: number;
  total: number;
}

function aprobados(cobros: CobroConPauta[]): CobroConPauta[] {
  return cobros.filter((c) => c.estado === "aprobado" && c.fecha_pago);
}

/** Filtra por rango de fechas (inclusive) sobre `fecha_pago`. Rango vacío = sin filtro. */
export function filtrarPorRango(
  cobros: CobroConPauta[],
  desde: string,
  hasta: string,
): CobroConPauta[] {
  return cobros.filter((c) => {
    const f = (c.fecha_pago ?? "").slice(0, 10);
    if (desde && f < desde) return false;
    if (hasta && f > hasta) return false;
    return true;
  });
}

function etiquetaPeriodo(clave: string, granularidad: "mensual" | "anual"): string {
  const [y, m] = clave.split("-").map(Number);
  if (granularidad === "anual") return String(y);
  const fecha = new Date(y, m - 1, 1);
  return new Intl.DateTimeFormat("es-AR", { month: "short", year: "numeric" }).format(fecha);
}

/** Agrupa los ingresos (cobros aprobados) por mes (AAAA-MM) o año (AAAA). */
export function ingresosPorPeriodo(
  cobros: CobroConPauta[],
  granularidad: "mensual" | "anual",
): SerieIngreso[] {
  const grupos = new Map<string, SerieIngreso>();
  for (const c of aprobados(cobros)) {
    const fecha = (c.fecha_pago ?? "").slice(0, 10);
    const clave =
      granularidad === "mensual" ? fecha.slice(0, 7) : fecha.slice(0, 4);
    if (!clave) continue;
    const g = grupos.get(clave) ?? { clave, etiqueta: "", cantidad: 0, total: 0 };
    g.cantidad += 1;
    g.total += Number(c.monto);
    grupos.set(clave, g);
  }
  return [...grupos.values()]
    .map((g) => ({ ...g, etiqueta: etiquetaPeriodo(g.clave, granularidad) }))
    .sort((a, b) => a.clave.localeCompare(b.clave));
}

/** Total y cantidad de cobros aprobados en un periodo (resumen). */
export function totalIngresos(cobros: CobroConPauta[]): { total: number; cantidad: number } {
  const val = aprobados(cobros);
  return val.reduce(
    (acc, c) => ({ total: acc.total + Number(c.monto), cantidad: acc.cantidad + 1 }),
    { total: 0, cantidad: 0 },
  );
}

/** Pagos aprobados agrupados por cliente (nombre). */
export function pagosPorCliente(cobros: CobroConPauta[]): GrupoCliente[] {
  const grupos = new Map<string, GrupoCliente>();
  for (const c of aprobados(cobros)) {
    const nombre = c.pautas?.clientes?.nombre ?? "Sin cliente";
    const g = grupos.get(nombre) ?? { cliente: nombre, cantidad: 0, total: 0 };
    g.cantidad += 1;
    g.total += Number(c.monto);
    grupos.set(nombre, g);
  }
  return [...grupos.values()].sort((a, b) => b.total - a.total);
}

/** Pagos aprobados agrupados por campaña (nombre de la pauta). */
export function pagosPorCampana(cobros: CobroConPauta[]): GrupoCampana[] {
  const grupos = new Map<string, GrupoCampana>();
  for (const c of aprobados(cobros)) {
    const nombre = c.pautas?.nombre ?? "Sin campaña";
    const cliente = c.pautas?.clientes?.nombre ?? "—";
    const g = grupos.get(nombre) ?? { campana: nombre, cliente, cantidad: 0, total: 0 };
    g.cantidad += 1;
    g.total += Number(c.monto);
    grupos.set(nombre, g);
  }
  return [...grupos.values()].sort((a, b) => b.total - a.total);
}