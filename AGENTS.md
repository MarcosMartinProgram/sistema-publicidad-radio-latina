# AGENTS.md — Sistema Publicidad Radio Latina Du Graty 102.3 Mhz

> Documento vivo. Registra el plan, las decisiones y el progreso del proyecto.
> Actualizar en cada cambio relevante.

## 1. Resumen

Aplicación web de gestión de publicidad para **Radio Latina Du Graty 102.3 Mhz** (FM). Sistema tipo
SaaS con dashboard, clientes, pautas/contratos, cobros/recibos y disparo por WhatsApp.
Construida a partir de los diseños de **Google Stitch** conectados vía MCP
(proyecto `Radio Latina Management SaaS`), aplicando el design system "Sincronía Latina".

## 2. Decisiones del proyecto

| Decisión | Valor elegido | Notas |
| --- | --- | --- |
| Diseño fuente | Google Stitch (MCP) · "Radio Latina Management SaaS" | Proyecto `7313631831221919120` |
| Fidelidad | Seguir el design system (no copiar HTML) | Design system "Sincronía Latina" |
| Tipo de sitio | Dashboard / App web | Modulos internos de gestión |
| Stack | React + Vite | TypeScript |
| Estilos | Tailwind CSS v3 | Tokens mapeados del design system |
| Backend | Supabase | Postgres + RLS + Auth |
| Autenticación | Sí, con login | Correo/contraseña, RLS por sesión |
| Datos | Supabase (SQL + RLS + seed) | |
| WhatsApp | Enlace `wa.me` con mensaje prefabricado | Sin API pago |
| Moneda / región | ARS (pesos argentinos) · es-AR | |

### Módulos incluidos (fase 1)
- [x] Dashboard principal (KPIs + semáforo de cobros + tablas)
- [x] Gestión de Clientes (listado + alta/edición)
- [x] Pautas / Contratos (alta y listado)
- [x] Cobros y recibos (registro + estados)
- [x] WhatsApp 1-Clic (botón wa.me y recordatorios)
- [x] Autenticación (login + sesión)

## 3. Design System "Sincronía Latina" (tokens)

Copiado al `tailwind.config.js` y `src/index.css`.

- **Primario:** `#00288e` (royal blue)
- **Fondo:** `#f8f9ff` · **Superficie:** `#FFFFFF`
- **Sidebar:** `#0F172A` (deep navy)
- **Semáforo:** success `#059669` · warning `#D97706` · danger `#DC2626`
- **Tipografía:** `Inter` (headline 30/24/18, body 16/14/12, label-md 12 uppercase, table-data 13)
- **Radios:** md `0.375rem`, lg `0.5rem`, xl `0.75rem` (soft)
- **Bordes:** `#E2E8F0` · elevación por outline (sin sombras fuertes)
- **Densidad:** compacta en tablas (8px), container máx `1440px`

## 4. Arquitectura

```
sistema-publicidad/
├─ public/favicon.svg
├─ src/
│  ├─ index.css             # estilos base + tokens
│  ├─ main.tsx              # bootstrap react + router
│  ├─ App.tsx               # rutas + guard de auth
│  ├─ vite-env.d.ts
│  ├─ lib/
│  │  ├─ supabase.ts        # cliente Supabase
│  │  ├─ types.ts           # tipos de dominio (Cliente, Pauta, Cobro)
│  │  └─ utils.ts           # moneda ARS, fechas, telefono, construcción wa.me
│  ├─ data/seed.ts          # datos de ejemplo (opcional)
│  ├─ context/AuthContext.tsx
│  ├─ components/
│  │  ├─ ui/                # Button, Card, Badge, Input, Modal, Table...
│  │  └─ layout/            # Sidebar, Topbar, AppShell
│  └─ pages/
│     ├─ Auth.tsx           # login / registro
│     ├─ Dashboard.tsx
│     ├─ Clientes.tsx
│     ├─ Pautas.tsx
│     └─ Cobros.tsx
├─ supabase/
│  └─ schema.sql            # tablas + RLS + seed (para pegar en SQL Editor)
├─ .env.example
├─ tailwind.config.js
├─ vite.config.ts
├─ tsconfig*.json
└─ AGENTS.md
```

## 5. Modelo de datos (Supabase)

- **profiles** — referencia a `auth.users`, rol (`admin` / `operador`).
- **clientes** — nombre, teléfono, email, cuit, notas, activo.
- **pautas** — cliente_id, nombre, duración (pases), tarifa, fecha_inicio, fecha_fin,
  estado (activa/pausada/finalizada), monto_total.
- **cobros** — pauta_id, monto, método, fecha_pago, estado (pendiente/aprobado/vencido),
  fecha_vencimiento, nro_recibo, nota.

Reglas: RLS habilitado en todas; solo usuarios autenticados leen/escriben sus datos;
Seed opcional protegido.

## 6. Setup del proyecto
- `npm install`
- Crear proyecto en Supabase, correr el `supabase/schema.sql` en el SQL Editor.
- Copiar `.env.example` → `.env` y pegar URL + anon key.
- `npm run dev`

## 7. Comandos útiles
- `npm run dev` — servidor local (puerto 5173)
- `npm run build` — typecheck (`tsc -b`) + build (`vite build`)
- `npm run lint` — eslint
- `npm run test` — corre la suite de tests (vitest)
- `npm run test:watch` — vitest en modo watch
- `npm run preview` — previsualizar build

## 8. Progreso (log)

**FASE 1 — Construcción (completada)**
- [x] Fijar stack y decisiones (ver tabla §2)
- [x] Crear archivos base de Vite + TS + Tailwind
- [x] Definir design system en Tailwind
- [x] Cliente Supabase + tipos + utilidades
- [x] SQL schema con RLS + seed
- [x] Login / Auth
- [x] Layout (Sidebar navy + Topbar + shell responsive)
- [x] Componentes UI
- [x] Dashboard
- [x] Clientes
- [x] Pautas / Contratos
- [x] Cobros y recibos
- [x] WhatsApp 1-Clic
- [x] Lint + typecheck + build  ✅

**FASE 1.5 — Auditoría + tests (completada)**
- [x] Instalar stack de tests (Vitest 4 + Testing Library + jsdom)
- [x] Configurar vitest.config + setup
- [x] Tests unitarios `lib/utils.ts` (28)
- [x] Tests `lib/api.ts` — cálculo de `monto_total` (4)
- [x] Tests componentes UI — Button, Input, Badge, Modal, WhatsApp (28)
- [x] Smoke Auth con Supabase mockeado (5)
- [x] Bug fix: `normalizarTelefono` (10 dígitos mal formado)
- [x] Bug fix: `AuthContext.signIn/signUp` throw de Error
- [x] `npm test` 67/67 ✓ · `npm run lint` 0 errores · `npm run build` ✓

**Checklist de verificación:** `npm run build` OK · `npm run lint` 0 errores (1 warning
de fast-refresh). Build a `dist/` correcto (98 módulos).

### Corrida / validación (2026-08-25)
- `npm install` OK (hay 4 vulnerabilities de deps, mayormente dev — se puede auditar luego).
- `npm run build` → build de producción exitoso.
- `npm run lint` → sin errores.

### Corrección de dependencias (audit npm) — 2026-08-26
- `npm audit` reportaba 4 vulns: esbuild (vía vite), react-router (open redirect + constructor
  injection). Todas de scope dev/SSR, no explotables en el SPA (sin SSR).
- Se resolvió con **upgrade agresivo**: `vite@8.2.2` + `react-router-dom@7.18.2` +
  `@vitejs/plugin-react@5` (requerido por vite 8).
- Verificación: `npm install` → `found 0 vulnerabilities` · `npm run build` OK (87 módulos, Vite 8) ·
  `npm run lint` 0 errores (1 warning fast-refresh) · dev server HTTP 200.

### Auditoría + tests (FASE 1.5) — 2026-08-26
- **Hallazgos / bugs corregidos durante la auditoría:**
  - `src/lib/utils.ts` `normalizarTelefono`: quitaba el `9` de un local de 10 dígitos,
    dejando un número mal formado de 9 dígitos. Cambiado el chequeo a `length === 11`
    (input móvil con prefijo `9`), que es el caso correcto.
  - `src/context/AuthContext.tsx` `signIn`/`signUp`: hacían `throw error` (objeto
    crudo de Supabase, que **no** es instancia de `Error`). Esto rompía el catch en
    `Auth.tsx` que muestra el mensaje en español para "Invalid login credentials".
    Se reemplazó por `throw new Error(error.message)`.

- **Stack de tests agregado:**
  - `vitest@4` + `jsdom` + `@testing-library/react` + `@testing-library/jest-dom` +
    `@testing-library/user-event`.
  - `vitest.config.ts` (mismo alias `@` que `vite.config.ts`, `environment: jsdom`,
    `setupFiles: src/test/setup.ts`).
  - `src/test/setup.ts` (cleanup automático + `matchMedia` mock).

- **Suite (67 tests en 8 archivos, todos pasan):**
  - `src/lib/utils.test.ts` — 28 tests (moneda, parseo, fechas, tel, wa.me, initiales, vencido).
  - `src/lib/api.test.ts` — 4 tests (cálculo `monto_total = pases * tarifa` en `crearPauta`,
    updates y deletes).
  - `src/components/ui/Button.test.tsx` — 5 tests.
  - `src/components/ui/Input.test.tsx` — 6 tests (Input + Select controlado).
  - `src/components/ui/Badge.test.tsx` — 8 tests (Badge + EstatusCobroBadge + EstatusPautaBadge).
  - `src/components/ui/Modal.test.tsx` — 6 tests (open/close, ESC, backdrop, scroll-lock).
  - `src/components/ui/WhatsApp.test.tsx` — 3 tests (link wa.me + mensaje recordatorio).
  - `src/pages/Auth.test.tsx` — 5 tests (login, registro, error es-AR, flujo mockeando Supabase).

- **Verificación:** `npm run test` → 67/67 ✓ · `npm run lint` → 0 errores (1 warning
  fast-refresh conocido) · `npm run build` → 87 módulos, sin errores.

- **Pendientes / próximos pasos sugeridos:**
  - Tests E2E con Playwright (flujos completos: alta cliente → pauta → cobro → WhatsApp).
  - Tests de los componentes/páginas: `Clientes`, `Pautas`, `Cobros`, `Dashboard` con
    MSW + `@testing-library/user-event`.
  - Tests de `generarDatosDemo` (integración contra un Supabase local o MSW).

### Lo que falta / próximos pasos
- [ ] Que el usuario cree el proyecto en Supabase, corra `supabase/schema.sql` y pegue `.env`.
- [ ] Conectar a un backend real ya provisto por el usuario (si cambia de Supabase).
- [ ] (Opcional) Botón de WhatsApp con teléfono real del cliente (hoy toma el del cliente)
      y número de emisor/configurable.
- [ ] (Opcional) Edición completa de pautas/cobros (hoy alta + cambio de estado + borrado).

### Configuración de producción (Supabase + Vercel) — 2026-09-01
- Nombre de radio actualizado a **"Radio Latina Du Graty 102.3 Mhz"** en toda la UI y archivos.
- **Signup con confirmación de email ON** (flujo deseado). El link de confirmación debe apuntar a
  la URL desplegada, no a localhost. Se agregó `emailRedirectTo: window.location.origin` en
  `signUp` de `AuthContext` y manejo del error "email rate limit exceeded" en español.
- **Configuración requerida en Supabase Dashboard → Authentication → URL Configuration:**
  - `Site URL` = URL de Vercel (ej. `https://tu-app.vercel.app`).
  - Agregar la URL de Vercel en **Redirect URLs** (y opcionalmente `http://localhost:5173`).
  - Si el email redirige a localhost, el signup falla y acumula rate limit.
- **Configuración requerida en Vercel:** variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
  (sin `VITE_SEED_ENABLED` en producción).

### Notas de implementación
- El seed de datos de ejemplo se hace **desde el cliente** (inserts con RLS) en
  `src/lib/api.ts → generarDatosDemo(userId)`, porque la función RPC `security definer`
  `seed_demo_data` devolvía 400 con la nueva key `sb_publishable_`. La función RPC quedó
  en `schema.sql` como opcional/compatibilidad.
- La app usa la key pública `sb_publishable_...` (equivalente a la anon key). Stored.

> Nota: este archivo no es código de la app; es la config/plan para el agente.
> Al terminar cada bloque, actualizar la lista del punto 8.
