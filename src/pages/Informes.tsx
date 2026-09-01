import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { Select, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Feedback";
import { StatCard } from "@/components/ui/StatCard";
import { listarCobrosConPauta } from "@/lib/api";
import { formatAR$, formatFecha, hoyISO } from "@/lib/utils";
import {
  ingresosPorPeriodo,
  pagosPorCliente,
  pagosPorCampana,
  totalIngresos,
  filtrarPorRango,
  type PeriodoReporte,
} from "@/lib/reportes";
import type { CobroConPauta } from "@/lib/types";

type TipoInforme = "ingresos" | "clientes" | "campanas";

const TIPOS: { value: TipoInforme; label: string }[] = [
  { value: "ingresos", label: "Ingresos" },
  { value: "clientes", label: "Pagos por cliente" },
  { value: "campanas", label: "Por campaña" },
];

function etiquetaTipo(t: TipoInforme): string {
  return TIPOS.find((x) => x.value === t)?.label ?? t;
}

export function Informes() {
  const { user } = useAuth();
  const [cobros, setCobros] = useState<CobroConPauta[]>([]);
  const [loading, setLoading] = useState(true);
  const [tipo, setTipo] = useState<TipoInforme>("ingresos");
  const [periodo, setPeriodo] = useState<PeriodoReporte>("mensual");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  useEffect(() => {
    if (!user) return;
    listarCobrosConPauta().then(({ data }) => {
      setCobros(data ?? []);
      setLoading(false);
    });
  }, [user]);

  const base = useMemo(
    () => (periodo === "intervalo" ? filtrarPorRango(cobros, desde, hasta) : cobros),
    [cobros, periodo, desde, hasta],
  );

  const resumen = useMemo(() => totalIngresos(base), [base]);

  const filasIngresos = useMemo(
    () => (periodo === "intervalo" ? [] : ingresosPorPeriodo(base, periodo === "anual" ? "anual" : "mensual")),
    [base, periodo],
  );

  const filasClientes = useMemo(() => pagosPorCliente(base), [base]);
  const filasCampanas = useMemo(() => pagosPorCampana(base), [base]);

  const descripcionPeriodo = useMemo(() => {
    if (periodo === "intervalo") {
      if (!desde && !hasta) return "Todo el historial";
      return `Del ${desde || "inicio de registros"} al ${hasta || "hoy"} inclusive`;
    }
    if (periodo === "anual") return "Agrupado por año";
    return "Agrupado por mes";
  }, [periodo, desde, hasta]);

  if (loading) return <Spinner label="Preparando informes..." />;

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="print:block hidden">
        <p className="text-label-md uppercase text-on-surface-variant">
          Radio Latina Du Graty 102.3 Mhz · Informe generado el {formatFecha(hoyISO())}
        </p>
        <h1 className="text-headline-md font-semibold text-on-surface">{etiquetaTipo(tipo)}</h1>
        <p className="text-body-md text-on-surface-variant">{descripcionPeriodo}</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-headline-md font-semibold text-on-surface">Informes</h1>
          <p className="text-body-md text-on-surface-variant">
            Ingresos y pagos registrados (solo cobros aprobados).
          </p>
        </div>
        <Button onClick={() => window.print()} variant="primary">
          Imprimir / PDF
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-4 rounded-md border border-border bg-surface p-4 print:hidden">
        <Select label="Informe" id="tipo" value={tipo} onChange={(e) => setTipo(e.target.value as TipoInforme)}>
          {TIPOS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>

        {tipo === "ingresos" && (
          <>
            <Select
              label="Periodo"
              id="periodo"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value as PeriodoReporte)}
            >
              <option value="mensual">Mensual</option>
              <option value="anual">Anual</option>
              <option value="intervalo">Intervalo personalizado</option>
            </Select>
            {periodo === "intervalo" && (
              <div className="flex items-end gap-3">
                <Input label="Desde" id="desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
                <Input label="Hasta" id="hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
              </div>
            )}
          </>
        )}

        <Button
          variant="secondary"
          onClick={() => {
            setDesde("");
            setHasta("");
          }}
        >
          Limpiar filtros
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Ingresos (aprobados)" value={formatAR$(resumen.total)} hint={`${resumen.cantidad} pagos`} tone="success" />
        <StatCard label="Clientes con pagos" value={String(filasClientes.length)} hint="En el periodo" tone="primary" />
        <StatCard label="Campañas facturadas" value={String(filasCampanas.length)} hint="En el periodo" tone="warning" />
      </div>

      {tipo === "ingresos" && (
        <Card title={periodo === "anual" ? "Ingresos por año" : "Ingresos por mes"}>
          {periodo === "intervalo" ? (
            <IntervaloTable cobros={base} />
          ) : (
            <Table
              rows={filasIngresos}
              empty="No hay cobros aprobados en el periodo."
              columns={[
                { key: "etiqueta", header: "Periodo", render: (r) => r.etiqueta },
                { key: "cantidad", header: "Pagos", render: (r) => r.cantidad },
                { key: "total", header: "Total", render: (r) => <b>{formatAR$(r.total)}</b> },
              ]}
            />
          )}
        </Card>
      )}

      {tipo === "clientes" && (
        <Card title="Pagos por cliente">
          <Table
            rows={filasClientes}
            empty="No hay pagos aprobados."
            columns={[
              { key: "cliente", header: "Cliente", render: (r) => r.cliente },
              { key: "cantidad", header: "Pagos", render: (r) => r.cantidad },
              { key: "total", header: "Total", render: (r) => <b>{formatAR$(r.total)}</b> },
            ]}
          />
        </Card>
      )}

      {tipo === "campanas" && (
        <Card title="Pagos por campaña">
          <Table
            rows={filasCampanas}
            empty="No hay pagos aprobados."
            columns={[
              { key: "campana", header: "Campaña", render: (r) => <span className="font-medium">{r.campana}</span> },
              { key: "cliente", header: "Cliente", render: (r) => r.cliente },
              { key: "cantidad", header: "Pagos", render: (r) => r.cantidad },
              { key: "total", header: "Total", render: (r) => <b>{formatAR$(r.total)}</b> },
            ]}
          />
        </Card>
      )}
    </div>
  );
}

function IntervaloTable({ cobros }: { cobros: CobroConPauta[] }) {
  const filas = useMemo(() => {
    const grupos = new Map<string, { fecha: string; cantidad: number; total: number }>();
    for (const c of cobros) {
      if (c.estado !== "aprobado") continue;
      const fecha = (c.fecha_pago ?? "").slice(0, 10);
      if (!fecha) continue;
      const g = grupos.get(fecha) ?? { fecha, cantidad: 0, total: 0 };
      g.cantidad += 1;
      g.total += Number(c.monto);
      grupos.set(fecha, g);
    }
    return [...grupos.values()].sort((a, b) => a.fecha.localeCompare(b.fecha));
  }, [cobros]);

  return (
    <Table
      rows={filas}
      empty="No hay cobros aprobados en el intervalo."
      columns={[
        { key: "fecha", header: "Fecha", render: (r) => formatFecha(r.fecha) },
        { key: "cantidad", header: "Pagos", render: (r) => r.cantidad },
        { key: "total", header: "Total", render: (r) => <b>{formatAR$(r.total)}</b> },
      ]}
    />
  );
}