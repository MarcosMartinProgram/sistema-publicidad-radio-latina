import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { EstatusPautaMensualBadge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Feedback";
import { WhatsAppButton, MensajePautaMensual } from "@/components/ui/WhatsApp";
import { listarClientes, listarCobrosConPauta, listarPautasConCliente, generarDatosDemo } from "@/lib/api";
import { formatAR$, estadoPautaMensual, estadoCobroEfectivo, diasDeAtraso, montoAdeudado } from "@/lib/utils";
import type { EstadoMensual } from "@/lib/utils";
import type { Cliente, Cobro, CobroConPauta, Pauta } from "@/lib/types";

export function Dashboard() {
  const { user } = useAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [pautas, setPautas] = useState<Pauta[]>([]);
  const [cobros, setCobros] = useState<CobroConPauta[]>([]);
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
    const efectivo = (c: Cobro) => estadoCobroEfectivo(c);
    const pendiente = cobros.filter((c) => efectivo(c) === "pendiente");
    const aprobado = cobros.filter((c) => efectivo(c) === "aprobado");
    const totalAprobado = aprobado.reduce((s, c) => s + Number(c.monto), 0);
    const porCobrar = cobros
      .filter((c) => efectivo(c) === "pendiente" || efectivo(c) === "vencido")
      .reduce((s, c) => s + Number(c.monto), 0);
    const pautasVencidas = pautas.filter(
      (p) => estadoPautaMensual(p, cobros.filter((c) => c.pauta_id === p.id)) === "vencida",
    );
    const totalVencidoPautas = pautasVencidas.reduce(
      (s, p) => s + montoAdeudado(p, cobros.filter((c) => c.pauta_id === p.id)),
      0,
    );
    return { pendiente, totalAprobado, porCobrar, totalVencidoPautas, pautasVencidas };
  }, [cobros, pautas]);

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
          value={formatAR$(stats.totalVencidoPautas)}
          hint={`${stats.pautasVencidas.length} pautas en mora`}
          tone="danger"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <PautasRecientes pautas={pautas} clientes={clientes} cobros={cobros} />
        <SemaforoCobros pautas={pautas} clientes={clientes} cobros={cobros} className="lg:col-span-2" />
      </div>
    </div>
  );
}

function PautasRecientes({ pautas, clientes, cobros }: { pautas: Pauta[]; clientes: Cliente[]; cobros: Cobro[] }) {
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
            render: (p: Pauta) => (
              <EstatusPautaMensualBadge
                estado={estadoPautaMensual(p, cobros.filter((c) => c.pauta_id === p.id))}
              />
            ),
          },
        ]}
      />
    </Card>
  );
}

function SemaforoCobros({
  pautas,
  clientes,
  cobros,
  className,
}: {
  pautas: Pauta[];
  clientes: Cliente[];
  cobros: Cobro[];
  className?: string;
}) {
  const filas = useMemo(() => {
    return pautas
      .map((p) => {
        const deuda = cobros.filter((c) => c.pauta_id === p.id);
        const estado = estadoPautaMensual(p, deuda);
        const cliente = clientes.find((c) => c.id === p.cliente_id);
        return {
          pauta: p,
          cliente: cliente?.nombre ?? "—",
          telefono: cliente?.telefono ?? "",
          estado,
          atraso: diasDeAtraso(p, deuda),
          adeudado: montoAdeudado(p, deuda),
        };
      })
      .filter((r) => r.estado !== "al_dia")
      .sort((a, b) => estadoOrden(b.estado) - estadoOrden(a.estado))
      .slice(0, 8);
  }, [pautas, clientes, cobros]);

  return (
    <Card title="Semáforo de cobros" className={className}>
      <Table
        rows={filas}
        empty="No hay pautas pendientes ni vencidas. ¡Todo al día!"
        columns={[
          { key: "pauta", header: "Pauta", render: (r) => r.pauta.nombre },
          { key: "cliente", header: "Cliente", render: (r) => r.cliente },
          {
            key: "monto",
            header: "Monto total",
            render: (r) => <b>{formatAR$(r.adeudado > 0 ? r.adeudado : Number(r.pauta.monto_total))}</b>,
          },
          {
            key: "estado",
            header: "Estado",
            render: (r) => <EstatusPautaMensualBadge estado={r.estado} />,
          },
          {
            key: "atraso",
            header: "Atraso",
            render: (r) => (r.atraso > 0 ? `${r.atraso} día${r.atraso === 1 ? "" : "s"}` : "—"),
          },
          {
            key: "accion",
            header: "",
            className: "text-right",
            render: (r) => (
              <WhatsAppButton
                telefono={r.telefono}
                mensaje={MensajePautaMensual({
                  cliente: r.cliente,
                  monto: formatAR$(r.adeudado > 0 ? r.adeudado : Number(r.pauta.monto_total)),
                  pauta: r.pauta.nombre,
                  atrasoDias: r.atraso,
                })}
                label={r.atraso > 0 ? "Cobrar" : "Recordar"}
              />
            ),
          },
        ]}
      />
    </Card>
  );
}

function estadoOrden(e: EstadoMensual): number {
  if (e === "vencida") return 0;
  if (e === "pendiente") return 1;
  return 2;
}
