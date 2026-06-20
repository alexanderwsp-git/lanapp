# Lanapp — Validaciones y parámetros

> Tablas en **español** para usuarios y operadores. Cada sección incluye la **fuente técnica** en inglés (schemas Zod).

Documentos relacionados: [GUIA_USUARIO.md](./GUIA_USUARIO.md) · [ROLES.md](./ROLES.md) · [APP_CONTEXT.md](./APP_CONTEXT.md)

---

## 1. Parámetros de granja (reproducción)

Configurables en **Configuración → Reproducción**. Solo **admin** puede guardar en producción (`PUT /farm-parameters`).

| Campo | Tipo | Rango | Default | Descripción |
|-------|------|-------|---------|-------------|
| `gestationDays` | entero | 100–180 | **147** | Días de gestación; fecha estimada de parto |
| `ecoCheckMinDays` | entero | 1–90 | **30** | Días mínimos post-monta para ECO |
| `ecoCheckMaxDays` | entero | 1–120 | **45** | Días máximos recomendados para ECO |
| `heatCycleDays` | entero | 1–60 | **15** | Días sugeridos antes de remate tras Vacía |
| `weaningDays` | entero | 40–120 | **70** | Días para alertas de destete |

**Regla cruzada:** `ecoCheckMaxDays` debe ser ≥ `ecoCheckMinDays`.

> **Source:** `packages/domain/src/reproduction-parameters.ts` — `ReproductionParametersSchema`

---

## 2. Oveja

### 2.1 Alta de oveja (crear)

| Campo | Obligatorio | Validación | Notas |
|-------|:-----------:|------------|-------|
| `tag` (arete) | Sí | Texto, mín. 1 carácter | Identificador único en campo |
| `breed` (raza) | Sí | Enum (ver tabla abajo) | |
| `gender` (sexo) | Sí | `Male` / `Female` | |
| `birthDate` | Sí | Fecha válida | |
| `weight` | Sí | Número > 0 | Peso inicial (kg) |
| `recordType` | Sí | Enum (ver tabla abajo) | Origen del animal |
| `birthType` | No | `Single` / `Twin` | Default: `Single` |
| `name` | No | Texto | |
| `motherId` / `fatherId` | No | UUID | Referencia a otra oveja |
| `currentLocationId` | No | UUID | Ubicación actual |
| `imageUrl` | No | URL válida | |
| `notes` | No | Texto | |

**Calculado por el servidor (no enviar al crear):** `category`, `status`, `isPregnant`, fechas de cuarentena, etc.

### 2.2 Enums — raza (`breed`)

Suffolk, Hampshire, Dorset, Katahdin, Dorper, Pelibuey, Santa Inés, Morada Nova, Blackbelly, Rambouillet, Merino, Corriedale, Texel, Criolla.

### 2.3 Enums — tipo de registro (`recordType`)

| Valor | Significado |
|-------|-------------|
| `Born on Farm` | Nacida en la finca |
| `Purchased` | Comprada |
| `Donated` | Donada |
| `Transferred` | Transferida |

### 2.4 Enums — estado (`status`)

| Valor | UI (es) | Impacto |
|-------|---------|---------|
| `Active` | Activa | Operaciones permitidas |
| `Inactive` | Inactiva | Pesos/análisis/medicina bloqueados |
| `Sold` | Vendida | Bloqueado |
| `Deceased` | Fallecida | Bloqueado |
| `Quarantine` | Cuarentena | Bloqueado hasta fin de cuarentena |

> **Source:** `packages/domain/src/schemas/sheep.ts` — `SheepCreateSchema`, `SheepUpdateSchema`  
> **Enums:** `packages/domain/src/enums/sheep.ts`

---

## 3. Peso

| Campo | Obligatorio | Validación |
|-------|:-----------:|------------|
| `sheepId` | Sí | UUID |
| `weight` | Sí | Número > 0 (kg) |
| `measurementDate` | Sí | Fecha |
| `notes` | No | Texto |

**Servidor:** calcula `dailyGain` al crear si existe peso anterior.

> **Source:** `packages/domain/src/schemas/weight.ts` — `WeightCreateSchema`

---

## 4. Monta

| Campo | Obligatorio | Validación |
|-------|:-----------:|------------|
| `maleId` | Sí | UUID (carnero) |
| `femaleId` | Sí | UUID (oveja) |
| `matingDate` | Sí | Fecha (fecha real de monta) |
| `expectedBirthDate` | No | Fecha | Sugerida con `gestationDays` |
| `notes` | No | Texto |

### Operaciones masivas (montas)

| Campo | Validación |
|-------|------------|
| `femaleIds` | 1–500 UUIDs |
| `maleId`, `matingDate` | Obligatorios |

> **Source:** `packages/domain/src/schemas/mating.ts`, `packages/domain/src/schemas/bulk.ts` — `BulkMatingScheduleSchema`

---

## 5. ECO, diagnóstico y parto

### 5.1 Diagnóstico ECO (`PregnancyCheck`)

| Campo | Obligatorio | Validación |
|-------|:-----------:|------------|
| `matingId` | Sí | UUID |
| `checkDate` | Sí | Fecha |
| `isPregnant` | Sí | Booleano |
| `checkType` | No | Solo `ECO` (default) |
| `notes` | No | Texto |
| `nextCheckDate` | No | Fecha | Si resultado = Revisar |
| `vitaselApplied` | No | Booleano | Protocolo tras Vacía |

**Resultados de negocio (`BreedingResult`):** `Pregnant` (Preñada), `Empty` (Vacía), `Recheck` (Revisar).

### 5.2 Parto (`DeliveryRecord`)

| Campo | Obligatorio | Validación |
|-------|:-----------:|------------|
| `deliveryDate` | Sí | Fecha |
| `notes` | No | Texto |

### 5.3 Planificador (`BreedingCycle`)

| Campo | Obligatorio | Validación |
|-------|:-----------:|------------|
| `eweId` | Sí | UUID |
| `cycleName` | Sí | Texto, mín. 1 carácter |
| `matingDate` | Sí | Fecha planificada |
| `ramId` | No | UUID |
| `vitaselApplied` | No | Boolean (default false) |
| `notes` | No | Texto |

**Bulk planificador:** `eweIds` 1–500, `cycleName`, `ramId`, `matingDate` obligatorios.

> **Source:** `packages/domain/src/schemas/pregnancy-check.ts`, `breeding-cycle.ts`, `bulk.ts`

---

## 6. Análisis

### 6.1 Tipo de análisis (catálogo)

| Campo | Obligatorio | Validación |
|-------|:-----------:|------------|
| `type` | Sí | `FAMACHA`, `COPROLOGICAL`, `BODY_CONDITION`, `BLOOD`, `OTHER` |
| `name` | Sí | Mín. 1 carácter |
| `description` | No | Texto |
| `defaultUnit` | No | Texto |
| `recommendedMedicineType` | No | Enum medicina |

### 6.2 Registro de análisis

| Campo | Obligatorio | Validación |
|-------|:-----------:|------------|
| `analysisTypeId` | Sí | UUID |
| `sheepId` | Sí | UUID |
| `scheduledDate` | Sí | Fecha |
| `status` | No | `Scheduled`, `Completed`, `Cancelled`, `Missed` |
| `famachaScore` | No | Entero **1–5** | Solo FAMACHA |
| `resultValue` | No | Texto |
| `diagnosis` | No | Texto |
| `notes` | No | Texto |

**Escala FAMACHA:** 1 = sana · 5 = anemia grave.

### 6.3 Programación masiva

| Campo | Validación |
|-------|------------|
| `sheepIds` | 1–500 UUIDs **o** `filters` |
| `analysisTypeId`, `scheduledDate` | Obligatorios |

**Filtros bulk (`filters`):** `gender`, `status`, `category`, `locationId` (opcionales).

> **Source:** `packages/domain/src/schemas/analysis.ts`, `bulk.ts` — `BulkAnalysisScheduleSchema`

---

## 7. Medicina

### 7.1 Catálogo de medicamentos

| Campo | Obligatorio | Validación |
|-------|:-----------:|------------|
| `type` | Sí | `Vaccine`, `Antibiotic`, `Vitamin`, `Dewormer`, `Other` |
| `name` | Sí | Mín. 1 carácter |
| `dosage` | Sí | Mín. 1 carácter |
| `description` | No | Texto |
| `notes` | No | Texto |

### 7.2 Aplicación de medicamento

| Campo | Obligatorio | Validación |
|-------|:-----------:|------------|
| `medicineId` | Sí | UUID |
| `sheepId` | Sí | UUID |
| `applicationDate` | Sí | Fecha |
| `status` | No | Default `Scheduled` |
| `analysisId` | No | UUID | Vincular a análisis |
| `nextApplicationDate` | No | Fecha |
| `notes` | No | Texto |

**Estados:** `Scheduled` (programada), `Applied` (aplicada), `Cancelled`, `Missed`.

### 7.3 Programación masiva

| Campo | Validación |
|-------|------------|
| `sheepIds` | 1–500 **o** `filters` |
| `medicineId`, `applicationDate` | Obligatorios |

> **Source:** `packages/domain/src/schemas/medicine.ts`, `bulk.ts` — `BulkMedicineScheduleSchema`

---

## 8. Destete

| Campo | Obligatorio | Validación |
|-------|:-----------:|------------|
| `sheepId` | Sí | UUID |
| `weaningDate` | Sí | Fecha |
| `weaningWeight` | Sí | Número > 0 (kg) |
| `lotId` | No | Texto |
| `notes` | No | Texto |

### Destete masivo

Debe proporcionar **una** de estas opciones:

| Modo | Requisitos |
|------|------------|
| `records[]` | 1–500 filas con `sheepId` + `weaningWeight` cada una |
| `sheepIds` o `filters` | Requiere además `defaultWeight` > 0 |
| `weaningDate` | Siempre obligatorio |

> **Source:** `packages/domain/src/schemas/weaning-record.ts`, `bulk.ts` — `BulkWeaningSchema`

---

## 9. Ubicación

| Campo | Obligatorio | Validación |
|-------|:-----------:|------------|
| `name` | Sí | 1–50 caracteres, trim |
| `address` | Sí | 1–100 caracteres, trim |
| `latitude` | No | −90 a 90 |
| `longitude` | No | −180 a 180 |
| `description` | No | Máx. 500 caracteres |
| `imageUrl` | No | URL válida |

> **Source:** `packages/domain/src/schemas/location.ts` — `LocationCreateSchema`

---

## 10. Invitación de usuario (auth)

Validación en API Next.js (`POST /api/admin/users`):

| Campo | Obligatorio | Validación |
|-------|:-----------:|------------|
| `email` | Sí | Email válido, trim, lowercase |
| `role` | Sí | `admin` \| `veterinario` \| `operario` |
| `preferredUsername` | No | Texto |

Solo usuarios con rol **admin** pueden invitar.

> **Source:** `lanapp-ui/app/api/admin/users/route.ts`, `lanapp-ui/lib/auth/constants.ts`

---

## 11. Reglas de interfaz (no Zod)

Aplicadas en la UI antes de habilitar botones (`sheep-action-eligibility.ts`):

| Acción | Condición de bloqueo | Mensaje |
|--------|---------------------|---------|
| Registrar peso | `sheep.status !== Active` | "La oveja no está activa" |
| Programar análisis | `sheep.status !== Active` | "La oveja no está activa" |
| Programar medicina | `sheep.status !== Active` | "La oveja no está activa" |

Reglas adicionales de montas/ECO (ventanas de fecha, fase de monta) están documentadas en [MONTAS_LIFECYCLE.md](../../docs/MONTAS_LIFECYCLE.md) (`blockReason` por botón).

> **Source:** `lanapp-ui/lib/sheep-action-eligibility.ts`

---

## 12. Resumen de límites masivos

| Operación | Máx. ovejas por request | Identificador lista |
|-----------|-------------------------|---------------------|
| Programar análisis | 500 | `sheepIds` o `filters` |
| Programar medicina | 500 | `sheepIds` o `filters` |
| Planificar ciclo | 500 | `eweIds` |
| Confirmar montas bulk | 500 | `ids` |
| Registrar montas bulk | 500 | `femaleIds` |
| Destete bulk | 500 | `records` o `sheepIds` |

> **Source:** `packages/domain/src/schemas/bulk.ts`

---

## Índice de fuentes (developers)

| Entidad | Schema file |
|---------|-------------|
| Reproducción granja | `packages/domain/src/reproduction-parameters.ts` |
| Oveja | `packages/domain/src/schemas/sheep.ts` |
| Peso | `packages/domain/src/schemas/weight.ts` |
| Monta | `packages/domain/src/schemas/mating.ts` |
| ECO / parto | `packages/domain/src/schemas/pregnancy-check.ts` |
| Ciclo reproducción | `packages/domain/src/schemas/breeding-cycle.ts` |
| Análisis | `packages/domain/src/schemas/analysis.ts` |
| Medicina | `packages/domain/src/schemas/medicine.ts` |
| Destete | `packages/domain/src/schemas/weaning-record.ts` |
| Ubicación | `packages/domain/src/schemas/location.ts` |
| Bulk | `packages/domain/src/schemas/bulk.ts` |
