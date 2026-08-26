/** Utilidades de formato y dominio. Región: es-AR, moneda ARS. */

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
  return new Date().toISOString().slice(0, 10);
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
  if (local.length === 10 && local.startsWith("9")) local = local.slice(1);
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
