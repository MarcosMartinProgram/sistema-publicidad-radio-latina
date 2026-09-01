import { describe, it, expect, vi, beforeEach } from "vitest";

const insertMock = vi.fn();
const updateMock = vi.fn();
const deleteMock = vi.fn();
const selectMock = vi.fn();

interface ChainMock {
  insert: (...args: unknown[]) => ChainMock;
  update: (...args: unknown[]) => ChainMock;
  delete: () => ChainMock;
  select: (...args: unknown[]) => ChainMock;
  eq: () => ChainMock | Promise<{ error: null }>;
  order: () => Promise<{ data: unknown[]; error: null }>;
  single: () => Promise<{ data: Record<string, unknown>; error: null }>;
}

vi.mock("@/lib/supabase", () => {
  const chain: ChainMock = {
    insert: (...args: unknown[]) => {
      insertMock(...args);
      return chain;
    },
    update: (...args: unknown[]) => {
      updateMock(...args);
      chain.eq = () => Promise.resolve({ error: null });
      return chain;
    },
    delete: () => {
      deleteMock();
      chain.eq = () => Promise.resolve({ error: null });
      return chain;
    },
    select: (...args: unknown[]) => {
      selectMock(...args);
      return chain;
    },
    eq: () => chain,
    order: () => Promise.resolve({ data: [], error: null }),
    single: () =>
      Promise.resolve({
        data: { id: "x" },
        error: null,
      }),
  };

  return {
    supabase: {
      from: () => chain,
    },
  };
});

import { crearPauta, actualizarCliente, eliminarCobro } from "@/lib/api";

describe("api · crearPauta", () => {
  beforeEach(() => {
    insertMock.mockClear();
    updateMock.mockClear();
    deleteMock.mockClear();
  });

  it("calcula monto_total = pases * tarifa y lo envía al insert", async () => {
    await crearPauta({
      user_id: "u1",
      cliente_id: "c1",
      nombre: "Spot",
      pases: 10,
      tarifa: 1500,
      fecha_inicio: "2025-01-01",
      fecha_fin: "2025-01-31",
      estado: "activa",
    });
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ monto_total: 15000, pases: 10, tarifa: 1500 })
    );
  });

  it("pasa a 0 si tarifa o pases son 0", async () => {
    await crearPauta({
      user_id: "u1",
      cliente_id: "c1",
      nombre: "X",
      pases: 0,
      tarifa: 100,
      fecha_inicio: "2025-01-01",
      fecha_fin: "2025-01-31",
      estado: "activa",
    });
    expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({ monto_total: 0 }));
  });
});

describe("api · actualizaciones simples", () => {
  it("actualizarCliente envía cambios al update", async () => {
    await actualizarCliente("cli-1", { nombre: "Nuevo" });
    expect(updateMock).toHaveBeenCalledWith({ nombre: "Nuevo" });
  });

  it("eliminarCobro ejecuta delete", async () => {
    await eliminarCobro("cob-1");
    expect(deleteMock).toHaveBeenCalled();
  });
});
