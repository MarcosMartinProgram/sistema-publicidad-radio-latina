import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@/components/ui/Button";

describe("Button", () => {
  it("renderiza children y dispara onClick", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Guardar</Button>);
    const btn = screen.getByRole("button", { name: /guardar/i });
    await userEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("muestra spinner y se deshabilita mientras loading=true", () => {
    render(<Button loading>Guardar</Button>);
    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
    expect(btn.querySelector(".animate-spin")).toBeTruthy();
  });

  it("respeta la prop disabled", () => {
    render(<Button disabled>Hola</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("aplica w-full cuando full=true", () => {
    render(<Button full>Ancho completo</Button>);
    expect(screen.getByRole("button").className).toMatch(/w-full/);
  });

  it("aplica la variante ghost correctamente", () => {
    render(<Button variant="ghost">X</Button>);
    expect(screen.getByRole("button").className).toMatch(/bg-transparent/);
  });
});
