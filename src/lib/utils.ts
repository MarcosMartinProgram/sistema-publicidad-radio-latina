/** Utilidades de formato y dominio. Región: es-AR, moneda ARS. */
import type { Cobro, Pauta } from "./types";

export type EstadoMensual = "al_dia" | "pendiente" | "vencida";

export function formatAR$(
  value: number,
  opts: { compact?: boolean; symbol?: boolean } = {}
): string {
  const { compact = false, symbol = true } = opts;
  return new Intl.NumberFormat("es-AR", {
    style: symbol ? "currency" : "decimal",
    currency: "ARS",
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 0 : 2,
    minimumFractionDigits: 0,
  }).format(value);
}

/** Intenta parsear un número como monto ARS (tolera "$", puntos y comas). */
export function parseMonto(value: string): number {
  const limpio = value
    .replace(/[^\d.,-]/g, "")
    .replace(/\.(?=\d{3}\b)/g, "")
    .replace(",", ".");
  const n = parseFloat(limpio);
  return Number.isFinite(n) ? n : 0;
}

export function formatFecha(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function hoyISO(): string {
  const ahora = new Date();
  const yy = ahora.getFullYear();
  const mm = String(ahora.getMonth() + 1).padStart(2, "0");
  const dd = String(ahora.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function sumarDias(iso: string, dias: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

/** Normaliza un número de teléfono argentino a formato internacional +54 11 ... */
export function normalizarTelefono(telefono: string): string {
  const limpio = telefono.replace(/\D/g, "");
  let local = limpio;
  if (local.startsWith("0")) local = local.slice(1);
  if (local.length === 11 && local.startsWith("9")) local = local.slice(1);
  if (!local.startsWith("54")) local = `54${local}`;
  return local;
}

/** Construye la URL de WhatsApp con mensaje prefabricado (probar/copiar). */
export function urlWhatsApp(telefono: string, mensaje: string): string {
  const num = normalizarTelefono(telefono);
  return `https://wa.me/${num}?text=${encodeURIComponent(mensaje)}`;
}

export function abrirWhatsApp(telefono: string, mensaje: string): void {
  window.open(urlWhatsApp(telefono, mensaje), "_blank", "noopener");
}

export function initiales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/);
  return partes
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function esVencido(fechaVencimiento: string): boolean {
  const v = new Date(fechaVencimiento);
  if (Number.isNaN(v.getTime())) return false;
  return v < new Date();
}

/** Mes "AAAA-MM" en hora local de una fecha ISO. */
export function mesDe(iso: string): string {
  return iso.slice(0, 7);
}

/** Lista de meses "AAAA-MM" entre dos fechas, inclusive. */
function mesesEntre(inicio: string, fin: string): string[] {
  const [y0, m0] = inicio.split("-").map(Number);
  const [y1, m1] = fin.split("-").map(Number);
  const meses: string[] = [];
  let y = y0;
  let m = m0;
  while (y < y1 || (y === y1 && m <= m1)) {
    meses.push(`${y}-${String(m).padStart(2, "0")}`);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return meses;
}

/**
 * Estado mensual de una publicidad recurrente con vencimiento acumulativo.
 * Cada mes desde `fecha_inicio` vence un pago (del 1 al 10 de cada mes).
 * - Si algún mes pasado quedó sin cobro aprobado → "vencida", hasta que se
 *   pague ese mes (no se autorecupera con el pago del mes actual).
 * - Si todos los meses pasados están pagos y el mes actual todavía no:
 *   del 1 al 10 → "pendiente"; del 11 en adelante → "vencida".
 * - Si todos los meses (pasados y actual) están pagos → "al_dia".
 * La pauta no se finaliza: sigue mes a mes.
 */
export function estadoPautaMensual(pauta: Pauta, cobros: Cobro[]): EstadoMensual {
  const hoy = hoyISO();
  const mesActual = hoy.slice(0, 7);
  const dia = Number(hoy.slice(8, 10));

  const pagados = new Set(
    cobros
      .filter((c) => c.estado === "aprobado" && c.fecha_pago)
      .map((c) => mesDe(c.fecha_pago)),
  );

  const mesInicio = mesDe(pauta.fecha_inicio);
  const meses = mesesEntre(mesInicio > mesActual ? mesActual : mesInicio, mesActual);

  for (const m of meses) {
    if (m === mesActual) continue;
    if (!pagados.has(m)) return "vencida";
  }

  if (pagados.has(mesActual)) return "al_dia";
  return dia <= 10 ? "pendiente" : "vencida";
}

/** Estado efectivo de un cobro: aprueba si está aprobado; si pasó su fecha de
 *  vencimiento y sigue pendiente → "vencido"; caso contrario → "pendiente". */
export function estadoCobroEfectivo(
  cobro: Pick<Cobro, "estado"> & { fecha_vencimiento: string | null }
): Cobro["estado"] {
  if (cobro.estado === "aprobado") return "aprobado";
  if (cobro.fecha_vencimiento && cobro.fecha_vencimiento < hoyISO()) return "vencido";
  return "pendiente";
}
