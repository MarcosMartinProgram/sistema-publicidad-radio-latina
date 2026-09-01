import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge, EstatusCobroBadge, EstatusPautaBadge } from "@/components/ui/Badge";

describe("Badge", () => {
  it("renderiza children", () => {
    render(<Badge>Hola</Badge>);
    expect(screen.getByText("Hola")).toBeInTheDocument();
  });

  it("aplica clases del tone success", () => {
    render(<Badge tone="success">OK</Badge>);
    const el = screen.getByText("OK");
    expect(el.className).toMatch(/success-600/);
  });

  it("muestra el dot cuando dot=true", () => {
    render(<Badge dot>dot</Badge>);
    expect(screen.getByText("dot").querySelector("span")).toBeTruthy();
  });
});

describe("EstatusCobroBadge", () => {
  it.each([
    ["pendiente", /Pendiente/],
    ["aprobado", /Aprobado/],
    ["vencido", /Vencido/],
  ] as const)("%s → %s", (estado, regex) => {
    render(<EstatusCobroBadge estado={estado} />);
    expect(screen.getByText(regex)).toBeInTheDocument();
  });

  it("estado desconocido → usa fallback neutral", () => {
    render(<EstatusCobroBadge estado="raro" />);
    expect(screen.getByText("raro")).toBeInTheDocument();
  });
});

describe("EstatusPautaBadge", () => {
  it.each([
    ["activa", /Activa/],
    ["pausada", /Pausada/],
    ["finalizada", /Finalizada/],
  ] as const)("%s → %s", (estado, regex) => {
    render(<EstatusPautaBadge estado={estado} />);
    expect(screen.getByText(regex)).toBeInTheDocument();
  });
});
