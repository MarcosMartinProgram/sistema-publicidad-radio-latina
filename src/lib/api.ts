import { supabase } from "./supabase";
import type { Cliente, Cobro, Database, Pauta } from "./types";

export function listarClientes() {
  return supabase.from("clientes").select("*").order("nombre", { ascending: true });
}

export function listarPautasConCliente() {
  return supabase
    .from("pautas")
    .select("*, clientes(nombre, telefono)")
    .order("created_at", { ascending: false });
}

export function listarCobrosConPauta() {
  return supabase
    .from("cobros")
    .select("*, pautas(nombre)")
    .order("created_at", { ascending: false });
}

export async function crearCliente(cliente: Omit<Cliente, "id" | "created_at">) {
  const { data, error } = await supabase.from("clientes").insert(cliente).select().single();
  if (error) throw error;
  return data;
}

export async function actualizarCliente(id: string, cambios: Partial<Cliente>) {
  const { error } = await supabase.from("clientes").update(cambios).eq("id", id);
  if (error) throw error;
}

export async function eliminarCliente(id: string) {
  const { error } = await supabase.from("clientes").delete().eq("id", id);
  if (error) throw error;
}

export async function crearPauta(pauta: Omit<Pauta, "id" | "created_at" | "monto_total">) {
  const payload = { ...pauta, monto_total: pauta.pases * pauta.tarifa };
  const { data, error } = await supabase.from("pautas").insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function actualizarEstadoPauta(id: string, estado: Pauta["estado"]) {
  const { error } = await supabase.from("pautas").update({ estado }).eq("id", id);
  if (error) throw error;
}

export async function eliminarPauta(id: string) {
  const { error } = await supabase.from("pautas").delete().eq("id", id);
  if (error) throw error;
}

export async function crearCobro(cobro: Omit<Cobro, "id" | "created_at">) {
  const { data, error } = await supabase.from("cobros").insert(cobro).select().single();
  if (error) throw error;
  return data;
}

export async function actualizarEstadoCobro(id: string, estado: Cobro["estado"]) {
  const { error } = await supabase.from("cobros").update({ estado }).eq("id", id);
  if (error) throw error;
}

export async function eliminarCobro(id: string) {
  const { error } = await supabase.from("cobros").delete().eq("id", id);
  if (error) throw error;
}

/** Genera datos de ejemplo para el usuario indicado, insertando desde el cliente (vía RLS). */
export async function generarDatosDemo(userId: string) {
  const hoy = new Date();
  const iso = (offsetDias: number) => {
    const d = new Date(hoy);
    d.setDate(d.getDate() + offsetDias);
    return d.toISOString().slice(0, 10);
  };

  await supabase.from("cobros").delete().eq("user_id", userId);
  await supabase.from("pautas").delete().eq("user_id", userId);
  await supabase.from("clientes").delete().eq("user_id", userId);

  const clientesInsert = [
    { user_id: userId, nombre: "Fabrica de Calzados Don Mario", telefono: "5491112345678", email: "contacto@donmario.com", cuit: "20-33445566-7", notas: "Cliente histórico, paga por transferencia.", activo: true },
    { user_id: userId, nombre: "Bazar La Vecina", telefono: "5492233344444", email: "labvecina@gmail.com", cuit: "27-11223344-5", notas: "Preferencia de spots por la mañana.", activo: true },
    { user_id: userId, nombre: "Heladería Fiorito", telefono: "5493355566666", email: null, cuit: null, notas: "Nuevo, probó campaña de verano.", activo: true },
  ] satisfies Database["public"]["Tables"]["clientes"]["Insert"][];

  const { data: clientes, error: errClientes } = await supabase
    .from("clientes")
    .insert(clientesInsert)
    .select();
  if (errClientes) throw errClientes;
  const [c1, c2, c3] = clientes ?? [];

  const pautasInsert = [
    { user_id: userId, cliente_id: c1.id, nombre: "Campaña Quincena Publicitaria", pases: 60, tarifa: 2500, monto_total: 150000, fecha_inicio: iso(-20), fecha_fin: iso(40), estado: "activa" },
    { user_id: userId, cliente_id: c2.id, nombre: "Spot Mañanas", pases: 30, tarifa: 1200, monto_total: 36000, fecha_inicio: iso(-10), fecha_fin: iso(20), estado: "activa" },
    { user_id: userId, cliente_id: c3.id, nombre: "Verano - Happy Hour", pases: 20, tarifa: 900, monto_total: 18000, fecha_inicio: iso(-40), fecha_fin: iso(-5), estado: "finalizada" },
  ] satisfies Database["public"]["Tables"]["pautas"]["Insert"][];

  const { data: pautas, error: errPautas } = await supabase
    .from("pautas")
    .insert(pautasInsert)
    .select();
  if (errPautas) throw errPautas;
  const p1 = (pautas ?? [])[0];

  const cobrosInsert = [
    { user_id: userId, pauta_id: p1.id, monto: 60000, metodo: "transferencia", fecha_pago: iso(-5), estado: "aprobado", fecha_vencimiento: iso(-8), nro_recibo: "R-0001" },
    { user_id: userId, pauta_id: p1.id, monto: 45000, metodo: "transferencia", fecha_pago: iso(0), estado: "pendiente", fecha_vencimiento: iso(6), nro_recibo: null },
    { user_id: userId, pauta_id: p1.id, monto: 25000, metodo: "mercadopago", fecha_pago: iso(0), estado: "vencido", fecha_vencimiento: iso(-3), nro_recibo: null },
  ] satisfies Database["public"]["Tables"]["cobros"]["Insert"][];

  const { error: errCobros } = await supabase.from("cobros").insert(cobrosInsert);
  if (errCobros) throw errCobros;
}
