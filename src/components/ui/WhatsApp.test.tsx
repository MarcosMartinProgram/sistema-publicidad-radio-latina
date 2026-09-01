import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WhatsAppButton, RecordatorioMsg } from "@/components/ui/WhatsApp";

describe("WhatsAppButton", () => {
  it("abre wa.me al hacer click con el teléfono normalizado y el mensaje", async () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    render(<WhatsAppButton telefono="1144556677" mensaje="Hola!" />);
    await userEvent.click(screen.getByRole("button"));
    const [url, target] = openSpy.mock.calls[0];
    expect(typeof url).toBe("string");
    expect(url as string).toMatch(/^https:\/\/wa\.me\/541144556677\?text=/);
    expect(decodeURIComponent(url as string)).toContain("Hola!");
    expect(target).toBe("_blank");
    openSpy.mockRestore();
  });

  it("usa el label por defecto y respeta uno custom", () => {
    render(<WhatsAppButton telefono="1144556677" mensaje="x" label="Recordar" />);
    expect(screen.getByRole("button", { name: /recordar/i })).toBeInTheDocument();
  });
});

describe("RecordatorioMsg", () => {
  it("compone el mensaje con cliente, monto y pauta", () => {
    const msg = RecordatorioMsg({ cliente: "Ana", monto: "$5.000", pauta: "Verano" });
    expect(msg).toMatch(/Hola Ana/);
    expect(msg).toMatch(/\$5\.000/);
    expect(msg).toMatch(/Verano/);
    expect(msg).toMatch(/Radio Latina 95\.7/);
  });
});
