# Lanapp — Application Context

> **Product:** Granja San Alfonso — sheep farm management (Riobamba, Ecuador)  
> **This file:** contract between **engineering (backend/infra)** and **v0 (all UI in `lanapp-ui`)**.

---

## 0. Division of labor

| Owner | Responsibility | Repo / artifact |
|-------|----------------|-----------------|
| **Engineering** | Postgres schema, `lanapp` API, `@sheep/domain` Zod, auth, reports logic, business rules, Terraform, Docker | `lanapp/`, `packages/domain`, `auth/`, `../../infra/webapp/tf` |
| **v0** | Every screen, component, layout, chart, form, modal, Spanish copy | **`lanapp-ui/`** only (monorepo root: `webapp/`) |
| **Integration** | `lib/api/*` client + wire pages to real API | engineering + v0 (see §2.7) |

**v0 must read:** §2 Infrastructure, §2.7 API client, §3 API contract (incl. §3.14 bulk), §4–§8 domain/enums, §15–§16 pesos/montas, **§19 v0 screen catalog**.

**v0 must not:** change backend, invent API shapes, or build AI/import Excel.

**Related docs**

| Document | Purpose |
|----------|---------|
| [`../sheep/docs/ARCHITECTURE_PLAN.md`](../sheep/docs/ARCHITECTURE_PLAN.md) | Category engine, use cases, long-term architecture |
| [`../sheep/README.md`](../sheep/README.md) | Monorepo dev commands |
| [`../../packages/domain/src/schemas/`](../../packages/domain/src/schemas/) | **Source of truth** for request/response field names |

**Quick jump**

| Section | Topic |
|---------|--------|
| [§2](#2-infrastructure--local-development) | Ports, env, Postgres, services |
| [§2.7](#27-ui-api-client-libapi) | Wired vs mock pages, `lib/api/*` |
| [§3](#3-api-contract-all-lanapp-endpoints) | Full REST catalog + envelope |
| [§3.14](#314-bulk-operations) | Bulk programar / montas / destete |
| [§15](#15-registro-de-pesos--guía-completa) | Pesos: backend rules + **v0 UI spec** |
| [§16](#16-registro-de-montas-y-reproducción--guía-completa) | Montas: backend rules + **v0 UI spec** |
| [§19](#19-v0-screen-catalog-complete) | Every route v0 must implement |

---

## 1. Monorepo map

```mermaid
flowchart TB
    subgraph ui [lanapp-ui]
        LanappUI[lanapp-ui :3000 Next.js]
        ApiClient[lib/api/* client]
    end
    subgraph backend [engineering]
        Lanapp[lanapp :4001 Express API]
        Auth[auth :4000]
        Domain["packages/domain"]
        PG[(Postgres :5434)]
    end
    subgraph deferred [deferred]
        SheepAI[sheep-ai :4002 Bedrock]
    end
    LanappUI --> ApiClient
    ApiClient -->|Next rewrite /api/v1/lanapp/*| Lanapp
    Lanapp --> Domain
    Lanapp --> PG
    Auth --> PG
```

| Package | Stack | Owner |
|---------|-------|-------|
| **`lanapp-ui`** | Next.js 16, Tailwind 4, shadcn, Heroicons | v0 screens + partial API wiring (`lib/api/*`) |
| **`lanapp`** | Express, TypeORM, Postgres | Engineering |
| **`@sheep/domain`** | Zod + enums | Engineering |
| **`@sheep/server`** | Response helpers, middleware | Engineering |
| **`auth`** | Express (Auth0 migration) | Engineering |
| **`sheep-ai`** | Bedrock agent + vision | Deferred |
| **`web-app`** | Retired Vite SPA | Archived in `../../webapp-backup/web-app` — do not use |

---

## 2. Infrastructure & local development

### 2.1 Service ports

| Service | Port | Health |
|---------|------|--------|
| `lanapp-ui` (v0) | **3000** | Browser |
| `auth` | **4000** | `GET /health` |
| `lanapp` | **4001** | `GET /api/v1/lanapp/health` |
| `sheep-ai` | **4002** | deferred |
| Postgres | **5434** | `webapp` database |

### 2.2 `lanapp` environment (`../lanapp/.env`)

| Variable | Example | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | `postgres://admin:adm1n*@localhost:5434/webapp` | TypeORM connection |
| `DATABASE_SCHEMA` | `lanapp` | Postgres schema name |
| `PORT` | `4001` | HTTP port |
| `API_PREFIX` | `/api/v1/lanapp` | Mount path for all routes |
| `SKIP_AUTH` | `true` (local only) | Bypass JWT; injects `dev-user` |
| `AUTH0_DOMAIN` | — | Production auth |
| `AUTH0_AUDIENCE` | `https://api.lanapp.sheep` | JWT validation |
| `AWS_REGION` | `us-east-1` | S3 presigned uploads |
| `AWS_S3_BUCKET` | `sheep-photos` | Health/sheep images (deferred UI) |
| `NODE_ENV` | `development` | |

### 2.3 Run backend locally

```bash
# From webapp/ monorepo root
npm install && npm run build:packages

# Postgres
cd lanapp && docker compose up -d

# API :4001 (SKIP_AUTH=true in ../lanapp/.env)
npm run dev:api

# Optional auth service:
cd auth && npm run dev      # :4000
```

### 2.4 Run UI (this repo)

```bash
# From webapp/ monorepo root (recommended — starts both)
npm run dev:ui              # :3000

# Or from this package:
cd lanapp-ui && npm run dev # :3000
```

Browser calls **`/api/v1/lanapp/*`** (same origin). Next.js rewrites proxy to `http://localhost:4001` — see `next.config.mjs` and `.env` (`NEXT_PUBLIC_API_PREFIX`, `LANAPP_SERVICE_URL`).

Local dev: `SKIP_AUTH=true` on API — no login token required.

### 2.7 UI API client (`lib/api/`)

HTTP helpers live in `lib/api/client.ts` (`apiFetch`, `lanapp.get/post/put/patch/delete`). All responses use the envelope in §3.1.

| Module | Functions | Backend routes |
|--------|-----------|----------------|
| `sheep.ts` | `fetchSheep`, `fetchSheepById`, CRUD | `/sheep` — filters: `gender`, `status`, `category`, `locationId` |
| `location.ts` | `fetchLocations`, CRUD | `/location` |
| `medicine.ts` | catalog CRUD, applications, `bulkScheduleMedicineApplications` | `/medicine`, `/medicine-application`, `/medicine-application/bulk/schedule` |
| `mating.ts` | `bulkRecordMatings` | `/mating/bulk` |
| `breeding-cycle.ts` | `bulkScheduleBreedingCycles` | `/breeding-cycle/bulk` |
| `weaning.ts` | `bulkRecordWeaning`, `fetchWeaningAlerts` | `/weaning-record/bulk`, `/weaning-record/alerts` |
| `types.ts` | `ApiSheep`, `BulkResult`, `SheepTarget`, etc. | — |

**Wiring status (pages → API)**

| Page / area | Status | Notes |
|-------------|--------|-------|
| `/sheep`, `/sheep/new`, `/sheep/[id]`, `/sheep/[id]/edit` | **Wired** | Real API |
| `/medicines` | **Wired** | Fármacos + Programadas + Historial |
| `/planner` | Mock | Use `bulkScheduleBreedingCycles` when wiring |
| `/weaning` | Mock | Use `bulkRecordWeaning` + `fetchWeaningAlerts` when wiring |
| `/locations`, `/dashboard`, `/reports/*` | Mock | `lib/mock-data.ts` |
| Sheep detail tabs (Pesos, Montas, FAMACHA) | Mock | Per-tab API clients TBD |

**v0 bulk UI pattern:** load sheep with `fetchSheep({ locationId, category, gender })` → multi-select → call bulk function → show `BulkResult.succeeded.length` / list `failed[]`.

**`lanapp-ui/.env`**

| Variable | Example | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_API_PREFIX` | `/api/v1` | Browser fetch prefix |
| `LANAPP_SERVICE_URL` | `http://localhost:4001` | Next rewrite target |
| `NEXT_PUBLIC_SKIP_AUTH` | `true` | UI hint — API auth bypass is `SKIP_AUTH` in `lanapp/.env` |

### 2.5 Production infra (engineering)

- Terraform: `../../infra/webapp/tf` — VPC, RDS, ALB, Cognito/Auth0 adapter, S3
- Details: `../sheep/docs/ARCHITECTURE_PLAN.md` §7–8
- **v0:** deploys to Vercel from `lanapp-ui` `main`; no backend changes on merge

### 2.6 CORS & methods

`lanapp` allows: `GET, POST, PUT, PATCH, DELETE, OPTIONS` — required for breeding-cycle diagnosis (`PATCH`).

---

## 3. API contract (all `lanapp` endpoints)

**Base URL (direct):** `http://localhost:4001/api/v1/lanapp`  
**Base URL (UI):** `/api/v1/lanapp` — proxied by Next.js to `LANAPP_SERVICE_URL`.

**Auth header (when `SKIP_AUTH=false`):** `Authorization: Bearer <JWT>`

**Local dev (`SKIP_AUTH=true`):** no token; server uses username `dev-user`.

### 3.1 Response envelope

All endpoints use `@sheep/server` helpers:

```json
{
  "success": true,
  "message": "Resource found successfully",
  "data": { },
  "error": null
}
```

| Helper | HTTP | `message` typical |
|--------|------|-------------------|
| `found` | 200 | Resource found |
| `foundPaginated` | 200 | includes `pagination: { page, limit, total, totalPages }` |
| `created` | 201 | Resource created successfully |
| `updated` | 200 | Resource updated successfully |
| `deleted` | 200 | Resource deleted successfully |
| `failed` | 4xx/5xx | `success: false`, `error` string |

Validation errors return Zod field messages in `error`.

### 3.2 Route index

Mounted under `{API_PREFIX}/`:

| Prefix | Entity |
|--------|--------|
| `/health` | Liveness |
| `/sheep` | Sheep CRUD + filters |
| `/location` | Locations |
| `/weight` | Weight history |
| `/health-check` | FAMACHA |
| `/mating` | Matings |
| `/pregnancy-check` | ECO + delivery |
| `/breeding-cycle` | Planner cycles |
| `/weaning-record` | Weaning + alerts |
| `/medicine` | Medicine catalog |
| `/medicine-application` | Scheduled doses |
| `/reports` | Dashboard + report JSON |
| `/sale-evaluation` | Batch sale rules (read/batch — defer UI) |
| `/upload` | S3 presigned (defer UI) |
| `/import` | Excel import (out of scope) |

### 3.3 Sheep

| Method | Path | Query / body |
|--------|------|----------------|
| GET | `/sheep` | `page`, `limit` OR filters: `gender`, `status`, `category`, `locationId` (combinable) |
| GET | `/sheep/quarantine` | — |
| GET | `/sheep/record-type/:type` | `RecordType` enum |
| GET | `/sheep/:id` | — |
| GET | `/sheep/:id/parents` | with mother/father |
| POST | `/sheep` | `SheepCreateSchema` — no client `id` |
| PUT | `/sheep/:id` | `SheepUpdateSchema` partial |
| DELETE | `/sheep/:id` | — |
| PATCH | `/sheep/:id/status` | status change |
| POST | `/sheep/check-quarantine` | batch job trigger |

**Create body (required fields):** `tag`, `breed`, `gender`, `birthDate`, `weight`, `recordType`  
**Optional:** `name`, `birthType`, `motherId`, `fatherId`, `currentLocationId`, `imageUrl`, `notes`  
**Server-only on entity:** `category`, `status`, `isPregnant`, `quarantineEndDate`, `matingCount`, etc.

### 3.4 Location

| Method | Path | Notes |
|--------|------|-------|
| GET | `/location` | `page`, `limit` → paginated |
| GET | `/location/:id` | includes sheep relation when loaded |
| POST | `/location` | `name`, `address` required; `latitude`, `longitude`, `description` optional |
| PUT | `/location/:id` | partial |
| DELETE | `/location/:id` | — |

### 3.5 Weight

| Method | Path | Notes |
|--------|------|-------|
| GET | `/weight/sheep/:sheepId` | History for charts + table |
| GET | `/weight/sheep/:sheepId/latest` | Previous for gain calc |
| POST | `/weight` | `sheepId`, `weight`, `measurementDate`; returns `dailyGain` |
| PUT | `/weight/:id` | partial; does **not** recalc `dailyGain` |
| DELETE | `/weight/:id` | — |

**`dailyGain`:** average g/day since previous pesaje — see §15.3.

### 3.6 Health check (FAMACHA)

| Method | Path | Notes |
|--------|------|-------|
| GET | `/health-check/sheep/:sheepId` | History |
| POST | `/health-check` | `sheepId`, `checkDate`, `famachaScore` 1–5 |
| PUT | `/health-check/:id` | partial |
| DELETE | `/health-check/:id` | — |

### 3.7 Mating

| Method | Path | Notes |
|--------|------|-------|
| GET | `/mating/sheep/:sheepId` | As male or female |
| POST | `/mating` | `maleId`, `femaleId`, `matingDate` → `status: Pending` |
| POST | `/mating/bulk` | Same ram + many ewes — see §3.14 |
| POST | `/mating/:id/effective` | — |
| POST | `/mating/:id/ineffective` | — |

Side-effect on create: female `lastMountedDate` updated.

### 3.8 Pregnancy check & delivery

| Method | Path | Body |
|--------|------|------|
| POST | `/pregnancy-check` | `matingId`, `checkDate`, `isPregnant`, `notes?` |
| GET | `/pregnancy-check/mating/:matingId` | history |
| POST | `/pregnancy-check/mating/:matingId/delivery` | `deliveryDate`, `notes?` |

If `isPregnant: true` → mating marked Effective, ewe `isPregnant=true`.

### 3.9 Breeding cycle (planner)

| Method | Path | Body / query |
|--------|------|----------------|
| GET | `/breeding-cycle` | `cycleName?` or paginated |
| GET | `/breeding-cycle/ewe/:eweId` | — |
| POST | `/breeding-cycle` | `eweId`, `cycleName`, `matingDate`; optional `ramId`, `vitaselApplied`, `notes` |
| POST | `/breeding-cycle/bulk` | Many ewes, one cycle — see §3.14 |
| PATCH | `/breeding-cycle/:id/diagnosis` | `diagnosisType`, `diagnosisDate`, `result?` |
| PUT | `/breeding-cycle/:id` | partial |
| POST | `/breeding-cycle/:id/cancel` | Logical cancel — sets `status: Cancelled` (preferred) |
| DELETE | `/breeding-cycle/:id` | Same as cancel — **not** hard delete |

**Cancel rules:** only before `diagnosisDate` or `actualBirthDate`. Cancelled rows hidden from lists; same ewe + `cycleName` can be re-scheduled. Matings have **no delete** — use `POST /mating/:id/ineffective` instead.

### 3.10 Weaning

| Method | Path | Notes |
|--------|------|-------|
| GET | `/weaning-record/alerts` | `minDays` default 75 — **CORDERO/CORDERA** without weaning record |
| GET | `/weaning-record/sheep/:sheepId` | history |
| POST | `/weaning-record` | `sheepId`, `weaningDate`, `weaningWeight` |
| POST | `/weaning-record/bulk` | Many lambs — see §3.14 |

Official weaning threshold: **70 days** (alerts use 75 default). Bulk destete updates sheep category (CORDERO → CORDERO DESTETADO, etc.).

### 3.11 Medicine & applications

| Method | Path | Notes |
|--------|------|-------|
| GET/POST | `/medicine` | Catalog (paginated list) |
| GET/PUT/DELETE | `/medicine/:id` | |
| GET | `/medicine-application` | Paginated applications |
| GET | `/medicine-application/pending` | `Scheduled` where `applicationDate <= today` |
| GET | `/medicine-application/sheep/:sheepId` | Per-sheep history |
| POST | `/medicine-application` | Single schedule — default `status: Scheduled` |
| POST | `/medicine-application/bulk/schedule` | Bulk programar — see §3.14 |
| PUT | `/medicine-application/:id` | Update status, dates, `notes` |
| DELETE | `/medicine-application/:id` | |

**Application status flow (UI tabs)**

| Status | Spanish UI | Tab |
|--------|------------|-----|
| `Scheduled` | Programado | **Programadas** |
| `Applied` | Aplicado | **Historial** |
| `Cancelled` | Cancelado | **Historial** |
| `Missed` | Omitido | **Historial** |

**Rules**

- **Programar** creates one `Scheduled` row per sheep per dose (not applied yet).
- **Aplicado** sets current row to `Applied`; optional **próxima dosis** creates a **new** `Scheduled` row (two API calls today: `PUT` + `POST`).
- Do not use `nextApplicationDate` on the schedule form — each dose is its own record.

### 3.14 Bulk operations

All bulk endpoints return `BulkResult`:

```json
{
  "succeeded": [{ "sheepId": "uuid", "recordId": "uuid" }],
  "failed": [{ "sheepId": "uuid", "error": "mensaje" }],
  "total": 10
}
```

Partial success is normal — each sheep is processed independently.

#### Bulk programar medicina

`POST /medicine-application/bulk/schedule`

```json
{
  "medicineId": "uuid",
  "applicationDate": "2026-06-15",
  "notes": "opcional",
  "sheepIds": ["uuid1", "uuid2"]
}
```

Or target by filter (potrero, categoría, etc.):

```json
{
  "medicineId": "uuid",
  "applicationDate": "2026-06-15",
  "filters": {
    "locationId": "uuid-potrero",
    "category": "CORDERA",
    "gender": "Female",
    "status": "Active"
  }
}
```

**UI client:** `bulkScheduleMedicineApplications()` in `lib/api/medicine.ts`

#### Bulk planificar montas (planner)

`POST /breeding-cycle/bulk` — one `breeding_cycle` row per ewe for a season.

```json
{
  "cycleName": "2026-A",
  "ramId": "uuid-carnero",
  "matingDate": "2026-04-01",
  "vitaselApplied": true,
  "notes": "opcional",
  "eweIds": ["uuid1", "uuid2"]
}
```

Skips ewes that already have that `cycleName`. Validates females only.

**UI client:** `bulkScheduleBreedingCycles()` in `lib/api/breeding-cycle.ts`

#### Bulk registrar montas (operacional)

`POST /mating/bulk` — one `mating` per ewe with the same ram.

```json
{
  "maleId": "uuid-carnero",
  "matingDate": "2026-04-01",
  "expectedBirthDate": "2026-09-01",
  "notes": "opcional",
  "femaleIds": ["uuid1", "uuid2"]
}
```

**UI client:** `bulkRecordMatings()` in `lib/api/mating.ts`

#### Bulk destete

`POST /weaning-record/bulk`

**Per-sheep weights:**

```json
{
  "weaningDate": "2026-06-12",
  "lotId": "Lote-3",
  "records": [
    { "sheepId": "uuid1", "weaningWeight": 18.5 },
    { "sheepId": "uuid2", "weaningWeight": 17.2 }
  ]
}
```

**Same weight for a group:**

```json
{
  "weaningDate": "2026-06-12",
  "defaultWeight": 18.0,
  "sheepIds": ["uuid1", "uuid2"]
}
```

**By filter:**

```json
{
  "weaningDate": "2026-06-12",
  "defaultWeight": 18.0,
  "filters": { "locationId": "uuid", "category": "CORDERO" }
}
```

Skips sheep that already have a weaning record.

**UI client:** `bulkRecordWeaning()`, `fetchWeaningAlerts()` in `lib/api/weaning.ts`

### 3.12 Reports (read-only for v0)

| Method | Path | `data` shape |
|--------|------|----------------|
| GET | `/reports/dashboard` | `{ totalSheep, pregnantCount, quarantineCount, healthAlertCount, generatedAt }` |
| GET | `/reports/maltonas` | `{ title, generatedAt, count, data: [...] }` |
| GET | `/reports/prenadas` | same pattern |
| GET | `/reports/montas` | `{ cycleName, breedingCycles, matings }` |
| GET | `/reports/famacha` | `{ alertCount, data }` — `threshold` query default 3 |

v0 uses **mock** report rows in `lib/mock-data.ts` → `reportConfig`; shape must match above for future API wiring.

### 3.13 Auth service (`auth` :4000) — defer v0 UI

| Method | Path |
|--------|------|
| POST | `/g/auth/login` |
| POST | `/g/auth/register` |
| POST | `/g/auth/logout` |
| POST | `/g/auth/refresh` |

v0 builds login/register screens with **mock submit** only.

---

## 4. Product summary

Lanapp replaces manual Excel/Word farm operations for **sheep inventory, health (FAMACHA), breeding, weight tracking, medicines, and reports**.

**Primary users:** farm operators, veterinarians, administrators (Spanish UI).

**Core workflows**

1. Register and track sheep (arete/ear tag, breed, category, location)
2. Record periodic pesajes and average daily gain between dates
3. FAMACHA health checks (score 1–5; lower = more anemic)
4. Breeding cycles, matings, pregnancy checks, delivery
5. Weaning alerts (default threshold ~70 days)
6. Medicine catalog + scheduled applications
7. Read-only reports: maltonas, preñadas, montas, FAMACHA

**Server-computed fields** (show read-only, never on create forms): `category`, `status`, `isPregnant`, `quarantineEndDate`, `dailyGain`.

---

## 5. Design system (v0 — `lanapp-ui` only)

### Visual language

| Token | Value |
|-------|-------|
| Brand | **Lanapp** + sheep mascot (`/sheep-mascot.png`) |
| Primary | `indigo-600` (buttons, active nav) |
| Page background | `gray-50` |
| Cards | `bg-white shadow rounded-lg p-6` |
| Headings | `text-2xl font-semibold text-gray-900` |
| Body secondary | `text-sm text-gray-500` |
| Font | Geist Sans (via `globals.css` / shadcn theme) |

### Shared components (v0 maintains under `components/`)

| Component | File | Purpose |
|-----------|------|---------|
| App shell | `dashboard-layout.tsx` | Sidebar + header + main |
| Auth shell | `auth-layout.tsx` | Login/register split layout |
| Sidebar | `sidebar-content.tsx` | Navigation — see §6 |
| Page header | `ui/page-header.tsx` | Title + description + actions |
| Data table | `ui/data-table.tsx` | List + row actions |
| Form fields | `ui/form-fields.tsx` | Inputs for modals/forms |
| Modal | `ui/modal.tsx` | Create/edit dialogs |
| Confirm | `ui/confirm-dialog.tsx` | Delete confirmations |
| Status badge | `ui/status-badge.tsx` | Enum colors per §9 |
| Stat card | `ui/stat-card.tsx` | Dashboard KPIs |
| Breadcrumb | `ui/breadcrumb.tsx` | Detail navigation |
| Empty state | `ui/empty-state.tsx` | No data |
| Report shell | `report-shell.tsx` | Reports layout |
| Sheep form | `sheep-form.tsx` | Create/edit — §8 |
| Sheep detail | `sheep-detail.tsx` | Tabs — §15, §16, FAMACHA |
| Weight chart | `ui/weight-progress-chart.tsx` | §15.3.1 |

### Mock data

All fixture data lives in **`lib/mock-data.ts`** — Ecuador farm names, Spanish labels, enum sets.

Badge color helpers: `statusColor`, `famachaColor` in the same file.

---

## 6. Navigation

Defined in `components/sidebar-content.tsx`.

### Primary

| Label | Route |
|-------|-------|
| Dashboard | `/dashboard` |
| Ovejas | `/sheep` |
| Ubicaciones | `/locations` |
| Planificador | `/planner` |
| Alertas destete | `/weaning` |
| Medicamentos | `/medicines` |

### Reportes ovejas

| Label | Route |
|-------|-------|
| Maltonas | `/reports/maltonas` |
| Preñadas | `/reports/prenadas` |
| Montas | `/reports/montas` |
| FAMACHA | `/reports/famacha` |

### Footer

| Label | Route |
|-------|-------|
| Usuarios | `/users` |
| Configuración | `/settings` |

### Auth (no sidebar)

| Route | Screen |
|-------|--------|
| `/login` | Login |
| `/register` | Registration |
| `/` | Redirect to dashboard or login |

**Not in nav (intentionally):** AI assistant, Excel import.

---

## 7. Screen inventory (current v0 baseline)

| Route | Page file | Status | Notes |
|-------|-----------|--------|-------|
| `/login` | `app/login/page.tsx` | Done | Sheep mascot auth layout |
| `/register` | `app/register/page.tsx` | Done | |
| `/dashboard` | `app/dashboard/page.tsx` | Done | 4 KPI cards + quick links |
| `/sheep` | `app/sheep/page.tsx` | **Wired** | Filters + table → `fetchSheep` |
| `/sheep/new` | `app/sheep/new/page.tsx` | **Wired** | Uses `SheepForm` |
| `/sheep/[id]` | `app/sheep/[id]/page.tsx` | **Wired** | Tabs: General (API), Pesos/Montas/FAMACHA mock |
| `/sheep/[id]/edit` | `app/sheep/[id]/edit/page.tsx` | **Wired** | |
| `/locations` | `app/locations/page.tsx` | Mock | List + create modal |
| `/locations/[id]` | `app/locations/[id]/page.tsx` | Mock | Detail + sheep list |
| `/planner` | `app/planner/page.tsx` | Mock | Cycle filter + modals — bulk API ready (§3.14) |
| `/weaning` | `app/weaning/page.tsx` | Mock | Alerts + register — bulk API ready (§3.14) |
| `/medicines` | `app/medicines/page.tsx` | **Wired** | Tabs: Fármacos + Programadas + Historial |
| `/reports/maltonas` | `app/reports/maltonas/page.tsx` | Done | Via `ReportShell` |
| `/reports/prenadas` | `app/reports/prenadas/page.tsx` | Done | |
| `/reports/montas` | `app/reports/montas/page.tsx` | Done | |
| `/reports/famacha` | `app/reports/famacha/page.tsx` | Done | |
| `/settings` | `app/settings/page.tsx` | Done | English labels OK |
| `/users` | `app/users/page.tsx` | Done | Read-only list |
| `*` | `app/not-found.tsx` | Done | |

### v0 gaps to close (see §19)

| Priority | Gap | Status |
|----------|-----|--------|
| P0 | **Bulk UI:** programar medicina / planner montas / destete (API ready — §3.14, `lib/api/*`) | Open |
| P0 | Sheep detail **Pesos** tab: chart + register/edit/delete (§15) | Done |
| P0 | Sheep detail **Montas** tab: register + ECO/parto modals (§16) | Done |
| P1 | Wire `/planner` and `/weaning` to real API + bulk actions | Open |
| P1 | FAMACHA tab: create form + score picker 1–5 | Done |
| P1 | Location create/edit modals or routes | Done |
| P1 | Medicines **Aplicaciones** tab: Programar aplicación modal (§19.7) | Done (backend-integrated on main) |
| P2 | Settings CRUD drawers (Razas) | Done |

---

## 8. Entity fields & forms

Field names below match **`@sheep/domain`** (API English keys). UI labels are Spanish.

### Sheep

| API field | UI label | Create | Edit | Notes |
|-----------|----------|--------|------|-------|
| `tag` | Arete | R | R | |
| `name` | Nombre | O | O | |
| `breed` | Raza | R | R | See breeds enum |
| `gender` | Sexo | R | R | Macho / Hembra |
| `birthDate` | Fecha nacimiento | R | R | |
| `weight` | Peso (kg) | R | R | |
| `recordType` | Tipo registro | R | R | |
| `currentLocationId` | Ubicación | O | O | Location dropdown |
| `notes` | Notas | O | O | |
| `category` | Categoría | — | read-only | Server computed |
| `status` | Estado | — | read-only | Server computed |

**Sub-records on detail**

| Entity | Fields | Actions |
|--------|--------|---------|
| Weight | `weight`, `measurementDate` | Create, edit, delete |
| Mating | `partnerId`, `matingDate` | Create; mark effective/ineffective; pregnancy check; delivery |
| FAMACHA | `checkDate`, `famachaScore` (1–5), `notes` | Create, edit, delete |
| Weaning | `weaningDate`, `weaningWeight` | Create from detail or alerts |

### Location

| API field | UI label | Create | Update |
|-----------|----------|--------|--------|
| `name` | Nombre | R | O |
| `address` | Dirección | R | O |
| `latitude` | Latitud | O | O |
| `longitude` | Longitud | O | O |
| `description` | Descripción | O | O |

### Medicine

| API field | UI label | Create | Update |
|-----------|----------|--------|--------|
| `type` | Tipo | R | O |
| `name` | Nombre | R | O |
| `dosage` | Dosis | R | O |
| `description` | Descripción | O | O |

### Medicine application

| API field | UI label | Create |
|-----------|----------|--------|
| `medicineId` | Medicamento | R |
| `sheepId` | Oveja | R (single) or `sheepIds` / `filters` (bulk) |
| `applicationDate` | Fecha programada | R |
| `status` | Estado | default `Scheduled` |
| `notes` | Notas | O |

Bulk schedule body adds `sheepIds[]` or `filters` — see §3.14.

### Breeding cycle

| API field | UI label | Create |
|-----------|----------|--------|
| `eweId` | ID oveja (hembra) | R |
| `cycleName` | Nombre ciclo | R |
| `matingDate` | Fecha monta | R |
| `ramId` | ID carnero | O |
| `vitaselApplied` | Vitasel aplicado | default false |
| `notes` | Notas | O |

**Diagnosis (PATCH):** `diagnosisType`, `diagnosisDate`, `result`

### Weaning record

| API field | UI label | Create |
|-----------|----------|--------|
| `sheepId` | Oveja | R |
| `weaningDate` | Fecha destete | R |
| `weaningWeight` | Peso destete (kg) | R |

---

## 9. Enums & Spanish labels

### Gender (`Gender`)

| API | UI |
|-----|-----|
| Male | Macho |
| Female | Hembra |

### Sheep status (`SheepStatus`)

| API | UI |
|-----|-----|
| Active | Activo |
| Inactive | Inactivo |
| Sold | Vendido |
| Deceased | Fallecido |
| Quarantine | Cuarentena |

### Record type (`RecordType`)

| API | UI |
|-----|-----|
| Born on Farm | Nacido en granja |
| Purchased | Comprado |
| Donated | Donado |
| Transferred | Transferido |

### Sheep category (`SheepCategory`)

Server uses Spanish enum values. Display labels in `lib/mock-data.ts` → `CATEGORIES`.

Examples: Cordero, Cordera destetada (maltona), Borrego, Oveja preñada, Oveja vacía, Cuarentena-related categories, etc.

### Mating status

| API | UI |
|-----|-----|
| Pending | Pendiente |
| Effective | Efectiva |
| Ineffective | Inefectiva |

### Medicine type

| API | UI |
|-----|-----|
| Vaccine | Vacuna |
| Antibiotic | Antibiótico |
| Vitamin | Vitamina |
| Dewormer | Desparasitante |
| Other | Otro |

### Medicine application status

| API | UI |
|-----|-----|
| Scheduled | Programado |
| Applied | Aplicado |
| Cancelled | Cancelado |
| Missed | Omitido |

### Breeding result

| API | UI |
|-----|-----|
| Pregnant | Preñada |
| Empty | Vacía |
| Recheck | Revisar |
| (pending) | Pendiente |

### FAMACHA score

Integer **1–5**. UI helper: *"1 = rojo oscuro (anémico), 5 = rosa/blanco (sano)"*.

- Score ≤ 2 → red badge / alert
- Score 3 → yellow
- Score ≥ 4 → green

### Breeds (`SheepBreed`)

Suffolk, Hampshire, Dorset, Katahdin, Dorper, Pelibuey, Santa Inés, Morada Nova, Blackbelly, Rambouillet, Merino, Corriedale, Texel, Criolla

---

## 10. Scope boundaries

### In scope (current CRUD phase)

- Full sheep, location, weight, health, medicine, breeding, weaning UI
- Dashboard + read-only reports
- Spanish labels on farm screens
- Manual data entry only

### Deferred (do not build in lanapp-ui unless asked)

- AI assistant chat
- FAMACHA photo upload + Bedrock vision
- S3 presigned upload UI
- Auth0 integration (local dev uses `SKIP_AUTH`)
- Users / settings admin (low priority; English OK)
- Sale-evaluation batch UI
- Category auto-transitions (nightly job)

### Out of scope (will not build)

- Excel import wizard
- Bulk upload UI

---

## 11. v0 workflow

**Monorepo:** `webapp/` on GitHub (single repo). **v0 edits only `lanapp-ui/`.**

**Legacy v0 project:** [prj_xGMDAzDXq3zG8TcIWiDx2HWiTC3x](https://v0.app/chat/projects/prj_xGMDAzDXq3zG8TcIWiDx2HWiTC3x) — reconnect to import **`webapp`** repo root (see `webapp/README.md`).

`@sheep/domain` lives at **`packages/domain/`** (npm workspace `"*"`). No vendored copy in `lanapp-ui/`.

**v0 preview vs local API**

| Environment | API |
|-------------|-----|
| **Cursor + `npm run dev:ui`** from `webapp/` | Real API via Next rewrite → `localhost:4001` |
| **v0 cloud preview** | Cannot use localhost — point `LANAPP_SERVICE_URL` at deployed API, or test data in Cursor |

**Every v0 prompt must include:**

```
Monorepo root: webapp/
Edit ONLY lanapp-ui/ — do not change lanapp/, packages/, auth/.
Read lanapp-ui/docs/APP_CONTEXT.md. Backend is fixed — do not change API shapes.
@sheep/domain is packages/domain (workspace dependency).
Use lib/api/* for wired pages (sheep, medicines) — NOT lib/mock-data.ts.
Spanish UI, indigo dashboard, shadcn, Heroicons.
Do not build: AI chat, Excel import, Auth0, photo upload.
```

**Component reuse:** extend `components/ui/*` and `components/dashboard-layout.tsx` — no one-off page styles.

**API field names:** when mocking, use same keys as §3 / `@sheep/domain` (`tag` not `arete` in API; UI may show "Arete" label for `tag`).

---

## 15. Registro de pesos — guía completa

### 15.1 Business context

| Use case | ID | When | Outcome |
|----------|-----|------|---------|
| Record periodic weigh-in | **UC-10** | Field worker weighs sheep (not daily) | History row + **ganancia promedio** (g/day between dates) |
| Weaning threshold | **UC-11** | Lamb ≥ **70 days** without weaning record | Alert → destete (separate flow, uses weaning weight) |
| Semiannual sale review | **UC-12** | Jan–Jun / Jul–Dec | Uses weight trends (reports phase) |

**Important distinction — two different “peso” concepts:**

| Concept | Where | Purpose |
|---------|-------|---------|
| **`sheep.weight`** | Sheep create/edit form | Snapshot “current weight” on the animal record at registration or manual edit |
| **`weight` table** | Sheep detail → Historial de peso | **Time series** — each weigh-in is its own row with date and computed gain |

Recording a weight history row does **not** automatically update `sheep.weight` on the server today. The detail page shows `selectedSheep.weight` from the sheep entity; history comes from `GET /weight/sheep/:id`.

**Farm practice — no daily weighing**

Granja San Alfonso does **not** pesar cada oveja cada día. Pesajes are **periodic** (e.g. weekly, at weaning, monthly review, before sale). A single day’s difference is not meaningful for growth.

What we store is **not** “gain since yesterday” but **average daily gain between the current weigh-in and the previous one**:

```
ganancia promedio (g/día) = (peso_actual − peso_anterior) / días_entre_fechas × 1000
```

Example: 26.0 kg on 2026-05-01 → 28.5 kg on 2026-06-01 (31 days) → **≈ 81 g/día** average over that month, not a literal daily measurement.

| Interval | Typical use |
|----------|----------------|
| 7–14 days | Lambs / close monitoring |
| 30+ days | Routine flock review |
| Ad hoc | Destete, venta, cuarentena |

If two pesajes fall on the **same day** (or previous is newer), `dailyGain` is omitted (`—`).

### 15.2 Data model

**Entity:** `lanapp.weight`  
**Schema:** `packages/domain/src/schemas/weight.ts`

| Field | Type | UI label | Create | Update | Notes |
|-------|------|----------|--------|--------|-------|
| `id` | UUID | — | server | — | |
| `sheepId` | UUID | Oveja | **R** | O | From route context on detail page |
| `weight` | number > 0 | Peso (kg) | **R** | O | Step 0.1 in UI |
| `measurementDate` | date | Fecha | **R** | O | ISO date string in API |
| `dailyGain` | number | Ganancia promedio (g/día) | — | — | **Server computed** on create — avg between this date and previous pesaje |
| `notes` | string | Notas | O | O | Not in current `web-app` UI |

### 15.3 Ganancia promedio (between two dates)

Implemented in `lanapp/src/utils/weight.utils.ts`, called from `WeightService.recordWeight`.

The API field is named `dailyGain` for historical reasons; semantically it is **average grams gained per day** over the interval since the **last** pesaje:

```
daysDiff = floor days between measurementDate and previousRecord.measurementDate
if daysDiff <= 0 → dailyGain = undefined   // same day or out-of-order
else dailyGain = ((currentWeight − previousWeight) / daysDiff) × 1000
```

| Case | `dailyGain` |
|------|-------------|
| First pesaje for sheep | `null` → UI `—` |
| Second pesaje 31 days later | Average g/day over those 31 days |
| Two pesajes same calendar day | `null` (no interval) |
| Pesaje antiguo con fecha anterior al anterior | `null` (`daysDiff <= 0`) |

- **Edit (PUT)** does not recalculate `dailyGain` today — only plain field update
- “Previous” = latest row by `measurementDate` for that sheep (`findLatestBySheep`)

**UI label (preferred):** `Ganancia promedio (g/día)` — optional helper: *“Promedio entre este pesaje y el anterior”*.

**Future option (not implemented):** hide gain when `daysDiff < 7` to avoid noisy short intervals; farm can still record the pesaje.

### 15.3.1 Gráfico de progreso (v0 must build)

**Component name:** `WeightProgressChart` in `components/ui/weight-progress-chart.tsx`

Place **above** the pesajes table on sheep detail tab **Pesos**. Pure SVG — **no chart npm library**.

| Feature | Behavior |
|---------|----------|
| Chart type | SVG line chart — no extra npm dependency |
| X axis | Fecha de cada pesaje (chronological) |
| Y axis | Peso (kg), auto-scaled with padding |
| Points | Dot + label per pesaje |
| Summary | **Variación** total (first → last kg) and **Período** (days) when ≥ 2 points |
| Empty | Placeholder message until first pesaje |

The chart visualizes **periodic weigh-ins over time**, not daily measurements — complements the **Ganancia prom.** column in the table.

### 15.4 API reference

Base path: `{API_PREFIX}/lanapp/weight`

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/sheep/:sheepId` | List all weights for sheep (used by UI) |
| GET | `/sheep/:sheepId/latest` | Latest single record |
| GET | `/:id` | One record |
| GET | `/` | Paginated all weights |
| POST | `/` | **Register weight** |
| PUT | `/:id` | Update weight / date |
| DELETE | `/:id` | Delete record |

**POST `/weight` — request body**

```json
{
  "sheepId": "f28a54f1-31f2-456b-8d0b-12a14eadef2e",
  "weight": 28.5,
  "measurementDate": "2026-06-01",
  "notes": "Pesaje mensual"
}
```

**POST — response (success)**

```json
{
  "success": true,
  "message": "Resource created successfully",
  "data": {
    "id": "…",
    "sheepId": "…",
    "weight": 28.5,
    "measurementDate": "2026-06-01T00:00:00.000Z",
    "dailyGain": 83.33,
    "notes": "Pesaje mensual",
    "createdAt": "…",
    "updatedAt": "…"
  }
}
```

**PUT `/:id` — partial body**

```json
{
  "weight": 29.0,
  "measurementDate": "2026-06-02"
}
```

### 15.5 API sequence (for future wiring — v0 uses mock state today)

```mermaid
sequenceDiagram
    participant U as Usuario
    participant UI as v0 SheepDetail
    participant API as lanapp /weight

    U->>UI: Tab Pesos
    UI->>API: GET /weight/sheep/:sheepId
    API-->>UI: Array sorted by measurementDate
    U->>UI: Registrar peso + fecha
    UI->>API: POST /weight
    API-->>UI: data.dailyGain computed
```

### 15.6 v0 UI specification — tab **Pesos** (`/sheep/[id]`)

**File:** `components/sheep-detail.tsx` (tab `peso`)

**Layout (top → bottom):**

1. **WeightProgressChart** (component spec §15.3.1)
2. **Inline register form** (card or row):
   | Control | `type` | Label | Validation |
   |---------|--------|-------|------------|
   | weight | `number` step 0.1 | Peso (kg) | required, > 0 |
   | date | `date` | Fecha del pesaje | default today |
   | submit | button primary | **Registrar peso** | disabled if empty |
3. **History table**
4. **Edit modal** — title "Editar peso"; same two fields; Guardar | Cancelar
5. **ConfirmDialog** delete — "¿Eliminar este registro de peso?"

**Table columns**

| Header | Mock field | API field |
|--------|------------|-----------|
| Fecha | `fecha` | `measurementDate` |
| Peso (kg) | `peso` | `weight` |
| Ganancia prom. (g/día) | `ganancia` | `dailyGain` or `—` |
| Acciones | Editar, Eliminar | — |

**Mock behavior (v0):** `useState` per sheep or append to local copy of `weightHistory`; recalc `ganancia` client-side using §15.3 formula when adding rows.

**Toasts (when wired):** "Peso registrado", "Peso actualizado", "Peso eliminado"

**v0 prompt (copy-paste):**

```
In components/sheep-detail.tsx tab "Pesos":
1) WeightProgressChart SVG line chart (fecha vs kg), title "Progreso de peso", subtitle "Evolución entre pesajes periódicos",
   summary Variación kg + Período días when 2+ points, indigo line, empty state if no data.
2) Form: Peso kg + Fecha + Registrar peso.
3) Table with Ganancia prom. (g/día) — average between consecutive pesajes NOT daily farm weighing.
4) Editar modal + Eliminar with confirm. Spanish. Mock useState. Match Lanapp indigo style.
Read docs/APP_CONTEXT.md §15.
```

### 15.7 Validation & edge cases

| Rule | Behavior |
|------|----------|
| `weight` must be > 0 | Zod + HTML `min` |
| `sheepId` required | Implicit from page `:id` |
| Future dates | Allowed by schema; farm may want UX warning (not implemented) |
| Duplicate same-day weigh-ins | Allowed; gain uses **latest** previous record, not same-day |
| Missing `dailyGain` | Show em dash `—` |

### 15.8 Related screens

| Screen | Relation |
|--------|----------|
| Sheep create form | Initial `weight` on animal only |
| Weaning alerts / destete | `weaningWeight` separate entity |
| Report maltonas | May show weight columns from report API |
| Dashboard KPI | Uses sheep counts, not weight table |

---

## 16. Registro de montas y reproducción — guía completa

### 16.1 Business context

| Use case | ID | When | Outcome |
|----------|-----|------|---------|
| Record mating | **UC-30** | Ewe in heat (~15-day cycle) | `mating` row, female `lastMountedDate` updated |
| Pregnancy diagnosis (ECO) | **UC-31** | ~30 days post-mating | Pregnant / Empty / Recheck |
| Re-mate empty ewe | **UC-32** | ECO empty | Vitasel + second ram (planner / manual) |
| Record delivery | **UC-33** | Birth | Ewe `isPregnant=false`, `deliveryDate` set |
| Breeding cycle planning | Planner | Season batch e.g. `2026-A` | `breeding_cycle` entity (separate from per-sheep mating list) |

**Two UI surfaces for breeding:**

| Surface | Route | Entity | Purpose |
|---------|-------|--------|---------|
| **Sheep detail → Montas** | `/sheep/:id` | `mating` + `pregnancy_check` | Operational: record monta for this animal, ECO, parto |
| **Planificador** | `/planner` | `breeding_cycle` | Cycle-wide list: ewe, ram, vitasel, diagnosis |

A monta on sheep detail creates a **`mating`** record. The planner tracks **`breeding_cycle`** rows (often same farm event, different API). See §16.8.

### 16.2 Data model — Mating

**Entity:** `lanapp.mating`  
**Schema:** `packages/domain/src/schemas/mating.ts`

| Field | Type | UI label | Create | Notes |
|-------|------|----------|--------|-------|
| `id` | UUID | — | server | |
| `maleId` | UUID | Carnero | **R** | Must be male sheep UUID |
| `femaleId` | UUID | Oveja | **R** | Must be female sheep UUID |
| `matingDate` | date | Fecha monta | **R** | |
| `expectedBirthDate` | date | Parto esperado | O | Optional on create; gestation ~150 d |
| `status` | `MatingStatus` | Estado | server | Default `Pending` |
| `notes` | string | Notas | O | Not in current detail UI |

**Status enum (`MatingStatus`)**

| API value | Spanish UI | Badge color |
|-----------|------------|-------------|
| `Pending` | Pendiente | yellow |
| `Effective` | Efectiva | green |
| `Ineffective` | Inefectiva | red |

**Server side-effects on create** (`MatingService.recordMating`):

- Sets `status = Pending`
- Updates **female** sheep: `lastMountedDate = matingDate`

### 16.3 Data model — Pregnancy check & delivery

**Schema:** `packages/domain/src/schemas/pregnancy-check.ts`

**Pregnancy check (ECO)**

| Field | Type | UI label | Required |
|-------|------|----------|----------|
| `matingId` | UUID | Monta | **R** |
| `checkDate` | date | Fecha chequeo | **R** |
| `isPregnant` | boolean | Preñada | **R** |
| `notes` | string | Notas | O |
| `nextCheckDate` | date | Próximo chequeo | O |

**Delivery**

| Field | Type | UI label | Required |
|-------|------|----------|----------|
| `deliveryDate` | date | Fecha parto | **R** |
| `notes` | string | Notas | O |

**Server side-effects**

| Action | Side effects |
|--------|----------------|
| `POST /pregnancy-check` with `isPregnant: true` | Marks mating **Effective**; female `isPregnant=true`, `pregnancyConfirmedAt=checkDate` |
| `POST /pregnancy-check/mating/:id/delivery` | Creates check with `isPregnant=false`; female `isPregnant=false`, `deliveryDate` set |

Category transitions (OVEJA PREÑADA, LACTANCIA, etc.) are planned in the category engine — not all are wired on every API call yet. See `ARCHITECTURE_PLAN.md` §5.

### 16.4 API reference — Mating

Base path: `{API_PREFIX}/lanapp/mating`

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/sheep/:sheepId` | All matings where sheep is male **or** female |
| GET | `/male/:maleId` | Matings for ram |
| GET | `/female/:femaleId` | Matings for ewe |
| GET | `/status/:status` | Filter by Pending / Effective / Ineffective |
| GET | `/:id` | Detail with relations |
| POST | `/` | **Record mating** |
| POST | `/:id/effective` | Mark effective (manual) |
| POST | `/:id/ineffective` | Mark ineffective |

**POST `/mating` — request body**

```json
{
  "maleId": "uuid-of-ram",
  "femaleId": "uuid-of-ewe",
  "matingDate": "2026-03-15",
  "notes": "Primera monta ciclo 2026-A"
}
```

**Deriving male/female from sheep detail UI**

Current `web-app` uses one **partner ID** field:

```typescript
const isFemale = selectedSheep.gender === 'Female'
maleId:  isFemale ? partnerId : currentSheepId
femaleId: isFemale ? currentSheepId : partnerId
```

**UX improvement for `lanapp-ui`:** searchable dropdown by **arete** (tag), not raw UUID text.

### 16.5 API reference — Pregnancy & delivery

Base path: `{API_PREFIX}/lanapp/pregnancy-check`

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/` | Record ECO / pregnancy check |
| GET | `/mating/:matingId` | Check history |
| GET | `/mating/:matingId/latest` | Latest check |
| POST | `/mating/:matingId/delivery` | **Record birth** |

**POST `/pregnancy-check` — ECO positive (simplified UI today)**

```json
{
  "matingId": "uuid-of-mating",
  "checkDate": "2026-04-15",
  "isPregnant": true,
  "notes": "ECO positivo"
}
```

**POST `/pregnancy-check` — ECO empty**

```json
{
  "matingId": "…",
  "checkDate": "2026-04-15",
  "isPregnant": false,
  "notes": "Vacía — aplicar Vitasel"
}
```

**POST `/pregnancy-check/mating/:matingId/delivery`**

```json
{
  "deliveryDate": "2026-08-20",
  "notes": "Parto simple, cordero sano"
}
```

### 16.6 v0 UI specification — tab **Montas** (`/sheep/[id]`)

**File:** `components/sheep-detail.tsx` (tab `montas`)

**Derive API payload from current sheep** (mock: use `sheep.sexo`):

| Current sheep | `femaleId` | `maleId` | Partner picker label |
|---------------|------------|----------|----------------------|
| Hembra | this sheep `id` | selected partner | **Seleccionar carnero** |
| Macho | selected partner | this sheep `id` | **Seleccionar oveja** |

**Do not use raw UUID text input** — use searchable `Combobox` from `sheepData` filtered by opposite sex; display `arete · nombre`.

**Register form (top of tab)**

| Field | Label | Required |
|-------|-------|----------|
| partner | Seleccionar carnero / oveja | yes |
| matingDate | Fecha monta | yes, default today |
| submit | **Registrar monta** | — |

**Table columns**

| Header | Mock | API |
|--------|------|-----|
| Fecha | `fecha` | `matingDate` |
| Pareja | `pareja` | resolved tag+name of partner |
| Estado | `estado` badge | `status` → Spanish |
| Acciones | see below | — |

**Row actions**

| Action | When | Mock effect |
|--------|------|-------------|
| Marcar efectiva | `Pendiente` | estado → Efectiva |
| Marcar inefectiva | `Pendiente` | estado → Inefectiva |
| **ECO** | always | open modal |
| **Registrar parto** | always | open modal |

**Modal — Chequeo de preñez (ECO)**

| Field | Type | Label |
|-------|------|-------|
| isPregnant | radio/toggle | Preñada / Vacía |
| checkDate | date | Fecha chequeo |
| notes | textarea | Notas |
| submit | | **Guardar chequeo** |

Maps to `POST /pregnancy-check` when wired.

**Modal — Registrar parto**

| Field | Type | Label |
|-------|------|-------|
| deliveryDate | date | Fecha parto |
| notes | textarea | Notas |
| submit | | **Guardar parto** |

Maps to `POST /pregnancy-check/mating/:id/delivery` when wired.

**v0 prompt (copy-paste):**

```
In components/sheep-detail.tsx tab "Montas": register form with searchable partner dropdown
(opposite sex from sheepData), fecha monta, Registrar monta. Table with StatusBadge for Pendiente/Efectiva/Inefectiva.
Actions: Marcar efectiva, Marcar inefectiva (if Pendiente), ECO modal (Preñada/Vacía, fecha, notas),
Registrar parto modal. Spanish. Mock useState. docs/APP_CONTEXT.md §16.
```

### 16.7 Full reproduction state machine (reference for copy)

From `ARCHITECTURE_PLAN.md` §9.8 — reference for UI copy and planner:

```mermaid
stateDiagram-v2
    [*] --> OVEJA_VACIA
    OVEJA_VACIA --> Mated: Registrar monta
    Mated --> EcoScheduled: ~30 días
    EcoScheduled --> OVEJA_PRENADA: ECO +
    EcoScheduled --> EmptyResult: ECO vacía
    EmptyResult --> VitaselApplied: Vitasel
    VitaselApplied --> Remated: Segunda monta
    OVEJA_PRENADA --> Lactancia: Parto
```

| Farm term | UI / system |
|-----------|-------------|
| Monta | `POST /mating` |
| ECO | `POST /pregnancy-check` |
| Vitasel | `breeding_cycle.vitaselApplied` or medicine application |
| Parto | `POST …/delivery` |
| Segunda monta | New mating after ineffective / empty |

### 16.8 Planificador vs detalle oveja

| | Sheep detail Montas | Planificador `/planner` |
|--|---------------------|-------------------------|
| API | `mating`, `pregnancy-check` | `breeding-cycle` |
| Create payload | `maleId`, `femaleId`, `matingDate` | `eweId`, `ramId`, `cycleName`, `matingDate`, `vitaselApplied` |
| Diagnosis | Via pregnancy-check on mating row | `PATCH /breeding-cycle/:id/diagnosis` |
| Best for | Day-to-day field entry from animal page | Season planning, cycle filter `2026-A` |

Both can coexist; linking them automatically is **not** implemented — operator may record twice if using both.

### 16.9 Validation & edge cases (backend + v0)

| Rule | Notes |
|------|-------|
| Partner picker | Filter opposite `gender` / `sexo` — API does not block same-sex |
| UUIDs | API requires valid sheep ids; v0 mock uses `sheepData[].id` |
| ECO vacía | Must support `isPregnant: false` for UC-32 (Vitasel / remate) |
| Parto without ECO | API allows; UI may show warning |
| Status labels | Always Spanish in UI — never show `Pending` raw |
| Gestación | ~150 days; optional `expectedBirthDate` on mating create |
| Planner cancel | `POST …/cancel` or DELETE — logical only; blocked after diagnosis/parto |
| Montas delete | **No delete** — Marcar inefectiva preserves audit trail |

### 16.11 Spanish copy reference

| Context | Strings |
|---------|---------|
| Section title | Historial de Peso / Montas |
| Register weight | Registrar / Peso registrado |
| Register mating | Registrar monta |
| Status | Pendiente, Efectiva, Inefectiva |
| ECO | Chequeo de preñez / ECO |
| Positive | Preñada |
| Negative | Vacía / No preñada |
| Delivery | Registrar parto / Fecha parto |
| Confirm delete weight | ¿Eliminar este registro de peso? |
| Partner placeholder (legacy) | ID pareja (macho/hembra) |
| Partner (preferred) | Seleccionar carnero / Seleccionar oveja |

### 16.12 Engineering file map (not v0)

| Layer | Pesos | Montas |
|-------|-------|--------|
| Domain | `packages/domain/src/schemas/weight.ts` | `mating.ts`, `pregnancy-check.ts` |
| Routes | `lanapp/src/routes/weight.ts` | `mating.ts`, `pregnancy-check.ts` |
| Services | `weight.service.ts`, `weight.utils.ts` | `mating.service.ts`, `pregnancy-check.service.ts` |
| v0 UI | `lanapp-ui/components/sheep-detail.tsx` | same tab file |
| Mock | `lanapp-ui/lib/mock-data.ts` | `weightHistory`, `matingHistory`, `sheepData` |

---

## 19. v0 screen catalog (complete)

**Stack:** Next.js App Router, `"use client"` on interactive pages, Tailwind 4, shadcn, Heroicons, Spanish, mock state.

### 19.1 Auth (no sidebar)

| Route | Components | v0 must build |
|-------|------------|---------------|
| `/login` | `auth-layout`, sheep mascot | Usuario, Contraseña, Recordarme, Iniciar sesión |
| `/register` | same | Usuario, Email, Contraseña, Confirmar, Crear cuenta |

### 19.2 Dashboard `/dashboard`

- 4 KPI cards → links: Total Ovejas, Preñadas, En Cuarentena, Alertas Salud
- Quick links: Inventario, Planificador, Medicamentos (no AI, no Excel)
- Mock: static numbers or from `reportConfig`-style object

### 19.3 Sheep

| Route | Spec |
|-------|------|
| `/sheep` | `PageHeader` + filters (sexo, estado, categoría, search arete) + `DataTable` + pagination + Agregar oveja |
| `/sheep/new` | `SheepForm` — fields §8 sheep create; no category/status inputs |
| `/sheep/[id]/edit` | same + read-only category/status badges |
| `/sheep/[id]` | `SheepDetail` header + tabs General, **Pesos §15.6**, **Montas §16.6**, FAMACHA |

**FAMACHA tab (v0):** form with date + score 1–5 (color buttons) + notas + Guardar; history table; highlight score ≤2 red, ≥4 green; **no photo/AI**.

### 19.4 Locations

| Route | Spec |
|-------|------|
| `/locations` | table + Agregar modal (nombre, dirección, lat, long, descripción) |
| `/locations/[id]` | detail + sheep mini-table + Editar/Eliminar |

### 19.5 Planner `/planner`

- Filter `cycleName` input (e.g. `2026-A`)
- Table: oveja, carnero, fecha monta, resultado, vitasel, acciones
- Modals: Nuevo ciclo (§3.9 fields), Diagnóstico (ECO/Control monta/FAMACHA, fecha, resultado)
- **Bulk (v0):** multi-select ewes (or filter by potrero) → `bulkScheduleBreedingCycles({ cycleName, ramId, matingDate, eweIds })` — show `BulkResult`
- Link to `/weaning`

### 19.6 Weaning `/weaning`

- Alert table: arete, nombre, edad días, peso — load via `fetchWeaningAlerts(minDays)`
- **Bulk destete (v0):** multi-select rows → drawer/modal with `weaningDate`, optional `lotId`, per-row or `defaultWeight` → `bulkRecordWeaning()`
- Single destete: `POST /weaning-record` or one item in `records[]`

### 19.7 Medicines `/medicines`

- Tabs: **Fármacos** | **Programadas** | **Historial**
- Fármacos: CRUD modals (wired)
- Programadas: filter “Todas programadas” / “Pendientes hoy”; **Aplicado** modal (fecha aplicada, notas, optional próxima dosis)
- **Bulk programar (v0):** select potrero / categoría / ovejas → medicamento + fecha → `bulkScheduleMedicineApplications()`
- Unified table columns: Medicamento | Oveja | Fecha | Estado | Notas | Acciones

### 19.8 Reports `/reports/*`

- `ReportShell`: title, generated meta, Exportar disabled, dynamic columns from mock `reportConfig`

### 19.9 Settings & users

- `/settings` — English OK; table + add drawer
- `/users` — read-only table

### 19.10 Shared components v0 must maintain

`dashboard-layout`, `sidebar-content`, `page-header`, `data-table`, `form-fields`, `modal`, `confirm-dialog`, `status-badge`, `empty-state`, `breadcrumb`, `auth-layout`, `sheep-form`, `sheep-detail`, `report-shell`, **`weight-progress-chart`** (§15.3.1)

### 19.11 Master v0 prompt (full app refresh)

```
You are building Lanapp UI for Granja San Alfonso (Ecuador sheep farm).
READ docs/APP_CONTEXT.md completely — especially §2.7 lib/api, §3 API (§3.14 bulk), §15 pesos, §16 montas, §19 catalog.

Rules:
- Next.js App Router, Tailwind, shadcn, Heroicons, Spanish UI
- Use lib/api/* for wired pages; mock data only where §2.7 says Mock
- Monorepo webapp/ — edit lanapp-ui/ only; @sheep/domain is packages/domain
- Match @sheep/domain field names in API payloads
- Indigo-600 primary, gray-50 page bg, white cards
- Engineering owns backend; do NOT invent endpoints
- Do NOT build: AI assistant, Excel import, Auth0, S3 upload

Priority fixes:
1. Bulk UI: medicines programar, planner montas, weaning destete (§3.14)
2. SheepDetail tab Pesos: progress chart + register/edit/delete pesajes
3. SheepDetail tab Montas: partner combobox + ECO + parto modals
4. Wire /planner and /weaning to lib/api (replace mock-data)

Match existing lanapp-ui components; extend components/ui/*.
```

---

## 17. Definition of done (v0 prototype)

- [x] All primary nav screens exist
- [x] Sheep CRUD **wired** to API
- [x] Medicine catalog + Programadas + Historial **wired** to API
- [x] Sheep detail tabs (peso, montas, FAMACHA) — **tables mock**
- [ ] **Bulk UI:** programar medicina, planner montas, destete (API ready — §3.14)
- [x] **Pesos tab:** register form + edit/delete (see §15.6)
- [x] **Montas tab:** register form + ECO/parto modals + status actions (see §16.9)
- [x] Location list + detail (mock)
- [ ] Breeding planner + weaning alerts **wired** (mock today; API ready)
- [x] Four report types (mock)
- [x] Auth login/register (mock submit)
- [x] Dedicated FAMACHA create form with score picker
- [x] Weight progress chart on Pesos tab (§15.3.1)
- [x] Location edit modal
- [x] Settings CRUD drawers

---

## 18. Changelog

| Date | Change |
|------|--------|
| 2026-06-12 | Initial `APP_CONTEXT.md` — synced after `git pull` (sheep detail, forms, weaning, locations detail, planner/medicines refresh) |
| 2026-06-12 | Added §15 Registro de pesos and §16 Registro de montas — full business, API, flows, lanapp-ui targets, v0 prompts |
| 2026-06-12 | §15: clarified ganancia is **promedio entre dos fechas**, not daily weighing; UI labels updated |
| 2026-06-12 | §15.3.1: WeightProgressChart spec for v0 |
| 2026-06-12 | Restructured: §0 division of labor, §3 full API, §19 v0 catalog; backend/infra for engineering, UI for v0 only |
| 2026-06-12 | §2.7 `lib/api/*` wiring map; sheep + medicines wired; §3.11 medicine flow; §3.14 bulk endpoints; §19 bulk UI specs |
| 2026-06-13 | Single `webapp` monorepo — removed vendored `lanapp-ui/packages/domain`; v0 imports repo root |
| 2026-06-12 | Settings **Razas** CRUD with add/edit slide-over drawer + delete confirm (§19.9). Added shared `components/ui/drawer.tsx`. (Medicines "Programar aplicación" superseded by the API-wired schedule flow on main.) |
