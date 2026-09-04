import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { EstatusCobroBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Feedback";
import { WhatsAppButton, RecordatorioMsg } from "@/components/ui/WhatsApp";
import { ReciboPDFButton } from "@/components/ui/ReciboPDF";
import {
  listarPautasConCliente,
  listarCobrosConPauta,
  crearCobro,
  actualizarEstadoCobro,
  eliminarCobro,
} from "@/lib/api";
import { formatAR$, formatFecha, hoyISO, parseMonto, sumarDias, estadoCobroEfectivo } from "@/lib/utils";
import type { Cobro, CobroConPauta, Pauta } from "@/lib/types";

interface FormState {
  pauta_id: string;
  monto: number;
  metodo: Cobro["metodo"];
  fecha_pago: string;
  fecha_vencimiento: string;
  estado: Cobro["estado"];
  nota: string;
}

export function Cobros() {
  const { user } = useAuth();
  const [pautas, setPautas] = useState<Pauta[]>([]);
  const [cobros, setCobros] = useState<CobroConPauta[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>({
    pauta_id: "",
    monto: 0,
    metodo: "transferencia",
    fecha_pago: hoyISO(),
    fecha_vencimiento: sumarDias(hoyISO(), 30),
    estado: "aprobado",
    nota: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = async () => {
    setLoading(true);
    const [{ data: cob }, { data: pa }] = await Promise.all([
      listarCobrosConPauta(),
      listarPautasConCliente(),
    ]);
    setCobros(cob ?? []);
    setPautas(pa ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (user) cargar();
  }, [user]);

  const abrirAlta = () => {
    setForm({
      pauta_id: pautas[0]?.id ?? "",
      monto: pautas[0] ? Number(pautas[0].monto_total) : 0,
      metodo: "transferencia",
      fecha_pago: hoyISO(),
      fecha_vencimiento: sumarDias(hoyISO(), 30),
      estado: "aprobado",
      nota: "",
    });
    setError(null);
    setModalOpen(true);
  };

  const guardar = async () => {
    setError(null);
    if (!form.pauta_id || form.monto <= 0) {
      setError("Seleccioná una pauta y cargá un monto mayor a cero.");
      return;
    }
    setSaving(true);
    try {
      await crearCobro({
        user_id: user!.id,
        pauta_id: form.pauta_id,
        monto: Number(form.monto),
        metodo: form.metodo,
        fecha_pago: form.fecha_pago,
        fecha_vencimiento: form.fecha_vencimiento,
estado: form.estado,
      nro_recibo: null,
      nota: form.nota.trim() || null,
      });
      await cargar();
      setModalOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  };

  const cambiarEstado = async (c: Cobro, estado: Cobro["estado"]) => {
    await actualizarEstadoCobro(c.id, estado);
    await cargar();
  };

  const borrar = async (c: Cobro) => {
    if (!confirm("¿Eliminar este cobro?")) return;
    await eliminarCobro(c.id);
    await cargar();
  };

  const totales = useMemo(() => {
    const estado = (c: Cobro) => estadoCobroEfectivo(c);
    const pendiente = cobros.filter((c) => estado(c) === "pendiente").reduce((s, c) => s + Number(c.monto), 0);
    const aprobado = cobros.filter((c) => estado(c) === "aprobado").reduce((s, c) => s + Number(c.monto), 0);
    const vencido = cobros.filter((c) => estado(c) === "vencido").reduce((s, c) => s + Number(c.monto), 0);
    return { pendiente, aprobado, vencido };
  }, [cobros]);

  if (loading) return <Spinner label="Cargando cobros..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" disabled>
            Pendiente · {formatAR$(totales.pendiente)}
          </Button>
          <Button variant="secondary" size="sm" disabled>
            Aprobado · {formatAR$(totales.aprobado)}
          </Button>
          <Button variant="secondary" size="sm" disabled>
            Vencido · {formatAR$(totales.vencido)}
          </Button>
        </div>
        <Button onClick={abrirAlta} disabled={pautas.length === 0} title={pautas.length === 0 ? "Necesitás al menos una pauta" : ""}>
          Registrar cobro
        </Button>
      </div>

      {pautas.length === 0 && (
        <div className="card border-dashed p-6 text-center text-body-md text-on-surface-variant">
          Primero creá una pauta desde el menú «Pautas» para poder registrar cobros.
        </div>
      )}

      <Card>
        <Table
          rows={cobros}
          empty="Sin cobros registrados."
          columns={[
            { key: "monto", header: "Monto", render: (c: Cobro) => <b>{formatAR$(Number(c.monto))}</b> },
            {
              key: "concepto",
              header: "Concepto",
              render: (c: Cobro) =>
                (c as CobroConPauta).pautas?.nombre ?? "—",
            },
            { key: "pago", header: "Pago", render: (c: Cobro) => formatFecha(c.fecha_pago) },
            {
              key: "vto",
              header: "Vencimiento",
              render: (c: Cobro) => (c.fecha_vencimiento ? formatFecha(c.fecha_vencimiento) : "—"),
            },
            { key: "metodo", header: "Método", render: (c: Cobro) => c.metodo },
            { key: "recibo", header: "Recibo", render: (c: Cobro) => c.nro_recibo || "—" },
            { key: "estado", header: "Estado", render: (c: Cobro) => <EstatusCobroBadge estado={estadoCobroEfectivo(c)} /> },
            {
              key: "acciones",
              header: "",
              className: "text-right",
              render: (c: Cobro) => {
                const pauta = (c as CobroConPauta).pautas;
                const cliente = pauta?.clientes;
                const estado = estadoCobroEfectivo(c);
                return (
                  <div className="flex justify-end gap-1">
                    {estado === "aprobado" ? (
                      <ReciboPDFButton cobro={c as CobroConPauta} />
                    ) : (
                      <>
                        <WhatsAppButton
                          telefono={cliente?.telefono ?? ""}
                          mensaje={RecordatorioMsg({
                            cliente: cliente?.nombre ?? "el cliente",
                            monto: formatAR$(Number(c.monto)),
                            pauta: pauta?.nombre ?? "tu pauta",
                          })}
                          label="Recordar"
                        />
                        <Button variant="ghost" size="sm" onClick={() => cambiarEstado(c, "aprobado")}>
                          Marcar aprobado
                        </Button>
                      </>
                    )}
                    <Button variant="ghost" size="sm" className="text-danger-600" onClick={() => borrar(c)}>
                      Borrar
                    </Button>
                  </div>
                );
              },
            },
          ]}
        />
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Registrar cobro y recibo"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={guardar} loading={saving}>
              Guardar cobro
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Pauta *"
            id="pauta"
            value={form.pauta_id}
            onChange={(e) => setForm({ ...form, pauta_id: e.target.value })}
          >
            <option value="">Seleccionar pauta...</option>
            {pautas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </Select>

          <Input
            label="Monto ($) *"
            id="monto"
            type="number"
            min={0}
            value={form.monto}
            onChange={(e) => setForm({ ...form, monto: parseMonto(e.target.value) })}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Método de pago"
              id="metodo"
              value={form.metodo}
              onChange={(e) => setForm({ ...form, metodo: e.target.value as Cobro["metodo"] })}
            >
              <option value="transferencia">Transferencia</option>
              <option value="efectivo">Efectivo</option>
              <option value="mercadopago">Mercado Pago</option>
              <option value="otro">Otro</option>
            </Select>
            <Select
              label="Estado"
              id="estado"
              value={form.estado}
              onChange={(e) => setForm({ ...form, estado: e.target.value as Cobro["estado"] })}
            >
              <option value="pendiente">Pendiente</option>
              <option value="aprobado">Aprobado</option>
              <option value="vencido">Vencido</option>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Fecha de pago"
              id="fecha_pago"
              type="date"
              value={form.fecha_pago}
              onChange={(e) => setForm({ ...form, fecha_pago: e.target.value })}
            />
            <Input
              label="Fecha de vencimiento"
              id="venc"
              type="date"
              value={form.fecha_vencimiento}
              onChange={(e) => setForm({ ...form, fecha_vencimiento: e.target.value })}
            />
          </div>

          <div className="rounded-md bg-surface-container-low px-4 py-3">
            <p className="text-body-sm text-on-surface-variant">
              El n° de recibo se genera automáticamente al aprobar el cobro:{" "}
              <span className="font-semibold text-primary">006-0000100</span>,{" "}
              <span className="font-semibold text-primary">006-0000101</span>, etc.
            </p>
          </div>

          <Input
            label="Nota"
            id="nota"
            value={form.nota}
            onChange={(e) => setForm({ ...form, nota: e.target.value })}
            placeholder="Observación"
          />

          {error && <p className="text-body-sm text-danger-600">{error}</p>}
        </div>
      </Modal>
    </div>
  );
}
