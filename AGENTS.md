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
├─ public/
│  ├─ favicon.svg
│  └─ LogoMPMLabs%20(2).png # logo de la empresa en el sidebar (referido URL-encoded)
├─ src/
│  ├─ index.css             # estilos base + tokens + @media print
│  ├─ main.tsx              # bootstrap react + router
│  ├─ App.tsx               # rutas + guard de auth
│  ├─ vite-env.d.ts
│  ├─ lib/
│  │  ├─ supabase.ts        # cliente Supabase
│  │  ├─ types.ts           # tipos de dominio (Cliente, Pauta, Cobro)
│  │  ├─ utils.ts           # moneda ARS, fechas, estados, WhatsApp
│  │  └─ reportes.ts        # lógica pura de informes (ingresos, clientes, campañas)
│  ├─ data/seed.ts          # datos de ejemplo (opcional)
│  ├─ context/AuthContext.tsx
│  ├─ components/
│  │  ├─ ui/                # Button, Card, Badge, Input, Modal, Table...
│  │  └─ layout/            # Sidebar (incluye logo + copyright), Topbar, AppShell
│  └─ pages/
│     ├─ Auth.tsx           # login / registro
│     ├─ Dashboard.tsx
│     ├─ Clientes.tsx
│     ├─ Pautas.tsx
│     ├─ Cobros.tsx
│     └─ Informes.tsx       # /informes: ingresos, pagos por cliente/campaña + imprimir
├─ supabase/
│  └─ schema.sql            # tablas + RLS + seed (para pegar en SQL Editor)
├─ .env.example
├─ tailwind.config.js
├─ vite.config.ts
├─ vitest.config.ts
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

> **Supabase SQL Editor:** el aviso *"This query includes destructive operations"* es **esperado
> y seguro** de ignorar. El schema usa `drop ... if exists` + `create or replace`
> (idempotente) y **no borra tablas ni datos**. Los únicos `delete from` viven dentro de
> `seed_demo_data()` (RPC) y solo corren si alguien invoca esa función.

### Despliegue en Vercel (regla permanente de git)
- Vercel mapea el **autor del commit** (`git user.name` + `git user.email`) contra la cuenta de
  Vercel. Si el email no está vinculado, el deploy igual ocurre pero aparece
  **"Usuario de Vercel no encontrado"** y puede no auto-redeployar.
- **Siempre commitear con esta identidad en este repo:**
  ```sh
  git config user.name  "Programa MarcosMartin"
  git config user.email "martinmarcospablo@gmail.com"
  ```
- ⚠️ **No usar** el email anónimo de GitHub (`marcosm@users.noreply.github.com`): Vercel no lo
  puede asociar a ninguna cuenta.
- **Si ya se commitó con un email no vinculado:** arreglar con un commit **nuevo** (no `--amend`):
  ```sh
  git config user.name  "Programa MarcosMartin"
  git config user.email "martinmarcospablo@gmail.com"
  git commit --allow-empty -m "redeploy: autor vinculado a Vercel"
  git push
  ```
- **Forzar redeploy sin tocar código:** (a) Dashboard Vercel → **Deployments** → "⋯" → **Redeploy**;
  (b) commit vacío + push (si el GitHub integration tiene auto-deploy); o
  (c) `vercel --prod` (CLI v56+, requiere `vercel login` y proyecto linkeado).
- Cuando no se aplica un cambio de código que la UI ya contempla (p. ej. campo que "no aparece"),
  primero descartar **build viejo**: reiniciar `npm run dev` o verificar que Vercel redeployó.

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
- [ ] Commitear y pushear el estado actual (fix TS6133 ya corregido) y verificar el deploy en Vercel.
- [ ] Borrar `public/LogoMPMLabs.png` (reemplazado por `LogoMPMLabs (2).png`).
- [ ] Tests de los componentes/páginas: `Clientes`, `Pautas`, `Cobros`, `Dashboard` con
      MSW + `@testing-library/user-event`.
- [ ] Tests E2E con Playwright (flujos completos: alta cliente → pauta → cobro → WhatsApp).
- [ ] Tests de `generarDatosDemo` (integración contra un Supabase local o MSW).
- [ ] Conectar a un backend real ya provisto por el usuario (si cambia de Supabase).
- [ ] (Opcional) Número de emisor/configurable en WhatsApp (hoy usa el teléfono del cliente).
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

**FASE 2 — Estados de cobro coherentes (completada) — 2026-09-01**
- **Regla de negocio:** la pauta es un plan **mensual recurrente** que **nunca se finaliza**.
  Se cobra del 1 al 10 de cada mes; desde el día 11 queda vencida hasta que se pague el mes.
- **Modelo de estado elegido por el usuario — "vencimiento acumulativo":** cada mes desde
  `fecha_inicio` genera un vencimiento propio; si un mes pasado quedó sin cobro aprobado, la
  pauta queda **vencida** (aunque el mes actual esté pago o esté en los primeros 10 días).
- **Nuevos helpers en `src/lib/utils.ts`:**
  - `mesesEntre(desde, hasta)` (privado) y `mesesImpagos(pauta, cobros)` → cantidad de meses
    vencidos sin pago aprobado.
  - `montoAdeudado(pauta, cobros)` → `mesesImpagos × monto_total`.
  - `diasDeAtraso(pauta, cobros)` → días desde el día 10 del mes impago más reciente.
  - `estadoPautaMensual(pauta, cobros)` → `al_dia | pendiente | vencida` (acumulativo).
  - `estadoCobroEfectivo(cobro)` → estado real del cobro (acepta `fecha_vencimiento`).
  - `hoyISO()` → fecha local (no UTC) para comparaciones.
- Aplicado en `Dashboard.tsx`, `Pautas.tsx`, `Cobros.tsx`.
  - `Pautas.tsx`: columna **Total** muestra deuda acumulada en rojo con desglose
    (`$50.000 × N meses`) cuando hay meses impagos.
  - `Dashboard.tsx`: KPI **Vencidos** suma `montoAdeudado` de pautas vencidas; semáforo
    rediseñado a nivel de **pauta** (`SemaforoCobros`), vencidas primero, con días de atraso,
    monto adeudado y botón WhatsApp (label "Cobrar"/"Recordar").
  - Mensaje de WhatsApp por pauta mensual (`MensajePautaMensual`) con monto acumulado y atraso.

**FASE 3 — Informes + impresión (completada) — 2026-09-01**
- Nueva página **`/informes`** (`src/pages/Informes.tsx`) con tres tipos de informe:
  - **Ingresos** (mensual / anual / por intervalo con fechas).
  - **Pagos por cliente** (acumulado aprobado).
  - **Pagos por campaña** (acumulado aprobado).
- Lógica pura en `src/lib/reportes.ts`: `filtrarPorRango`, `ingresosPorPeriodo`,
  `pagosPorCliente`, `pagosPorCampana`, `totalIngresos` (solo cobros aprobados → ingresos reales).
- **Impresión / PDF:** botón "Imprimir / PDF" (`window.print()`), encabezado solo-impresión con
  nombre de la radio + fecha de generación + tipo + descripción de periodo, y CSS `@media print`
  en `src/index.css` (oculta header/sidebar/nav, quita `lg:pl-64`, máxima anchura 100%).
- Ruta agregada en `App.tsx` e ítem **Informes** en el `Sidebar`.

**FASE 4 — Branding de la empresa (completada) — 2026-09-01**
- Logo de **MPM Labs** (software) en el sidebar, debajo de "102.3 FM · Argentina", **centrado**
  y más grande (`h-10`), con línea separadora sutil.
- Imagen `public/LogoMPMLabs%20(2).png` (referida URL-encoded). El archivo viejo
  `public/LogoMPMLabs.png` quedó sin uso (borrar).
- Texto "© 2026 MPM Labs · Todos los derechos reservados" centrado, con **"MPM Labs" enlazado**
  a `https://www.mpmlabs.com.ar` (nueva pestaña, subrayado al pasar el mouse).
- Test `AppShell.test.tsx` (logo, copyright y "102.3 FM · Argentina").

**Verificación (2026-09-01):** suite **95/95 tests en 10 archivos** · `npm run build` OK ·
`npm run lint` 0 errores (1 warning fast-refresh).
- Fix deploy Vercel: `TS6133 'content' is declared but its value is never read` en
  `AppShell.test.tsx` (el parámetro del matcher de `getByText` se reemplazó por `_content`).
  Ojo: `tsc -b` compila los `.test.tsx`, así que los tests deben pasar typecheck.

**FASE 5 — Recibos autoincremental + PDF no fiscal (completada) — 2026-09-04**
- **Numeración de recibos automática tipo talonario:** formato `006-0000100`
  (punto de venta `006` + correlativo de 7 dígitos). El primer recibo es `006-0000100`
  y después `006-0000101`, etc. El operador ya **no carga el n° de recibo** (se quitó
  el campo del alta de cobro).
- **Implementación en DB (Supabase):** `supabase/schema.sql`:
  - Secuencia global `public.recibo_nro_seq` que arranca en `100`.
  - Trigger `cobros_asignar_nro_recibo` (`before insert or update of estado`) que
    asigna `'006-' || lpad(nextval(...),7,'0')` **solo cuando el cobro queda
    "aprobado"** y `nro_recibo` es null → un cobro pendiente nunca consume número.
  - Índice único parcial `uq_cobros_nro_recibo` (evita recibos duplicados).
  - ⚠️ **Acción requerida:** pegar `supabase/schema.sql` en el SQL Editor (es
    idempotente). Los cobros ya aprobados sin número conservan null hasta que se
    re-aprueban o se crean nuevos.
- **Recibo No Fiscal en PDF** (`src/lib/recibo.ts`, con `pdf-lib`):
  - `generarPDFReciboNoFiscal(datos)` → bytes PDF A4 con encabezado azul de la radio,
    n° de recibo, fecha, cliente/CUIT/teléfono, detalle del pago (concepto + período +
    método), total, leyenda "Documento no fiscal" y firma.
  - `datosReciboDeCobro(cobro)` mapea el cobro; `periodoDe`; `nombreArchivoRecibo`
    (nombre seguro); `descargarPDF`; `compartirODescargarRecibo` → en móviles usa la
    Web Share API (permite adjuntar el PDF a WhatsApp); en desktop descarga el archivo.
  - `pdf-lib` se importa con **dynamic import** → queda en chunk separado y no infla
    el bundle inicial (vite build sin warning de chunk > 500 kB).
- **UI:** botón **"Recibo PDF"** en la tabla de Cobros (solo cobros aprobados con
  n° asignado); el resto mantiene "Recordar" (texto) + "Marcar aprobado". En el alta
  de cobro ahora se muestra el aviso de numeración automática. Se trae el `cuit` del
  cliente en `listarCobrosConPauta` (join + tipos `CobroConPauta`).
- **Tests:** `src/lib/recibo.test.ts` (9) + `src/components/ui/ReciboPDF.test.tsx` (3).
  Suite total **108/108 tests en 12 archivos** · `npm run lint` 0 errores · `npm run build` OK.
- **Nota WhatsApp:** `wa.me` solo envía texto; el PDF se envía por el share del sistema
  (WhatsApp Business API/Cloud API sería el único camino para adjuntarlo 100% automático).

**Post-FASE 5 — Despliegue Vercel: autor de commit (2026-09-04)**
- Problema: Vercel mostraba **"Usuario de Vercel no encontrado"** y no auto-redeployaba el último
  commit, porque los commits salían con el email anónimo de GitHub
  (`marcosm@users.noreply.github.com`), no vinculado a la cuenta de Vercel.
- Diagnóstico adicional: la app desplegada seguía mostrando el campo viejo "N° de recibo" y el
  botón "Recibo PDF" no aparecía → era un **build viejo** (Vercel sin redeploy + `schema.sql` sin
  correr en Supabase → los cobros no tenían `nro_recibo`).
- Fix: reconfigurar identidad y forzar redeploy con commit nuevo:
  `git config user.name "Programa MarcosMartin"` / `user.email "martinmarcospablo@gmail.com"` +
  `git commit --allow-empty -m "redeploy: commit con autor vinculado a Vercel"` + `git push`.
- Regla permanente documentada en §6 → **Despliegue en Vercel**.

### Notas de implementación
- El seed de datos de ejemplo se hace **desde el cliente** (inserts con RLS) en
  `src/lib/api.ts → generarDatosDemo(userId)`, porque la función RPC `security definer`
  `seed_demo_data` devolvía 400 con la nueva key `sb_publishable_`. La función RPC quedó
  en `schema.sql` como opcional/compatibilidad.
- La app usa la key pública `sb_publishable_...` (equivalente a la anon key). Stored.

> Nota: este archivo no es código de la app; es la config/plan para el agente.
> Al terminar cada bloque, actualizar la lista del punto 8.
