import { describe, it, expect, vi } from "vitest";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input, Select } from "@/components/ui/Input";

describe("Input", () => {
  it("asocia label con input por id", () => {
    render(<Input label="Correo" id="email" placeholder="tu@mail.com" />);
    const input = screen.getByLabelText("Correo");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("placeholder", "tu@mail.com");
  });

  it("renderiza error si se pasa", () => {
    render(<Input label="X" id="x" error="Requerido" />);
    expect(screen.getByText("Requerido")).toBeInTheDocument();
  });

  it("llama onChange al tipear", async () => {
    const onChange = vi.fn();
    render(<Input label="Nombre" id="nombre" onChange={onChange} />);
    await userEvent.type(screen.getByLabelText("Nombre"), "Ana");
    expect(onChange).toHaveBeenCalled();
    expect(screen.getByLabelText("Nombre")).toHaveValue("Ana");
  });

  it("sin label, igual renderiza el input", () => {
    render(<Input id="nada" />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });
});

describe("Select", () => {
  function ControlledSelect() {
    const [v, setV] = useState("");
    return (
      <Select label="Pauta" id="p" value={v} onChange={(e) => setV(e.target.value)}>
        <option value="">—</option>
        <option value="a">A</option>
        <option value="b">B</option>
      </Select>
    );
  }

  it("renderiza options y permite seleccionar", async () => {
    render(<ControlledSelect />);
    const sel = screen.getByLabelText("Pauta") as HTMLSelectElement;
    await userEvent.selectOptions(sel, "b");
    expect(sel.value).toBe("b");
  });

  it("muestra error si se pasa", () => {
    render(
      <Select label="S" id="s" error="Seleccioná algo">
        <option value="">—</option>
      </Select>
    );
    expect(screen.getByText("Seleccioná algo")).toBeInTheDocument();
  });
});
