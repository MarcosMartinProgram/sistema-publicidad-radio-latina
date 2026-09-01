import { describe, it, expect } from "vitest";
import {
  ingresosPorPeriodo,
  pagosPorCliente,
  pagosPorCampana,
  totalIngresos,
  filtrarPorRango,
} from "@/lib/reportes";
import type { CobroConPauta } from "@/lib/types";

function cobro(estado: "aprobado" | "pendiente" | "vencido", fechaPago: string, monto: number, pauta: string, cliente: string): CobroConPauta {
  return {
    id: `${pauta}-${fechaPago}`,
    user_id: "u1",
    pauta_id: "p1",
    monto,
    metodo: "transferencia",
    fecha_pago: fechaPago,
    estado,
    fecha_vencimiento: fechaPago,
    nro_recibo: null,
    nota: null,
    created_at: fechaPago,
    pautas: { nombre: pauta, clientes: { nombre: cliente, telefono: "111" } },
  } as CobroConPauta;
}

describe("totalIngresos", () => {
  it("solo suma cobros aprobados", () => {
    const cobros = [
      cobro("aprobado", "2026-08-03", 5000, "Dia del Padre", "Matias"),
      cobro("aprobado", "2026-08-05", 7000, "Dia del Niño", "Ana"),
      cobro("pendiente", "2026-08-06", 99999, "X", "Z"),
      cobro("vencido", "2026-08-06", 99999, "X", "Z"),
    ];
    expect(totalIngresos(cobros)).toEqual({ total: 12000, cantidad: 2 });
  });
});

describe("filtrarPorRango", () => {
  const cobros = [
    cobro("aprobado", "2026-06-15", 1000, "A", "C1"),
    cobro("aprobado", "2026-07-01", 2000, "B", "C2"),
    cobro("pendiente", "2026-07-02", 3000, "C", "C3"),
  ];

  it("filtra inclusive por fecha_pago", () => {
    const out = filtrarPorRango(cobros, "2026-06-15", "2026-07-01");
    expect(out).toHaveLength(2);
    expect(out.map((c) => c.fecha_pago)).toEqual(["2026-06-15", "2026-07-01"]);
  });

  it("rango vacío no filtra", () => {
    expect(filtrarPorRango(cobros, "", "")).toHaveLength(3);
  });
});

describe("ingresosPorPeriodo", () => {
  const cobros = [
    cobro("aprobado", "2026-06-15", 1000, "A", "C1"),
    cobro("aprobado", "2026-07-01", 2000, "B", "C2"),
    cobro("aprobado", "2026-07-20", 3000, "B2", "C3"),
    cobro("pendiente", "2026-07-25", 99999, "X", "Z"),
  ];

  it("agrupa por mes y ordena cronológico", () => {
    const out = ingresosPorPeriodo(cobros, "mensual");
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({ clave: "2026-06", cantidad: 1, total: 1000 });
    expect(out[1]).toMatchObject({ clave: "2026-07", cantidad: 2, total: 5000 });
    expect(out[1].etiqueta).not.toBe("");
  });

  it("agrupa por año", () => {
    const out = ingresosPorPeriodo(cobros, "anual");
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ clave: "2026", cantidad: 3, total: 6000 });
  });
});

describe("pagosPorCliente", () => {
  it("agrupa y ordena por monto total descendente", () => {
    const cobros = [
      cobro("aprobado", "2026-06-15", 1000, "A", "Ana"),
      cobro("aprobado", "2026-07-01", 4000, "B", "Matias"),
      cobro("aprobado", "2026-07-20", 2000, "C", "Ana"),
      cobro("pendiente", "2026-07-25", 99999, "D", "Sin Cobrar"),
    ];
    const out = pagosPorCliente(cobros);
    expect(out).toHaveLength(2);
    expect(out[0]).toEqual({ cliente: "Matias", cantidad: 1, total: 4000 });
    expect(out[1]).toEqual({ cliente: "Ana", cantidad: 2, total: 3000 });
  });
});

describe("pagosPorCampana", () => {
  it("agrupa por campaña con cliente y ordena por total", () => {
    const cobros = [
      cobro("aprobado", "2026-06-15", 1000, "Dia del Niño", "Ana"),
      cobro("aprobado", "2026-07-01", 4000, "Dia del Padre", "Matias"),
      cobro("aprobado", "2026-07-20", 2000, "Dia del Niño", "Ana"),
    ];
    const out = pagosPorCampana(cobros);
    expect(out).toEqual([
      { campana: "Dia del Padre", cliente: "Matias", cantidad: 1, total: 4000 },
      { campana: "Dia del Niño", cliente: "Ana", cantidad: 2, total: 3000 },
    ]);
  });
});