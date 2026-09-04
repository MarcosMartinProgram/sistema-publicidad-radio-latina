import { describe, it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import {
  periodoDe,
  datosReciboDeCobro,
  nombreArchivoRecibo,
  generarPDFReciboNoFiscal,
} from "@/lib/recibo";
import type { CobroConPauta } from "@/lib/types";

const cobroEjemplo = {
  id: "c1",
  user_id: "u1",
  pauta_id: "p1",
  monto: 15000,
  metodo: "transferencia",
  fecha_pago: "2026-09-05",
  fecha_vencimiento: "2026-09-10",
  estado: "aprobado",
  nro_recibo: "006-0000100",
  nota: "Primer mes",
  created_at: "2026-09-05T10:00:00Z",
  pautas: {
    nombre: "Spot Mañanas",
    clientes: { nombre: "Bazar La Vecina", telefono: "5492233344444", cuit: "27-11223344-5" },
  },
} as unknown as CobroConPauta;

describe("periodoDe", () => {
  it("devuelve mes y año en letras (es-AR)", () => {
    expect(periodoDe("2026-09-05")).toBe("septiembre de 2026");
  });

  it("devuelve vacío con fecha inválida", () => {
    expect(periodoDe("")).toBe("");
    expect(periodoDe("no-es-fecha")).toBe("");
  });
});

describe("datosReciboDeCobro", () => {
  it("mapea el cobro a los datos del recibo", () => {
    const datos = datosReciboDeCobro(cobroEjemplo);
    expect(datos).toMatchObject({
      nro_recibo: "006-0000100",
      fecha: "2026-09-05",
      cliente: "Bazar La Vecina",
      cuit: "27-11223344-5",
      telefono: "5492233344444",
      pauta: "Spot Mañanas",
      periodo: "septiembre de 2026",
      monto: 15000,
      metodo: "Transferencia",
      nota: "Primer mes",
    });
  });

  it("devuelve null si el cobro aún no tiene número de recibo", () => {
    const sinRecibo = { ...cobroEjemplo, nro_recibo: null } as unknown as CobroConPauta;
    expect(datosReciboDeCobro(sinRecibo)).toBeNull();
  });

  it("usa valores de respaldo cuando faltan cliente y pauta", () => {
    const minimo = {
      ...cobroEjemplo,
      nro_recibo: "006-0000100",
      pautas: { nombre: null, clientes: null },
    } as unknown as CobroConPauta;
    const datos = datosReciboDeCobro(minimo);
    expect(datos?.cliente).toBe("Cliente");
    expect(datos?.pauta).toBe("Publicidad");
  });
});

describe("nombreArchivoRecibo", () => {
  it("arma un nombre seguro con número y cliente", () => {
    const datos = datosReciboDeCobro(cobroEjemplo);
    expect(nombreArchivoRecibo(datos!)).toBe("Recibo_006-0000100_Bazar_La_Vecina.pdf");
  });

  it("sanea caracteres no válidos del nombre del cliente", () => {
    const datos = { ...datosReciboDeCobro(cobroEjemplo)!, cliente: "Bazar/La:Vecina?" };
    expect(nombreArchivoRecibo(datos)).toBe("Recibo_006-0000100_BazarLaVecina.pdf");
  });

  it("usa 'Cliente' si el nombre queda vacío", () => {
    const datos = { ...datosReciboDeCobro(cobroEjemplo)!, cliente: "///" };
    expect(nombreArchivoRecibo(datos)).toBe("Recibo_006-0000100_Cliente.pdf");
  });
});

describe("generarPDFReciboNoFiscal", () => {
  it("genera un PDF válido de una página con acentos en el contenido", async () => {
    const datos = datosReciboDeCobro(cobroEjemplo)!;
    const bytes = await generarPDFReciboNoFiscal(datos);
    expect(Array.from(bytes.slice(0, 4))).toEqual([0x25, 0x50, 0x44, 0x46]); // %PDF
    expect(bytes.byteLength).toBeGreaterThan(1000);
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(1);
  });

  it("genera el PDF también sin nota ni CUIT", async () => {
    const datos = {
      nro_recibo: "006-0000101",
      fecha: "2026-10-02",
      cliente: "Heladería Fiorito",
      cuit: null,
      telefono: "",
      pauta: "Verano",
      periodo: "octubre de 2026",
      monto: 18000,
      metodo: "Efectivo",
      nota: null,
    };
    const bytes = await generarPDFReciboNoFiscal(datos);
    expect(bytes.byteLength).toBeGreaterThan(1000);
  });
});