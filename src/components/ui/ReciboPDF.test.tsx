import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReciboPDFButton } from "@/components/ui/ReciboPDF";
import type { CobroConPauta } from "@/lib/types";

const h = vi.hoisted(() => ({
  emitir: vi.fn(async () => "descargado"),
}));

vi.mock("@/lib/recibo", () => ({
  datosReciboDeCobro: (c: { nro_recibo: string | null }) =>
    c.nro_recibo ? { nro_recibo: c.nro_recibo } : null,
  compartirODescargarRecibo: () => h.emitir(),
}));

const cobroConRecibo = { nro_recibo: "006-0000100" } as unknown as CobroConPauta;
const cobroSinRecibo = { nro_recibo: null } as unknown as CobroConPauta;

describe("ReciboPDFButton", () => {
  it("no se renderiza si el cobro no tiene número de recibo", () => {
    render(<ReciboPDFButton cobro={cobroSinRecibo} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("genera y comparte/descarga el PDF al hacer click", async () => {
    render(<ReciboPDFButton cobro={cobroConRecibo} />);
    const btn = screen.getByRole("button", { name: /recibo pdf/i });
    await userEvent.click(btn);
    expect(h.emitir).toHaveBeenCalledTimes(1);
  });

  it("acepta un label personalizado", () => {
    render(<ReciboPDFButton cobro={cobroConRecibo} label="Enviar por WhatsApp" />);
    expect(screen.getByRole("button", { name: /enviar por whatsapp/i })).toBeInTheDocument();
  });
});