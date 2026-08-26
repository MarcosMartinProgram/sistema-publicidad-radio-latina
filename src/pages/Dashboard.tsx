import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { EstatusCobroBadge, EstatusPautaBadge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Feedback";
import { WhatsAppButton, RecordatorioMsg } from "@/components/ui/WhatsApp";
import { listarClientes, listarCobrosConPauta, listarPautasConCliente, generarDatosDemo } from "@/lib/api";
import { formatAR$, formatFecha, esVencido } from "@/lib/utils";
import type { Cliente, Cobro, Pauta } from "@/lib/types";

export function Dashboard() {
  const { user } = useAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [pautas, setPautas] = useState<Pauta[]>([]);
  const [cobros, setCobros] = useState<Cobro[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seedError, setSeedError] = useState<string | null>(null);

  const cargar = async () => {
    setLoading(true);
    const [{ data: c }, { data: p }, { data: cob }] = await Promise.all([
      listarClientes(),
      listarPautasConCliente(),
      listarCobrosConPauta(),
    ]);
    setClientes(c ?? []);
    setPautas(p ?? []);
    setCobros(cob ?? []);
    setLoading(false);
  };

  useEffect(() => {
    cargar();
  }, []);

  const seed = async () => {
    setSeeding(true);
    setSeedError(null);
    try {
      if (!user) {
        setSeedError("Sesión no iniciada.");
        return;
      }
      await generarDatosDemo(user.id);
      await cargar();
    } catch (e) {
      setSeedError(e instanceof Error ? e.message : "No se pudo generar el seed.");
    } finally {
      setSeeding(false);
    }
  };

  const stats = useMemo(() => {
    const pendiente = cobros.filter((c) => c.estado === "pendiente");
    const vencido = cobros.filter((c) => c.estado === "vencido" || esVencido(c.fecha_vencimiento));
    const aprobado = cobros.filter((c) => c.estado === "aprobado");
    const totalCobros = cobros.reduce((s, c) => s + Number(c.monto), 0);
    const totalAprobado = aprobado.reduce((s, c) => s + Number(c.monto), 0);
    const porCobrar = cobros
      .filter((c) => c.estado === "pendiente" || c.estado === "vencido")
      .reduce((s, c) => s + Number(c.monto), 0);
    return { pendiente, vencido, totalCobros, totalAprobado, porCobrar };
  }, [cobros]);

  if (loading) return <Spinner label="Cargando dashboard..." />;

  const vacio = clientes.length === 0 && pautas.length === 0 && cobros.length === 0;

  return (
    <div className="space-y-6">
      {vacio && (
        <div className="card flex flex-col items-center gap-3 border-dashed p-8 text-center">
          <p className="text-headline-sm text-on-surface">Aún no hay datos en tu cuenta</p>
          <p className="max-w-md text-body-md text-on-surface-variant">
            {user ? `Hola ${user.email?.split("@")[0]}.` : "Hola."} Generá datos de ejemplo para ver el
            dashboard en acción, o cargá tus clientes desde el menú «Clientes».
          </p>
          <Button onClick={seed} loading={seeding} variant="primary">
            Generar datos de ejemplo
          </Button>
          {seedError && (
            <p className="max-w-md rounded-md bg-danger-600/10 px-3 py-2 text-body-sm text-danger-600">
              {seedError}
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Clientes" value={String(clientes.length)} tone="primary" />
        <StatCard
          label="Facturación (aprobado)"
          value={formatAR$(stats.totalAprobado)}
          hint="Cobros aprobados"
          tone="success"
        />
        <StatCard
          label="Por cobrar"
          value={formatAR$(stats.porCobrar)}
          hint={`${stats.pendiente.length} pendientes`}
          tone="warning"
        />
        <StatCard
          label="Vencidos"
          value={formatAR$(stats.vencido.reduce((s, c) => s + Number(c.monto), 0))}
          hint={`${stats.vencido.length} en mora`}
          tone="danger"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <PautasRecientes pautas={pautas} clientes={clientes} />
        <CobrosPendientes cobros={cobros} className="lg:col-span-2" />
      </div>
    </div>
  );
}

function PautasRecientes({ pautas, clientes }: { pautas: Pauta[]; clientes: Cliente[] }) {
  const nombre = (id: string) => clientes.find((c) => c.id === id)?.nombre ?? "—";
  const recientes = pautas.slice(0, 5);
  return (
    <Card title="Contratos recientes">
      <Table
        rows={recientes}
        empty="Sin contratos."
        columns={[
          { key: "nombre", header: "Pauta", render: (p: Pauta) => p.nombre },
          { key: "cliente", header: "Cliente", render: (p: Pauta) => nombre(p.cliente_id) },
          {
            key: "estado",
            header: "Estado",
            render: (p: Pauta) => <EstatusPautaBadge estado={p.estado} />,
          },
        ]}
      />
    </Card>
  );
}

function CobrosPendientes({ cobros, className }: { cobros: Cobro[]; className?: string }) {
  const pendientes = cobros.filter((c) => c.estado !== "aprobado").slice(0, 6);
  return (
    <Card title="Semáforo de cobros" className={className}>
      <Table
        rows={pendientes}
        empty="No hay cobros pendientes. ¡Todo al día!"
        columns={[
          { key: "monto", header: "Monto", render: (c: Cobro) => <b>{formatAR$(Number(c.monto))}</b> },
          {
            key: "pauta",
            header: "Concepto",
            render: (c: Cobro) => (c as unknown as Cobro & { pautas?: { nombre: string } }).pautas?.nombre ?? "—",
          },
          {
            key: "vto",
            header: "Vence",
            render: (c: Cobro) => formatFecha(c.fecha_vencimiento || c.created_at),
          },
          {
            key: "estado",
            header: "Estado",
            render: (c: Cobro) => <EstatusCobroBadge estado={c.estado} />,
          },
          {
            key: "accion",
            header: "",
            className: "text-right",
            render: (c: Cobro) => (
              <WhatsAppButton
                telefono="5491100000000"
                mensaje={RecordatorioMsg({
                  cliente: "el cliente",
                  monto: formatAR$(Number(c.monto)),
                  pauta: (c as unknown as Cobro & { pautas?: { nombre: string } }).pautas?.nombre ?? "tu pauta",
                })}
                label="Recordatorio"
              />
            ),
          },
        ]}
      />
    </Card>
  );
}
