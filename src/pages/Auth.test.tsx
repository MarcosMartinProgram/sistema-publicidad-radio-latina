import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

vi.mock("@/lib/supabase", () => {
  return {
    supabase: {
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
        onAuthStateChange: vi.fn(() => ({
          data: { subscription: { unsubscribe: vi.fn() } },
        })),
        signInWithPassword: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
      },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({ data: null }),
          })),
        })),
      })),
    },
  };
});

interface MockError {
  message: string;
  name?: string;
  status?: number;
}

import { supabase } from "@/lib/supabase";
import { Auth } from "@/pages/Auth";
import { AuthProvider } from "@/context/AuthContext";

function renderAuth() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <Auth />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("Auth page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
    } as unknown as Awaited<ReturnType<typeof supabase.auth.getSession>>);
  });

  it("renderiza el formulario de login por defecto", () => {
    renderAuth();
    expect(screen.getByRole("heading", { name: /radio latina/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ingresar/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/nombre y apellido/i)).toBeNull();
  });

  it("cambia al modo registro y muestra el campo nombre", async () => {
    renderAuth();
    await userEvent.click(screen.getByRole("button", { name: /^crear cuenta$/i }));
    expect(screen.getByLabelText(/nombre y apellido/i)).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /crear cuenta/i }).length).toBeGreaterThanOrEqual(2);
  });

  it("llama a signInWithPassword al enviar login", async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: null, session: null },
      error: null,
    } as unknown as Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>);
    renderAuth();
    await userEvent.type(screen.getByLabelText(/correo/i), "user@radio957.com");
    await userEvent.type(screen.getByLabelText(/contraseña/i), "secreto123");
    await userEvent.click(screen.getByRole("button", { name: /ingresar/i }));
    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: "user@radio957.com",
        password: "secreto123",
      });
    });
  });

  it("muestra error en español cuando falla el login con credenciales inválidas", async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Invalid login credentials", name: "AuthApiError", status: 400 } as unknown as MockError,
    } as unknown as Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>);
    renderAuth();
    await userEvent.type(screen.getByLabelText(/correo/i), "user@radio957.com");
    await userEvent.type(screen.getByLabelText(/contraseña/i), "secreto123");
    await userEvent.click(screen.getByRole("button", { name: /^ingresar$/i }));
    await waitFor(() => {
      expect(screen.getByText(/correo o contraseña incorrectos/i)).toBeInTheDocument();
    });
  });

  it("en registro sin sesión devuelve notice de confirmación", async () => {
    vi.mocked(supabase.auth.signUp).mockResolvedValue({
      data: { user: null, session: null },
      error: null,
    } as unknown as Awaited<ReturnType<typeof supabase.auth.signUp>>);
    renderAuth();
    await userEvent.click(screen.getByRole("button", { name: /^crear cuenta$/i }));
    await userEvent.type(screen.getByLabelText(/nombre y apellido/i), "Ana");
    await userEvent.type(screen.getByLabelText(/correo/i), "ana@radio957.com");
    await userEvent.type(screen.getByLabelText(/contraseña/i), "secreto123");
    const submitBtn = screen.getAllByRole("button", { name: /crear cuenta/i }).find(
      (b) => (b as HTMLButtonElement).type === "submit"
    );
    await userEvent.click(submitBtn!);
    await waitFor(() => {
      expect(
        screen.getByText(/revisá tu correo para confirmar la cuenta/i)
      ).toBeInTheDocument();
    });
  });
});
