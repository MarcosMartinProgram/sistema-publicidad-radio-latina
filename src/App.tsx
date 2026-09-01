import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { AppShell } from "@/components/layout/AppShell";
import { Spinner } from "@/components/ui/Feedback";
import { Auth } from "@/pages/Auth";
import { Dashboard } from "@/pages/Dashboard";
import { Clientes } from "@/pages/Clientes";
import { Pautas } from "@/pages/Pautas";
import { Cobros } from "@/pages/Cobros";
import { Informes } from "@/pages/Informes";

function RequireAuth({ children }: { children: React.ReactElement }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner label="Comprobando sesión..." />
      </div>
    );
  }
  if (!session) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }
  return children;
}

function RedirectIfAuthed() {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner label="Comprobando sesión..." />
      </div>
    );
  }
  return session ? <Navigate to="/" replace /> : <Auth />;
}

export function App() {
  return (
    <Routes>
      <Route path="/auth" element={<RedirectIfAuthed />} />
      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/pautas" element={<Pautas />} />
        <Route path="/cobros" element={<Cobros />} />
        <Route path="/informes" element={<Informes />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
