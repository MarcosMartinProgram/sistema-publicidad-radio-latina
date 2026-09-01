import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/context/AuthContext";

vi.mock("@/context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    Outlet: () => <main data-testid="outlet" />,
  };
});

const authMock = {
  user: { id: "u1", email: "a@b.com" },
  session: { user: { id: "u1" } },
  profile: { nombre: "Admin", rol: "admin" },
  loading: false,
  signOut: vi.fn(),
  signIn: vi.fn(),
  signUp: vi.fn(),
};

describe("AppShell sidebar", () => {
  beforeEach(() => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue(authMock);
  });

  it("muestra el logo de MPM Labs y los derechos reservados en el sidebar", () => {
    render(
      <MemoryRouter>
        <AppShell />
      </MemoryRouter>
    );
    const img = screen.getByAltText("MPM Labs");
    expect(img).toHaveAttribute("src", "/LogoMPMLabs%20(2).png");
    const txt = "© 2026 MPM Labs · Todos los derechos reservados";
expect(
  screen.getByText((_c, node) => {
    if (!node) return false;
    const hasText = (el: Element) => el.textContent === txt && el !== node;
    return node.textContent === txt && !Array.from(node.children).some(hasText);
  })
).toBeInTheDocument();
    expect(screen.getByText("102.3 FM · Argentina")).toBeInTheDocument();
  });
});