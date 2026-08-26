# Sistema Publicidad · Radio Latina 95.7

App web de gestión de publicidad (SaaS) construida con **React + Vite + Tailwind + Supabase**,
siguiendo el design system **"Sincronía Latina"** de los diseños de Google Stitch.

## Requisitos

- Node.js 18+ y npm
- Una cuenta gratuita en [Supabase](https://supabase.com)

## Guía de instalación paso a paso

### 1. Instalar dependencias

```bash
npm install
```

### 2. Crear el proyecto en Supabase

1. Entrá a https://supabase.com y creá una cuenta (es gratis).
2. Creá un **New project**. Elegí un nombre (ej. `radio-latina-957`), una contraseña de
   base de datos y la región más cercana a Argentina (`South America (São Paulo)`).
3. Esperá a que el proyecto termine de aprovisionarse (~1-2 min).

### 3. Correr el esquema (tablas + RLS + seed)

1. En el dashboard de Supabase, entrá a **SQL Editor** (menú izquierdo).
2. Pegá **todo** el contenido del archivo `supabase/schema.sql`.
3. Ejecutá (botón **Run**). Confirmá que no haya errores.
   - Esto crea las tablas `profiles`, `clientes`, `pautas` y `cobros`, activa **RLS**
     (cada usuario sólo ve y edita su propia info) y el trigger que crea el perfil al registrarse.

### 4. Conectar credenciales

1. En Supabase, andá a **Project Settings → API** (o el botón "Connect").
2. Copiá la **Project URL** (`https://xxxx.supabase.co`).
3. Copiá la **anon public key**.
4. En la carpeta del proyecto, copiá el archivo de ejemplo:

```bash
copy .env.example .env
```

5. Abrí `.env` y pegá tus valores:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

> `VITE_SEED_ENABLED=true` habilita el botón "Generar datos de ejemplo" del dashboard.

### 5. Levantar la app

```bash
npm run dev
```

Abrí http://localhost:5173. Vas a ver la pantalla de login.

## Primeros pasos en la app

1. **Creá una cuenta** (pestaña "Crear cuenta"). Te va a pedir confirmar el correo según
   la configuración de Auth de Supabase.
2. En el **Dashboard**, si no hay datos, usá **"Generar datos de ejemplo"** (usa la función
   `seed_demo_data`, protegida y desactivable quitando `VITE_SEED_ENABLED`).
3. Cargá tus **Clientes** → luego **Pautas** → registrá **Cobros**.
4. Usá los botones de **WhatsApp** para enviar recordatorios (enlace `wa.me`).

## Comandos

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Servidor local (puerto 5173) |
| `npm run build` | Typecheck + build de producción |
| `npm run lint` | Linter (ESLint) |
| `npm run preview` | Previsualizar el build |

## Estructura

```
src/
├─ lib/supabase.ts     # cliente Supabase
├─ lib/api.ts          # funciones de datos (clientes, pautas, cobros, seed)
├─ lib/types.ts        # tipos de dominio
├─ lib/utils.ts        # formato ARS, fechas, WhatsApp
├─ context/AuthContext.tsx
├─ components/ui/      # Button, Card, Badge, Input, Modal, Table, StatCard...
├─ components/layout/  # Sidebar, Topbar, AppShell
└─ pages/              # Auth, Dashboard, Clientes, Pautas, Cobros
```

## Seguridad

- **RLS** habilitado en todas las tablas: cada usuario lee/escribe sólo sus registros
  (`user_id = auth.uid()`).
- El seed (`seed_demo_data`) usa `security definer` y valida `auth.uid()`; quitá
  `VITE_SEED_ENABLED` para desactivar el botón.
- No se expone ninguna clave `service_role` en el frontend; sólo la **anon key** pública.
