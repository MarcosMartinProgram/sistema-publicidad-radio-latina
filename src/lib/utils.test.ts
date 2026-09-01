import { describe, it, expect } from "vitest";
import {
  formatAR$,
  parseMonto,
  formatFecha,
  hoyISO,
  sumarDias,
  normalizarTelefono,
  urlWhatsApp,
  abrirWhatsApp,
  initiales,
  esVencido,
} from "@/lib/utils";

describe("formatAR$", () => {
  it("formatea un monto en pesos argentinos con símbolo por defecto", () => {
    const out = formatAR$(1500);
    expect(out).toMatch(/\$/);
    expect(out).toMatch(/1\.500|1,500/);
  });

  it("acepta notación compacta", () => {
    expect(formatAR$(1_000_000, { compact: true })).toMatch(/1\s*M/);
    expect(formatAR$(15_000, { compact: true })).toMatch(/15\s*k|15\.000/);
  });

  it("omite el símbolo cuando symbol=false", () => {
    const out = formatAR$(1234.5, { symbol: false });
    expect(out).not.toMatch(/\$/);
  });

  it("maneja cero y números negativos sin romper", () => {
    expect(formatAR$(0)).toMatch(/\$|0/);
    expect(formatAR$(-100)).toMatch(/-/);
  });
});

describe("parseMonto", () => {
  it("parsea números simples", () => {
    expect(parseMonto("1234.5")).toBe(1234.5);
    expect(parseMonto("1234,5")).toBe(1234.5);
  });

  it("tolera el símbolo $ y separadores de miles", () => {
    expect(parseMonto("$ 1.234,50")).toBe(1234.5);
  });

  it("devuelve 0 si no hay número válido", () => {
    expect(parseMonto("abc")).toBe(0);
    expect(parseMonto("")).toBe(0);
  });
});

describe("formatFecha", () => {
  it("devuelve '—' con string vacío", () => {
    expect(formatFecha("")).toBe("—");
  });

  it("devuelve el iso crudo si no es parseable", () => {
    expect(formatFecha("no-es-fecha")).toBe("no-es-fecha");
  });

  it("formatea fechas válidas en es-AR", () => {
    const out = formatFecha("2025-03-15T12:00:00Z");
    expect(out).toMatch(/2025/);
    expect(out).toMatch(/mar/);
  });
});

describe("hoyISO y sumarDias", () => {
  it("hoyISO devuelve formato YYYY-MM-DD", () => {
    expect(hoyISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("sumarDias suma días positivos y negativos", () => {
    expect(sumarDias("2025-01-10", 5)).toBe("2025-01-15");
    expect(sumarDias("2025-01-10", -10)).toBe("2024-12-31");
  });

  it("sumarDias cruza meses y años correctamente", () => {
    expect(sumarDias("2025-01-25", 10)).toBe("2025-02-04");
    expect(sumarDias("2024-12-30", 5)).toBe("2025-01-04");
  });
});

describe("normalizarTelefono", () => {
  it("agrega 54 a números locales de 10 dígitos", () => {
    expect(normalizarTelefono("1144556677")).toBe("541144556677");
  });

  it("elimina el 0 inicial", () => {
    expect(normalizarTelefono("01144556677")).toBe("541144556677");
  });

  it("elimina el 9 inicial en móviles (11 dígitos)", () => {
    expect(normalizarTelefono("91144556677")).toBe("541144556677");
  });

  it("no toca números locales de 10 dígitos sin 9", () => {
    expect(normalizarTelefono("1144556677")).toBe("541144556677");
  });

  it("no quita el 9 de un local de 10 dígitos (input mal cargado)", () => {
    expect(normalizarTelefono("9114455667")).toBe("549114455667");
  });

  it("no toca números que ya vienen en formato internacional +549...", () => {
    expect(normalizarTelefono("5491144556677")).toBe("5491144556677");
  });

  it("respeta números que ya empiezan con 54", () => {
    expect(normalizarTelefono("5491144556677")).toBe("5491144556677");
  });

  it("elimina todo lo que no sea dígito", () => {
    expect(normalizarTelefono("+54 9 11 4455-6677")).toBe("5491144556677");
  });
});

describe("urlWhatsApp", () => {
  it("construye un link wa.me con mensaje codificado", () => {
    const url = urlWhatsApp("1144556677", "Hola, ¿cómo va?");
    expect(url).toMatch(/^https:\/\/wa\.me\/541144556677\?text=/);
    expect(decodeURIComponent(url)).toContain("Hola, ¿cómo va?");
  });
});

describe("abrirWhatsApp", () => {
  it("abre una ventana nueva con la URL correcta", () => {
    const spy = vi.spyOn(window, "open").mockImplementation(() => null);
    abrirWhatsApp("1144556677", "Hola!");
    expect(spy).toHaveBeenCalledTimes(1);
    const [url, target, features] = spy.mock.calls[0];
    expect(url).toMatch(/^https:\/\/wa\.me\//);
    expect(target).toBe("_blank");
    expect(features).toContain("noopener");
    spy.mockRestore();
  });
});

describe("initiales", () => {
  it("devuelve las iniciales de hasta dos palabras en mayúsculas", () => {
    expect(initiales("María López")).toBe("ML");
    expect(initiales("juan")).toBe("J");
    expect(initiales("")).toBe("");
  });

  it("tolera múltiples espacios", () => {
    expect(initiales("  ana   perez  ")).toBe("AP");
  });
});

describe("esVencido", () => {
  it("es true si la fecha es del pasado", () => {
    expect(esVencido("2000-01-01")).toBe(true);
  });

  it("es false si la fecha es del futuro", () => {
    expect(esVencido("2999-12-31")).toBe(false);
  });

  it("es false con fecha inválida", () => {
    expect(esVencido("no-es-fecha")).toBe(false);
  });
});
