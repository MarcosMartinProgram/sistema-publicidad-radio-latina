import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { compartirODescargarRecibo, datosReciboDeCobro } from "@/lib/recibo";
import type { CobroConPauta } from "@/lib/types";

export function ReciboPDFButton({
  cobro,
  label = "Recibo PDF",
  className = "",
}: {
  cobro: CobroConPauta;
  label?: string;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);
  const datos = useMemo(() => datosReciboDeCobro(cobro), [cobro]);

  const emitir = async () => {
    if (!datos) return;
    setBusy(true);
    try {
      await compartirODescargarRecibo(datos);
    } catch {
      /* El share puede lanzar error si se cancela; el helper ya descarga */
    } finally {
      setBusy(false);
    }
  };

  if (!datos) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={emitir}
      loading={busy}
      className={`text-primary hover:bg-surface-container-low ${className}`}
      title="Generar recibo no fiscal (PDF) para guardar o compartir por WhatsApp"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M12 18v-6" />
        <path d="m9 15 3 3 3-3" />
      </svg>
      {label}
    </Button>
  );
}