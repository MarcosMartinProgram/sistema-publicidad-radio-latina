import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { EstatusPautaBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Feedback";
import { WhatsAppButton } from "@/components/ui/WhatsApp";
import {
  listarClientes,
  listarPautasConCliente,
  crearPauta,
  actualizarEstadoPauta,
  eliminarPauta,
} from "@/lib/api";
import { formatAR$, formatFecha, hoyISO, parseMonto, sumarDias } from "@/lib/utils";
import type { Cliente, Pauta } from "@/lib/types";

interface FormState {
  cliente_id: string;
  nombre: string;
  pases: number;
  tarifa: number;
  fecha_inicio: string;
  fecha_fin: string;
}

export function Pautas() {
  const { user } = useAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [pautas, setPautas] = useState<Pauta[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>({
    cliente_id: "",
    nombre: "",
    pases: 1,
    tarifa: 0,
    fecha_inicio: hoyISO(),
    fecha_fin: sumarDias(hoyISO(), 30),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = async () => {
    setLoading(true);
    const [{ data: cl }, { data: pa }] = await Promise.all([
      listarClientes(),
      listarPautasConCliente(),
    ]);
    setClientes(cl ?? []);
    setPautas(pa ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (user) cargar();
  }, [user]);

  const nombreCliente = (id: string) => clientes.find((c) => c.id === id)?.nombre ?? "—";
  const telefonoCliente = (id: string) => clientes.find((c) => c.id === id)?.telefono ?? "";

  const monto = form.pases * form.tarifa || 0;

  const abrirAlta = () => {
    setForm({
      cliente_id: clientes[0]?.id ?? "",
      nombre: "",
      pases: 1,
      tarifa: 0,
      fecha_inicio: hoyISO(),
      fecha_fin: sumarDias(hoyISO(), 30),
    });
    setError(null);
    setModalOpen(true);
  };

  const guardar = async () => {
    setError(null);
    if (!form.cliente_id || !form.nombre.trim() || !form.pases || monto <= 0) {
      setError("Completá cliente, nombre, pases y un monto mayor a cero.");
      return;
    }
    if (form.fecha_fin < form.fecha_inicio) {
      setError("La fecha de fin no puede ser anterior al inicio.");
      return;
    }
    setSaving(true);
    try {
      await crearPauta({
        user_id: user!.id,
        cliente_id: form.cliente_id,
        nombre: form.nombre.trim(),
        pases: Number(form.pases),
        tarifa: Number(form.tarifa),
        fecha_inicio: form.fecha_inicio,
        fecha_fin: form.fecha_fin,
        estado: "activa",
      });
      await cargar();
      setModalOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  };

  const cambiarEstado = async (p: Pauta, estado: Pauta["estado"]) => {
    await actualizarEstadoPauta(p.id, estado);
    await cargar();
  };

  const borrar = async (p: Pauta) => {
    if (!confirm(`¿Eliminar la pauta "${p.nombre}"?`)) return;
    await eliminarPauta(p.id);
    await cargar();
  };

  if (loading) return <Spinner label="Cargando pautas..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-body-md text-on-surface-variant">
          {pautas.length} contrato(s) publicitario(s)
        </p>
        <Button onClick={abrirAlta} disabled={clientes.length === 0} title={clientes.length === 0 ? "Necesitás al menos un cliente" : ""}>
          Nueva pauta
        </Button>
      </div>

      {clientes.length === 0 && (
        <div className="card border-dashed p-6 text-center text-body-md text-on-surface-variant">
          Primero creá un cliente desde el menú «Clientes» para poder asociarlo a una pauta.
        </div>
      )}

      <Card>
        <Table
          rows={pautas}
          empty="Sin contratos. Creá el primero."
          columns={[
            {
              key: "nombre",
              header: "Pauta",
              render: (p: Pauta) => <span className="font-medium text-on-surface">{p.nombre}</span>,
            },
            { key: "cliente", header: "Cliente", render: (p: Pauta) => nombreCliente(p.cliente_id) },
            { key: "pases", header: "Pases", render: (p: Pauta) => p.pases },
            { key: "tarifa", header: "Tarifa", render: (p: Pauta) => formatAR$(Number(p.tarifa)) },
            { key: "total", header: "Total", render: (p: Pauta) => <b>{formatAR$(Number(p.monto_total))}</b> },
            {
              key: "periodo",
              header: "Periodo",
              render: (p: Pauta) => `${formatFecha(p.fecha_inicio)} → ${formatFecha(p.fecha_fin)}`,
            },
            { key: "estado", header: "Estado", render: (p: Pauta) => <EstatusPautaBadge estado={p.estado} /> },
            {
              key: "acciones",
              header: "",
              className: "text-right",
              render: (p: Pauta) => (
                <div className="flex justify-end gap-1">
                  <WhatsAppButton
                    telefono={telefonoCliente(p.cliente_id)}
                    mensaje={`Hola ${nombreCliente(p.cliente_id).split(" ")[0] || "cliente"}! 👋 Radio Latina 95.7: tu pauta "${p.nombre}" está ${p.estado}.`}
                    label="WhatsApp"
                  />
                  {p.estado !== "finalizada" ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => cambiarEstado(p, "finalizada")}
                    >
                      Finalizar
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => cambiarEstado(p, "activa")}
                    >
                      Reactivar
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="text-danger-600" onClick={() => borrar(p)}>
                    Borrar
                  </Button>
                </div>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nueva pauta publicitaria"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={guardar} loading={saving}>
              Crear contrato
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Cliente *"
            id="cliente"
            value={form.cliente_id}
            onChange={(e) => setForm({ ...form, cliente_id: e.target.value })}
          >
            <option value="">Seleccionar cliente...</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </Select>

          <Input
            label="Nombre de la pauta *"
            id="nombre"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            placeholder="Ej. Campaña Quincena Publicitaria"
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Pases *"
              id="pases"
              type="number"
              min={1}
              value={form.pases}
              onChange={(e) => setForm({ ...form, pases: Number(e.target.value) })}
            />
            <Input
              label="Tarifa por pase ($) *"
              id="tarifa"
              type="number"
              min={0}
              value={form.tarifa}
              onChange={(e) => setForm({ ...form, tarifa: parseMonto(e.target.value) })}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Fecha de inicio"
              id="inicio"
              type="date"
              value={form.fecha_inicio}
              onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })}
            />
            <Input
              label="Fecha de fin"
              id="fin"
              type="date"
              value={form.fecha_fin}
              onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })}
            />
          </div>

          <div className="rounded-md bg-surface-container-low px-4 py-3">
            <span className="text-label-md uppercase text-on-surface-variant">Total del contrato</span>
            <p className="text-headline-md font-semibold text-primary">{formatAR$(monto)}</p>
          </div>

          {error && <p className="text-body-sm text-danger-600">{error}</p>}
        </div>
      </Modal>
    </div>
  );
}
