import { useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Table";

const titulos: Record<string, string> = {
  "/": "Dashboard",
  "/clientes": "Clientes",
  "/pautas": "Pautas & Contratos",
  "/cobros": "Cobros y Recibos",
};

export function Topbar() {
  const { pathname } = useLocation();
  const { user, profile, signOut } = useAuth();
  const titulo = titulos[pathname] ?? "Radio Latina";

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background px-4 sm:px-6 lg:px-8">
      <h1 className="text-headline-sm sm:text-headline-md text-on-surface">{titulo}</h1>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <Avatar nombre={profile?.nombre || user?.email?.slice(0, 2).toUpperCase() || "US"} />
          <div className="hidden text-right sm:block">
            <p className="text-body-sm font-medium text-on-surface">{profile?.nombre || "Usuario"}</p>
            <p className="text-label-md text-on-surface-variant">{profile?.rol ?? "operador"}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => signOut()}>
          Salir
        </Button>
      </div>
    </header>
  );
}
