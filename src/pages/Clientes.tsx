import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/Card";
import { Table, Avatar } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Feedback";
import { WhatsAppButton } from "@/components/ui/WhatsApp";
import { listarClientes, crearCliente, actualizarCliente, eliminarCliente } from "@/lib/api";
import { formatFecha } from "@/lib/utils";
import type { Cliente } from "@/lib/types";

interface FormState {
  nombre: string;
  telefono: string;
  email: string;
  cuit: string;
  notas: string;
  activo: boolean;
}

const emptyForm: FormState = {
  nombre: "",
  telefono: "",
  email: "",
  cuit: "",
  notas: "",
  activo: true,
};

export function Clientes() {
  const { user } = useAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Cliente | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = async () => {
    setLoading(true);
    const { data } = await listarClientes();
    setClientes(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (user) cargar();
  }, [user]);

  const filtrados = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return clientes;
    return clientes.filter(
      (c) => c.nombre.toLowerCase().includes(t) || c.telefono.includes(t) || (c.email ?? "").toLowerCase().includes(t)
    );
  }, [clientes, q]);

  const abrirAlta = () => {
    setEditando(null);
    setForm(emptyForm);
    setError(null);
    setModalOpen(true);
  };

  const abrirEdicion = (c: Cliente) => {
    setEditando(c);
    setForm({
      nombre: c.nombre,
      telefono: c.telefono,
      email: c.email ?? "",
      cuit: c.cuit ?? "",
      notas: c.notas ?? "",
      activo: c.activo,
    });
    setError(null);
    setModalOpen(true);
  };

  const guardar = async () => {
    setError(null);
    if (!form.nombre.trim() || !form.telefono.trim()) {
      setError("Nombre y teléfono son obligatorios.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        nombre: form.nombre.trim(),
        telefono: form.telefono.trim(),
        email: form.email.trim() || null,
        cuit: form.cuit.trim() || null,
        notas: form.notas.trim() || null,
        activo: form.activo,
        user_id: user!.id,
      };
      if (editando) {
        await actualizarCliente(editando.id, payload);
      } else {
        await crearCliente(payload);
      }
      await cargar();
      setModalOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  };

  const borrar = async (c: Cliente) => {
    if (!confirm(`¿Eliminar a "${c.nombre}"?`)) return;
    await eliminarCliente(c.id);
    await cargar();
  };

  if (loading) return <Spinner label="Cargando clientes..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre, teléfono o email..."
          className="sm:max-w-xs"
          aria-label="Buscar clientes"
        />
        <Button onClick={abrirAlta}>Nuevo cliente</Button>
      </div>

      <Card>
        <Table
          rows={filtrados}
          empty="No hay clientes. Creá el primero o generá datos de ejemplo desde el Dashboard."
          columns={[
            {
              key: "cliente",
              header: "Cliente",
              render: (c: Cliente) => (
                <div className="flex items-center gap-3">
                  <Avatar nombre={c.nombre} />
                  <div>
                    <p className="font-medium text-on-surface">{c.nombre}</p>
                    <p className="text-body-sm text-on-surface-variant">{c.email || "Sin email"}</p>
                  </div>
                </div>
              ),
            },
            { key: "tel", header: "Teléfono", render: (c: Cliente) => (
                <WhatsAppButton
                  telefono={c.telefono}
                  mensaje={`Hola ${c.nombre.split(" ")[0]}! 👋 Saludamos de Radio Latina 95.7.`}
                  label={c.telefono}
                />
              ) },
            { key: "cuit", header: "CUIT", render: (c: Cliente) => c.cuit || "—" },
            { key: "alta", header: "Alta", render: (c: Cliente) => formatFecha(c.created_at) },
            {
              key: "activo",
              header: "Estado",
              render: (c: Cliente) =>
                c.activo ? (
                  <Badge tone="success" dot>
                    Activo
                  </Badge>
                ) : (
                  <Badge tone="neutral" dot>
                    Inactivo
                  </Badge>
                ),
            },
            {
              key: "acciones",
              header: "",
              className: "text-right",
              render: (c: Cliente) => (
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="sm" onClick={() => abrirEdicion(c)}>
                    Editar
                  </Button>
                  <Button variant="ghost" size="sm" className="text-danger-600" onClick={() => borrar(c)}>
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
        title={editando ? "Editar cliente" : "Nuevo cliente"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={guardar} loading={saving}>
              {editando ? "Guardar cambios" : "Crear cliente"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Nombre y apellido *"
            id="nombre"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            placeholder="Ej. Bazar La Vecina"
          />
          <Input
            label="Teléfono (WhatsApp) *"
            id="telefono"
            value={form.telefono}
            onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            placeholder="Ej. 5491122334455"
            inputMode="tel"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Email"
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="contacto@empresa.com"
            />
            <Input
              label="CUIT"
              id="cuit"
              value={form.cuit}
              onChange={(e) => setForm({ ...form, cuit: e.target.value })}
              placeholder="20-33445566-7"
            />
          </div>
          <Input
            label="Notas"
            id="notas"
            value={form.notas}
            onChange={(e) => setForm({ ...form, notas: e.target.value })}
            placeholder="Preferencias, observaciones..."
          />
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={form.activo}
              onChange={(e) => setForm({ ...form, activo: e.target.checked })}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            <span className="text-body-md text-on-surface">Cliente activo</span>
          </label>
          {error && <p className="text-body-sm text-danger-600">{error}</p>}
        </div>
      </Modal>
    </div>
  );
}
