-- ============================================================
-- Sistema Publicidad Radio Latina 95.7 — Esquema Supabase
-- Pegar y ejecutar completo en el SQL Editor (Dashboard > SQL Editor).
-- Este script es idempotente: seguro de correr más de una vez.
-- ============================================================

-- Extensiones
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES (referencia a auth.users) + trigger de creación
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  nombre text,
  rol text not null default 'operador' check (rol in ('admin', 'operador')),
  created_at timestamptz not null default now()
);

-- Auto-crear perfil al registrarse un nuevo usuario
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, nombre)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'nombre', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- CLIENTES
-- ============================================================
create table if not exists public.clientes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nombre text not null,
  telefono text not null,
  email text,
  cuit text,
  notas text,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================
-- PAUTAS (contratos publicitarios)
-- ============================================================
create table if not exists public.pautas (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  cliente_id uuid not null references public.clientes (id) on delete cascade,
  nombre text not null,
  pases int not null default 1,
  tarifa numeric(12,2) not null default 0,
  fecha_inicio date not null,
  fecha_fin date not null,
  estado text not null default 'activa' check (estado in ('activa', 'pausada', 'finalizada')),
  monto_total numeric(12,2),
  created_at timestamptz not null default now()
);

-- ============================================================
-- COBROS (y recibos)
-- ============================================================
create table if not exists public.cobros (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  pauta_id uuid not null references public.pautas (id) on delete cascade,
  monto numeric(12,2) not null default 0,
  metodo text not null default 'transferencia'
    check (metodo in ('efectivo', 'transferencia', 'mercadopago', 'otro')),
  fecha_pago date not null default current_date,
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'aprobado', 'vencido')),
  fecha_vencimiento date,
  nro_recibo text,
  nota text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- ÍNDICES para performance
-- ============================================================
create index if not exists idx_clientes_user_id on public.clientes (user_id);
create index if not exists idx_pautas_user_id on public.pautas (user_id);
create index if not exists idx_pautas_cliente_id on public.pautas (cliente_id);
create index if not exists idx_cobros_user_id on public.cobros (user_id);
create index if not exists idx_cobros_pauta_id on public.cobros (pauta_id);

-- ============================================================
-- RECIBOS: numeración automática tipo talonario
-- Formato "006-0000100" → punto de venta 006 + correlativo de 7 dígitos.
-- La secuencia arranca en 100 (primer recibo: 006-0000100).
-- El trigger asigna el número SOLO al cobro que queda "aprobado"
-- (no consume números por cobros pendientes que nunca se pagan).
-- ============================================================
create sequence if not exists public.recibo_nro_seq
  start with 100
  minvalue 1
  no cycle;

-- Un índice único (parcial) evita recibos duplicados.
create unique index if not exists uq_cobros_nro_recibo
  on public.cobros (nro_recibo)
  where nro_recibo is not null;

create or replace function public.cobros_asignar_nro_recibo()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.estado = 'aprobado' and new.nro_recibo is null then
    new.nro_recibo := '006-' || lpad(nextval('public.recibo_nro_seq')::text, 7, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists cobros_asignar_nro_recibo on public.cobros;
create trigger cobros_asignar_nro_recibo
  before insert or update of estado on public.cobros
  for each row execute function public.cobros_asignar_nro_recibo();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Cada usuario solo ve y edita SU PROPIA información.
-- ============================================================
alter table public.profiles enable row level security;
alter table public.clientes enable row level security;
alter table public.pautas enable row level security;
alter table public.cobros enable row level security;

-- PROFILE: cada uno ve/edita el propio
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
-- Insert se maneja via trigger (security definer), no requiere policy.

-- CLIENTES
drop policy if exists "clientes_select_own" on public.clientes;
create policy "clientes_select_own" on public.clientes for select using (auth.uid() = user_id);
drop policy if exists "clientes_insert_own" on public.clientes;
create policy "clientes_insert_own" on public.clientes for insert with check (auth.uid() = user_id);
drop policy if exists "clientes_update_own" on public.clientes;
create policy "clientes_update_own" on public.clientes for update using (auth.uid() = user_id);
drop policy if exists "clientes_delete_own" on public.clientes;
create policy "clientes_delete_own" on public.clientes for delete using (auth.uid() = user_id);

-- PAUTAS
drop policy if exists "pautas_select_own" on public.pautas;
create policy "pautas_select_own" on public.pautas for select using (auth.uid() = user_id);
drop policy if exists "pautas_insert_own" on public.pautas;
create policy "pautas_insert_own" on public.pautas for insert with check (auth.uid() = user_id);
drop policy if exists "pautas_update_own" on public.pautas;
create policy "pautas_update_own" on public.pautas for update using (auth.uid() = user_id);
drop policy if exists "pautas_delete_own" on public.pautas;
create policy "pautas_delete_own" on public.pautas for delete using (auth.uid() = user_id);

-- COBROS
drop policy if exists "cobros_select_own" on public.cobros;
create policy "cobros_select_own" on public.cobros for select using (auth.uid() = user_id);
drop policy if exists "cobros_insert_own" on public.cobros;
create policy "cobros_insert_own" on public.cobros for insert with check (auth.uid() = user_id);
drop policy if exists "cobros_update_own" on public.cobros;
create policy "cobros_update_own" on public.cobros for update using (auth.uid() = user_id);
drop policy if exists "cobros_delete_own" on public.cobros;
create policy "cobros_delete_own" on public.cobros for delete using (auth.uid() = user_id);

-- ============================================================
-- SEED (opcional y seguro)
-- Datos de ejemplo atados al primer usuario que los consulte
-- (el botón "Generar datos de ejemplo" en la app llena esto).
-- ============================================================

-- Función para sembrar datos de ejemplo para el usuario actual.
-- Se invoca desde la app (RPC) cuando el usuario lo pide (VITE_SEED_ENABLED).
create or replace function public.seed_demo_data()
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_cliente1 uuid;
  v_cliente2 uuid;
  v_cliente3 uuid;
  v_pauta1 uuid;
begin
  if v_uid is null then
    raise exception 'Usuario no autenticado';
  end if;

  -- Limpia lo previo del usuario para evitar duplicados
  delete from public.cobros where user_id = v_uid;
  delete from public.pautas where user_id = v_uid;
  delete from public.clientes where user_id = v_uid;

  insert into public.clientes (user_id, nombre, telefono, email, cuit, notas) values
    (v_uid, 'Fabrica de Calzados Don Mario', '5491112345678', 'contacto@donmario.com', '20-33445566-7', 'Cliente histórico, paga por transferencia.'),
    (v_uid, 'Bazar La Vecina', '5492233344444', 'labvecina@gmail.com', '27-11223344-5', 'Preferencia de spots por la mañana.'),
    (v_uid, 'Heladería Fiorito', '5493355566666', null, null, 'Nuevo, probó campaña de verano.');
  select id into v_cliente1 from public.clientes where user_id = v_uid and nombre = 'Fabrica de Calzados Don Mario';
  select id into v_cliente2 from public.clientes where user_id = v_uid and nombre = 'Bazar La Vecina';
  select id into v_cliente3 from public.clientes where user_id = v_uid and nombre = 'Heladería Fiorito';

  insert into public.pautas (user_id, cliente_id, nombre, pases, tarifa, fecha_inicio, fecha_fin, estado, monto_total) values
    (v_uid, v_cliente1, 'Campaña Quincena Publicitaria', 60, 2500, current_date - 20, current_date + 40, 'activa', 150000),
    (v_uid, v_cliente2, 'Spot Mañanas 95.7', 30, 1200, current_date - 10, current_date + 20, 'activa', 36000),
    (v_uid, v_cliente3, 'Verano - Happy Hour', 20, 900, current_date - 40, current_date - 5, 'finalizada', 18000);
  select id into v_pauta1 from public.pautas where user_id = v_uid and nombre = 'Campaña Quincena Publicitaria';

  insert into public.cobros (user_id, pauta_id, monto, metodo, fecha_pago, estado, fecha_vencimiento, nro_recibo) values
    (v_uid, v_pauta1, 60000, 'transferencia', current_date - 5, 'aprobado', current_date - 8, 'R-0001'),
    (v_uid, v_pauta1, 45000, 'transferencia', null, 'pendiente', current_date + 6, null),
    (v_uid, v_pauta1, 25000, 'mercadopago', null, 'vencido', current_date - 3, null);
end;
$$;
