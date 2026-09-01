import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function Auth() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"login" | "registro">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      if (mode === "login") {
        await signIn(email, password);
      } else {
        const msg = await signUp(email, password, nombre);
        if (msg) setNotice(msg);
        else setMode("login");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Ocurrió un error.";
      setError(msg === "Invalid login credentials" ? "Correo o contraseña incorrectos." : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-container text-headline-md font-bold text-on-primary">
            RL
          </span>
          <h1 className="mt-4 text-headline-md font-semibold text-surface">Radio Latina Du Graty 102.3 Mhz</h1>
          <p className="text-body-md text-inverse-on-surface/60">Sistema de Gestión Publicitaria</p>
        </div>

        <div className="card p-6">
          <div className="mb-5 grid grid-cols-2 overflow-hidden rounded-md border border-border">
            {(["login", "registro"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setError(null);
                  setNotice(null);
                }}
                className={`py-2 text-body-sm font-semibold transition ${
                  mode === m ? "bg-primary text-on-primary" : "bg-surface text-on-surface-variant"
                }`}
              >
                {m === "login" ? "Iniciar sesión" : "Crear cuenta"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "registro" && (
              <Input
                label="Nombre y apellido"
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. María López"
                required
              />
            )}
            <Input
              label="Correo electrónico"
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@radio957.com"
              required
            />
            <Input
              label="Contraseña"
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />

            {error && (
              <p className="rounded-md bg-danger-600/10 px-3 py-2 text-body-sm text-danger-600">{error}</p>
            )}
            {notice && (
              <p className="rounded-md bg-success-600/10 px-3 py-2 text-body-sm text-success-600">{notice}</p>
            )}

            <Button type="submit" full loading={loading}>
              {mode === "login" ? "Ingresar" : "Crear cuenta"}
            </Button>
          </form>
        </div>

        <p className="mt-4 text-center text-body-sm text-inverse-on-surface/50">
          102.3 FM · Gestión de Publicidad
        </p>
      </div>
    </div>
  );
}
