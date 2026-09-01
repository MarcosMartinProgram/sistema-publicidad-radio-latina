import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { WhatsAppButton, RecordatorioMsg } from "@/components/ui/WhatsApp";

describe("WhatsAppButton", () => {
  it("es un link directo a wa.me con el teléfono normalizado y el mensaje", () => {
    render(<WhatsAppButton telefono="1144556677" mensaje="Hola!" />);
    const link = screen.getByRole("link", { name: /whatsapp/i });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    const url = link.getAttribute("href") ?? "";
    expect(url).toMatch(/^https:\/\/wa\.me\/541144556677\?text=/);
    expect(decodeURIComponent(url)).toContain("Hola!");
  });

  it("usa el label por defecto y respeta uno custom", () => {
    render(<WhatsAppButton telefono="1144556677" mensaje="x" label="Recordar" />);
    expect(screen.getByRole("link", { name: /recordar/i })).toBeInTheDocument();
  });
});

describe("RecordatorioMsg", () => {
  it("compone el mensaje con cliente, monto y pauta", () => {
    const msg = RecordatorioMsg({ cliente: "Ana", monto: "$5.000", pauta: "Verano" });
    expect(msg).toMatch(/Hola Ana/);
    expect(msg).toMatch(/\$5\.000/);
    expect(msg).toMatch(/Verano/);
    expect(msg).toMatch(/Radio Latina Du Graty 102\.3 Mhz/);
  });
});
