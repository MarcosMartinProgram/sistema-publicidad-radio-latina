/**
 * Generación de «recibo no fiscal» en PDF (client-side, sin backend).
 * Layout A4 armado con pdf-lib (sin dependencias de DOM/canvas).
 * El PDF se descarga o se comparte por WhatsApp (Web Share API en móviles);
 * wa.me solo permite mensajes de texto, no adjuntos.
 */
import type { Color, PDFFont, PDFPage } from "pdf-lib";
import { formatAR$, hoyISO } from "./utils";
import type { Cobro, CobroConPauta } from "./types";

export interface DatosReciboNoFiscal {
  nro_recibo: string;
  /** Fecha del cobro en formato ISO (AAAA-MM-DD). */
  fecha: string;
  cliente: string;
  cuit: string | null;
  telefono: string;
  pauta: string;
  /** Ej. "septiembre de 2026". */
  periodo: string;
  monto: number;
  metodo: string;
  nota: string | null;
}

export const METODO_LABEL: Record<Cobro["metodo"], string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  mercadopago: "Mercado Pago",
  otro: "Otro",
};

const RADIO = "Radio Latina Du Graty 102.3 Mhz";
const SUBTITULO = "Publicidad · FM · Du Graty, Chaco · Argentina";

/** A4 en puntos: 210mm × 297mm a 72dpi. */
const W = 595.28;
const H = 841.89;
const MX = 40;

/** Mes y año en letras (es-AR) de una fecha ISO. */
export function periodoDe(iso: string): string {
  if (!iso) return "";
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" }).format(d);
}

/** Mapea un cobro (con pauta y cliente) a los datos del recibo. */
export function datosReciboDeCobro(cobro: CobroConPauta): DatosReciboNoFiscal | null {
  if (!cobro.nro_recibo) return null;
  const fecha = cobro.fecha_pago || hoyISO();
  return {
    nro_recibo: cobro.nro_recibo,
    fecha,
    cliente: cobro.pautas?.clientes?.nombre ?? "Cliente",
    cuit: cobro.pautas?.clientes?.cuit ?? null,
    telefono: cobro.pautas?.clientes?.telefono ?? "",
    pauta: cobro.pautas?.nombre ?? "Publicidad",
    periodo: periodoDe(fecha),
    monto: Number(cobro.monto),
    metodo: METODO_LABEL[cobro.metodo] ?? cobro.metodo,
    nota: cobro.nota,
  };
}

/** Nombre de archivo seguro para el PDF (Windows + WhatsApp). */
export function nombreArchivoRecibo(datos: DatosReciboNoFiscal): string {
  const cliente = datos.cliente.replace(/[\\/:*?"<>|]+/g, "").trim().replace(/\s+/g, "_");
  return `Recibo_${datos.nro_recibo}_${cliente || "Cliente"}.pdf`;
}

/** Genera el PDF del recibo no fiscal y devuelve sus bytes.
 *  pdf-lib se importa bajo demanda (dynamic import) para no inflar el
 *  bundle inicial de la app. */
export async function generarPDFReciboNoFiscal(
  datos: DatosReciboNoFiscal
): Promise<Uint8Array> {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const AZUL = rgb(0, 0x28 / 255, 0x8e / 255);
  const TINTA = rgb(0.13, 0.16, 0.25);
  const GRIS = rgb(0.5, 0.53, 0.6);
  const LINEA = rgb(0.886, 0.91, 0.941);
  const FONDO = rgb(0.973, 0.976, 1);
  const BLANCO = rgb(1, 1, 1);

  const doc = await PDFDocument.create();
  const page = doc.addPage([W, H]);
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  /* Encabezado azul */
  page.drawRectangle({ x: 0, y: H - 96, width: W, height: 96, color: AZUL });
  page.drawText(RADIO, { x: MX, y: H - 38, size: 19, font: bold, color: BLANCO });
  page.drawText(SUBTITULO, { x: MX, y: H - 56, size: 11, color: BLANCO });
  rightText(page, bold, 15, "RECIBO NO FISCAL", W - MX, 38, BLANCO);
  rightText(page, bold, 13, `N° ${datos.nro_recibo}`, W - MX, 58, BLANCO);

  /* Cajón emisor / datos del recibo */
  cajon(page, 128, 212, FONDO, LINEA);
  etiqueta(page, regular, "EMITIDO POR", MX + 14, 146, GRIS);
  page.drawText(RADIO, { x: MX + 14, y: H - 166, size: 12, font: bold, color: TINTA });
  page.drawText("Publicidad · FM   |   Du Graty, Chaco, Argentina", {
    x: MX + 14,
    y: H - 184,
    size: 9.5,
    font: regular,
    color: GRIS,
  });
  etiqueta(page, regular, "N° DE RECIBO", W / 2 + 16, 146, GRIS);
  page.drawText(datos.nro_recibo, {
    x: W / 2 + 16,
    y: H - 166,
    size: 14,
    font: bold,
    color: AZUL,
  });
  etiqueta(page, regular, "FECHA", W / 2 + 16, 186, GRIS);
  page.drawText(fechaCorta(datos.fecha), {
    x: W / 2 + 16,
    y: H - 202,
    size: 11,
    font: bold,
    color: TINTA,
  });

  /* Datos del cliente */
  tituloSeccion(page, regular, "DATOS DEL CLIENTE", 244, GRIS);
  cajon(page, 256, 344, FONDO, LINEA);
  etiqueta(page, regular, "CLIENTE", MX + 14, 276, GRIS);
  page.drawText(datos.cliente, {
    x: MX + 14,
    y: H - 294,
    size: 12.5,
    font: bold,
    color: TINTA,
  });
  etiqueta(page, regular, "CUIT", MX + 14, 316, GRIS);
  page.drawText(datos.cuit || "—", { x: MX + 14, y: H - 330, size: 11, font: regular, color: TINTA });
  etiqueta(page, regular, "TELÉFONO", W / 2 + 16, 316, GRIS);
  page.drawText(datos.telefono || "—", {
    x: W / 2 + 16,
    y: H - 330,
    size: 11,
    font: regular,
    color: TINTA,
  });

  /* Detalle del pago */
  tituloSeccion(page, regular, "DETALLE DEL PAGO", 376, GRIS);
  etiqueta(page, regular, "DESCRIPCIÓN", MX, 398, GRIS);
  rightText(page, regular, 8.5, "IMPORTE", W - MX, 398, GRIS);
  page.drawLine({ start: { x: MX, y: H - 410 }, end: { x: W - MX, y: H - 410 }, thickness: 0.6, color: LINEA });

  const descripcion = `Publicidad "${datos.pauta}" — ${datos.periodo}`;
  const lineasDesc = wrap(regular, 11, descripcion, W - 2 * MX - 120);
  let y = 436;
  for (const l of lineasDesc) {
    page.drawText(l, { x: MX, y: H - y, size: 11, font: regular, color: TINTA });
    y += 15;
  }
  rightText(page, bold, 12, formatAR$(datos.monto), W - MX, 436, TINTA);
  page.drawText(`Método de pago: ${datos.metodo}`, {
    x: MX,
    y: H - y,
    size: 10,
    font: regular,
    color: GRIS,
  });
  y += 22;

  if (datos.nota?.trim()) {
    let ny = y + 4;
    etiqueta(page, regular, "NOTA", MX, y, GRIS);
    for (const l of wrap(regular, 10, datos.nota.trim(), W - 2 * MX)) {
      page.drawText(l, { x: MX, y: H - (ny + 14), size: 10, font: regular, color: TINTA });
      ny += 14;
    }
    y = ny + 4;
  }

  /* Total */
  page.drawRectangle({ x: MX, y: H - (y + 30), width: W - 2 * MX, height: 30, color: FONDO });
  page.drawText("TOTAL", { x: MX + 14, y: H - (y + 20), size: 12, font: bold, color: TINTA });
  rightText(page, bold, 15, formatAR$(datos.monto), W - MX - 14, y + 20, AZUL);
  y += 54;

  /* Aclaración de comprobante no fiscal */
  const exen = [
    "Documento no fiscal. Este comprobante no es apto como factura ni como",
    "comprobante de crédito fiscal (Ley 11.683 y normas complementarias).",
  ];
  y += 8;
  for (const l of exen) {
    page.drawText(l, { x: MX, y: H - y, size: 9, font: regular, color: GRIS });
    y += 13;
  }

  /* Firma */
  page.drawLine({
    start: { x: MX, y: H - 722 },
    end: { x: MX + 150, y: H - 722 },
    thickness: 0.7,
    color: GRIS,
  });
  page.drawText("Firma y aclaración", { x: MX, y: H - 738, size: 9, font: regular, color: GRIS });

  /* Pie de página */
  const pie = `${RADIO} · ${SUBTITULO}`;
  const anchoPie = regular.widthOfTextAtSize(pie, 8.5);
  page.drawText(pie, { x: (W - anchoPie) / 2, y: 34, size: 8.5, font: regular, color: GRIS });

  return doc.save();
}

/** Descarga directamente el PDF (desktop / respaldo). */
export function descargarPDF(bytes: Uint8Array, nombre: string): void {
  const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Genera y envía el recibo PDF: en móviles usa el share del sistema
 * (donde WhatsApp es una opción para adjuntar el archivo); si el
 * navegador no soporta compartir archivos, lo descarga.
 */
export async function compartirODescargarRecibo(
  datos: DatosReciboNoFiscal
): Promise<"enviado" | "descargado"> {
  const bytes = await generarPDFReciboNoFiscal(datos);
  const nombre = nombreArchivoRecibo(datos);
  if (typeof navigator !== "undefined" && typeof navigator.canShare === "function") {
    const file = new File([bytes as BlobPart], nombre, { type: "application/pdf" });
    if (navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: "Recibo no fiscal",
          text: `Recibo ${datos.nro_recibo} · Radio Latina Du Graty 102.3 Mhz`,
        });
        return "enviado";
      } catch {
        /* El usuario canceló el share; se descarga como respaldo. */
      }
    }
  }
  descargarPDF(bytes, nombre);
  return "descargado";
}

/* ------------------------------------------------------------------ */
/* Helpers de dibujo                                                   */
/* ------------------------------------------------------------------ */

/** Texto alineado a la derecha (xRight es la coordenada del borde derecho). */
function rightText(
  page: PDFPage,
  font: PDFFont,
  size: number,
  texto: string,
  xRight: number,
  yTop: number,
  color: Color
): void {
  const ancho = font.widthOfTextAtSize(texto, size);
  page.drawText(texto, { x: xRight - ancho, y: H - yTop, size, font, color });
}

/** Cajón con borde y fondo suave (coordenadas desde arriba). */
function cajon(
  page: PDFPage,
  yDesde: number,
  yHasta: number,
  colorFondo: Color,
  colorBorde: Color
): void {
  page.drawRectangle({
    x: MX,
    y: H - yHasta,
    width: W - 2 * MX,
    height: yHasta - yDesde,
    color: colorFondo,
    borderColor: colorBorde,
    borderWidth: 0.8,
  });
}

function etiqueta(
  page: PDFPage,
  font: PDFFont,
  texto: string,
  x: number,
  yTop: number,
  color: Color
): void {
  page.drawText(texto, { x, y: H - yTop, size: 8, font, color });
}

/** Título de sección en mayúsculas. */
function tituloSeccion(
  page: PDFPage,
  font: PDFFont,
  texto: string,
  yTop: number,
  color: Color
): void {
  page.drawText(texto, { x: MX, y: H - yTop, size: 9.5, font, color });
}

/** Parte las líneas que no entran en maxWidth según el ancho del texto. */
function wrap(font: PDFFont, size: number, texto: string, maxWidth: number): string[] {
  const lineas: string[] = [];
  let actual = "";
  for (const palabra of texto.trim().split(/\s+/)) {
    const candidata = actual ? `${actual} ${palabra}` : palabra;
    if (font.widthOfTextAtSize(candidata, size) <= maxWidth) {
      actual = candidata;
    } else {
      if (actual) lineas.push(actual);
      actual = palabra;
    }
  }
  if (actual) lineas.push(actual);
  return lineas;
}

/** Fecha corta numérica: 05/09/2026. */
function fechaCorta(iso: string): string {
  if (!iso) return "—";
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}