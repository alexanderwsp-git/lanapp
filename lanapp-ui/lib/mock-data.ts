// Mock data for Lanapp - Granja San Alfonso (Riobamba, Ecuador)

/* ----------------------------- Enum label sets ---------------------------- */

export const GENDERS = ["Macho", "Hembra"] as const
export const STATUSES = ["Activo", "Inactivo", "Vendido", "Fallecido", "Cuarentena"] as const
export const RECORD_TYPES = ["Nacido en granja", "Comprado", "Donado", "Transferido"] as const
export const CATEGORIES = [
  "Cordero",
  "Cordero destetado (maltón)",
  "Borrego",
  "Reproductor",
  "Faenado",
  "Cordera",
  "Cordera destetada (maltona)",
  "Borrega",
  "Borrega preñada",
  "Oveja preñada",
  "Oveja lactancia",
  "Oveja vacía",
  "Faenada",
  "Venta",
] as const
export const MATING_STATES = ["Pendiente", "Efectiva", "Inefectiva"] as const
export const MEDICINE_TYPES = ["Vacuna", "Antibiótico", "Vitamina", "Desparasitante", "Otro"] as const
export const MEDICINE_STATES = ["Programado", "Aplicado", "Cancelado", "Omitido"] as const
export const BREEDING_RESULTS = ["Pendiente", "Preñada", "Vacía", "Revisar"] as const
export const BREEDING_CYCLE_STATUSES = ["Activo", "Cancelado"] as const
export const DIAGNOSIS_TYPES = ["ECO", "Control monta", "FAMACHA"] as const
export const BREEDS = [
  "Suffolk",
  "Hampshire",
  "Dorset",
  "Katahdin",
  "Dorper",
  "Pelibuey",
  "Santa Inés",
  "Morada Nova",
  "Blackbelly",
  "Rambouillet",
  "Merino",
  "Corriedale",
  "Texel",
  "Criolla",
] as const

export type Gender = (typeof GENDERS)[number]
export type SheepStatus = (typeof STATUSES)[number]
export type RecordType = (typeof RECORD_TYPES)[number]
export type Category = (typeof CATEGORIES)[number]

/* --------------------------------- Sheep --------------------------------- */

export type Sheep = {
  id: string
  arete: string
  nombre: string
  sexo: Gender
  raza: string
  categoria: Category
  peso: number
  estado: SheepStatus
  nacimiento: string
  tipoRegistro: RecordType
  ubicacion: string
  notas: string
}

export const sheepData: Sheep[] = [
  { id: "SA-001", arete: "SA-001", nombre: "Blanca", sexo: "Hembra", raza: "Suffolk", categoria: "Cordera destetada (maltona)", peso: 28.5, estado: "Activo", nacimiento: "2026-01-15", tipoRegistro: "Nacido en granja", ubicacion: "G San Alfonso", notas: "" },
  { id: "SA-042", arete: "SA-042", nombre: "Negro", sexo: "Macho", raza: "Hampshire", categoria: "Borrego", peso: 45.2, estado: "Activo", nacimiento: "2025-08-03", tipoRegistro: "Nacido en granja", ubicacion: "Potrero Norte", notas: "" },
  { id: "SA-103", arete: "SA-103", nombre: "Luna", sexo: "Hembra", raza: "Dorset", categoria: "Oveja preñada", peso: 52.0, estado: "Activo", nacimiento: "2024-03-20", tipoRegistro: "Comprado", ubicacion: "G San Alfonso", notas: "Preñez confirmada por ECO." },
  { id: "SA-015", arete: "SA-015", nombre: "Manchas", sexo: "Hembra", raza: "Katahdin", categoria: "Cordera", peso: 18.3, estado: "Activo", nacimiento: "2026-03-12", tipoRegistro: "Nacido en granja", ubicacion: "Potrero Sur", notas: "" },
  { id: "SA-088", arete: "SA-088", nombre: "Estrella", sexo: "Hembra", raza: "Dorper", categoria: "Borrega", peso: 38.0, estado: "Activo", nacimiento: "2025-05-18", tipoRegistro: "Nacido en granja", ubicacion: "Potrero Norte", notas: "" },
  { id: "SA-022", arete: "SA-022", nombre: "Oreja", sexo: "Hembra", raza: "Pelibuey", categoria: "Cordera", peso: 16.1, estado: "Activo", nacimiento: "2026-03-28", tipoRegistro: "Nacido en granja", ubicacion: "Potrero Sur", notas: "" },
  { id: "SA-055", arete: "SA-055", nombre: "Toro", sexo: "Macho", raza: "Dorper", categoria: "Reproductor", peso: 68.0, estado: "Activo", nacimiento: "2023-02-10", tipoRegistro: "Comprado", ubicacion: "G San Alfonso", notas: "Reproductor principal." },
  { id: "SA-077", arete: "SA-077", nombre: "Rosa", sexo: "Hembra", raza: "Santa Inés", categoria: "Oveja vacía", peso: 31.0, estado: "Cuarentena", nacimiento: "2024-11-30", tipoRegistro: "Transferido", ubicacion: "Potrero Sur", notas: "En cuarentena por observación sanitaria." },
]

export function getSheep(id: string) {
  return sheepData.find((s) => s.id === id || s.arete === id)
}

/** "SA-103 Luna" style label for a sheep id; falls back to the raw id. */
export function sheepDisplay(id: string) {
  const s = getSheep(id)
  return s ? `${s.arete}${s.nombre ? ` ${s.nombre}` : ""}` : id
}

/* ------------------------------ Weight history ---------------------------- */

export type WeightRecord = { id: string; fecha: string; peso: number; ganancia: number | null }

/**
 * Ganancia promedio (g/día) entre este pesaje y el anterior. Ver §15.3.
 * daysDiff <= 0 -> null (mismo día o fuera de orden). Resultado redondeado.
 */
export function calcDailyGain(
  currentWeight: number,
  currentDate: string,
  previousWeight: number,
  previousDate: string,
): number | null {
  const ms = new Date(`${currentDate}T12:00:00`).getTime() - new Date(`${previousDate}T12:00:00`).getTime()
  const daysDiff = Math.floor(ms / (1000 * 60 * 60 * 24))
  if (daysDiff <= 0) return null
  return Math.round(((currentWeight - previousWeight) / daysDiff) * 1000)
}

export const weightHistory: WeightRecord[] = [
  { id: "w0", fecha: "2026-02-01", peso: 22.0, ganancia: null },
  { id: "w1", fecha: "2026-05-01", peso: 26.0, ganancia: 44 },
  { id: "w2", fecha: "2026-06-01", peso: 28.5, ganancia: 83 },
]

/* --------------------------------- Matings -------------------------------- */

export const GESTATION_DAYS = 150

/** Add N days to an ISO date string (YYYY-MM-DD) and return ISO. */
export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().split("T")[0]
}

/**
 * Mock mating row. Field names mirror the future API (maleId, femaleId, status…)
 * so engineering can wire endpoints later without renaming state.
 */
export type MatingRecord = {
  id: string
  maleId: string
  femaleId: string
  matingDate: string
  status: (typeof MATING_STATES)[number]
  notes?: string
  ecoSummary?: string
  partoDate?: string
  expectedBirthDate?: string
  nextCheckDate?: string
}

export const matingHistory: MatingRecord[] = [
  {
    id: "m1",
    maleId: "SA-055",
    femaleId: "SA-103",
    matingDate: "2026-03-15",
    status: "Efectiva",
    ecoSummary: "Preñada · 2026-04-14",
    expectedBirthDate: "2026-08-12",
    notes: "Preñez confirmada por ECO.",
  },
  {
    id: "m2",
    maleId: "SA-042",
    femaleId: "SA-001",
    matingDate: "2026-02-10",
    status: "Inefectiva",
    ecoSummary: "Vacía · 2026-03-12",
    notes: "Repetir con Vitasel.",
  },
  {
    id: "m3",
    maleId: "SA-055",
    femaleId: "SA-088",
    matingDate: "2026-03-16",
    status: "Pendiente",
  },
]

/* ------------------------------ Health / FAMACHA -------------------------- */

export type FamachaRecord = { id: string; fecha: string; puntaje: number; notas: string }

export const famachaHistory: FamachaRecord[] = [
  { id: "f1", fecha: "2026-06-01", puntaje: 2, notas: "Revisar desparasitación" },
  { id: "f2", fecha: "2026-05-01", puntaje: 4, notas: "Normal" },
  { id: "f3", fecha: "2026-04-01", puntaje: 5, notas: "" },
]

/* ------------------------------- Locations -------------------------------- */

export type Ubicacion = {
  id: string
  nombre: string
  direccion: string
  latitud: string
  longitud: string
  descripcion: string
}

export const ubicacionesData: Ubicacion[] = [
  { id: "loc-1", nombre: "G San Alfonso", direccion: "Riobamba", latitud: "-1.6646", longitud: "-78.6543", descripcion: "Potrero principal" },
  { id: "loc-2", nombre: "Potrero Norte", direccion: "Riobamba", latitud: "-1.6601", longitud: "-78.6512", descripcion: "Área norte" },
  { id: "loc-3", nombre: "Potrero Sur", direccion: "Riobamba", latitud: "-1.6702", longitud: "-78.6571", descripcion: "Área sur" },
]

export function getUbicacion(id: string) {
  return ubicacionesData.find((u) => u.id === id)
}

/* ------------------------------- Medicines -------------------------------- */

export type Medicamento = {
  id: string
  nombre: string
  tipo: (typeof MEDICINE_TYPES)[number]
  dosis: string
  descripcion: string
}

export const medicamentosData: Medicamento[] = [
  { id: "med-1", nombre: "Ivermectina", tipo: "Desparasitante", dosis: "1ml/50kg", descripcion: "Antiparasitario de amplio espectro." },
  { id: "med-2", nombre: "Complejo B", tipo: "Vitamina", dosis: "5ml", descripcion: "Suplemento vitamínico." },
  { id: "med-3", nombre: "Clostridial", tipo: "Vacuna", dosis: "2ml", descripcion: "Vacuna contra enfermedades clostridiales." },
]

export type MedicineApplication = {
  id: string
  medicamento: string
  oveja: string
  fecha: string
  estado: (typeof MEDICINE_STATES)[number]
}

export const applicationsData: MedicineApplication[] = [
  { id: "app-1", medicamento: "Ivermectina", oveja: "SA-001", fecha: "2026-06-10", estado: "Programado" },
  { id: "app-2", medicamento: "Complejo B", oveja: "SA-042", fecha: "2026-06-05", estado: "Aplicado" },
  { id: "app-3", medicamento: "Clostridial", oveja: "SA-103", fecha: "2026-05-28", estado: "Omitido" },
]

/* -------------------------------- Planner --------------------------------- */

export type BreedingRecord = {
  id: string
  eweId: string
  ramId?: string
  cycleName: string
  matingDate: string
  vitaselApplied: boolean
  result: (typeof BREEDING_RESULTS)[number]
  diagnosisType?: (typeof DIAGNOSIS_TYPES)[number]
  diagnosisDate?: string
  notes?: string
  /** Activo rows show in planner; Cancelado = logical delete (audit kept). */
  status: (typeof BREEDING_CYCLE_STATUSES)[number]
}

export const breedingData: BreedingRecord[] = [
  { id: "b-1", eweId: "SA-103", ramId: "SA-055", cycleName: "2026-A", matingDate: "2026-03-15", vitaselApplied: true, result: "Pendiente", status: "Activo" },
  { id: "b-2", eweId: "SA-088", ramId: "SA-055", cycleName: "2026-A", matingDate: "2026-03-16", vitaselApplied: false, result: "Preñada", diagnosisType: "ECO", diagnosisDate: "2026-04-15", status: "Activo" },
  { id: "b-3", eweId: "SA-001", ramId: "SA-042", cycleName: "2026-A", matingDate: "2026-02-10", vitaselApplied: true, result: "Vacía", diagnosisType: "ECO", diagnosisDate: "2026-03-12", status: "Activo" },
  { id: "b-4", eweId: "SA-077", ramId: "SA-055", cycleName: "2026-A", matingDate: "2026-02-28", vitaselApplied: false, result: "Revisar", diagnosisType: "Control monta", diagnosisDate: "2026-03-25", status: "Activo" },
  { id: "b-5", eweId: "SA-015", ramId: "SA-042", cycleName: "2026-B", matingDate: "2026-05-02", vitaselApplied: true, result: "Pendiente", status: "Activo" },
  { id: "b-6", eweId: "SA-022", cycleName: "2026-B", matingDate: "2026-05-03", vitaselApplied: false, result: "Pendiente", status: "Activo" },
]

/* ----------------------------- Weaning alerts ----------------------------- */

export type WeaningAlert = { id: string; arete: string; nombre: string; edadDias: number; peso: number }

export const weaningAlerts: WeaningAlert[] = [
  { id: "wa-1", arete: "SA-015", nombre: "Manchas", edadDias: 78, peso: 22.5 },
  { id: "wa-2", arete: "SA-022", nombre: "Oreja", edadDias: 82, peso: 24.1 },
  { id: "wa-3", arete: "SA-031", nombre: "Pelusa", edadDias: 75, peso: 21.8 },
]

/* --------------------------------- Reports -------------------------------- */

export type ReportType = "maltonas" | "prenadas" | "montas" | "famacha"

export const reportConfig: Record<
  ReportType,
  { title: string; total: number; columns: { key: string; label: string }[]; rows: Record<string, string | number>[] }
> = {
  maltonas: {
    title: "Reporte de Maltonas",
    total: 12,
    columns: [
      { key: "arete", label: "Arete" },
      { key: "nombre", label: "Nombre" },
      { key: "sexo", label: "Sexo" },
      { key: "peso", label: "Peso (kg)" },
      { key: "edadDias", label: "Edad (días)" },
      { key: "ubicacion", label: "Ubicación" },
    ],
    rows: [
      { arete: "SA-001", nombre: "Blanca", sexo: "Hembra", peso: 28.5, edadDias: 148, ubicacion: "G San Alfonso" },
      { arete: "SA-015", nombre: "Manchas", sexo: "Hembra", peso: 18.3, edadDias: 92, ubicacion: "Potrero Sur" },
      { arete: "SA-022", nombre: "Oreja", sexo: "Hembra", peso: 16.1, edadDias: 76, ubicacion: "Potrero Sur" },
      { arete: "SA-061", nombre: "Pinta", sexo: "Macho", peso: 30.2, edadDias: 160, ubicacion: "Potrero Norte" },
    ],
  },
  prenadas: {
    title: "Reporte de Preñadas",
    total: 23,
    columns: [
      { key: "arete", label: "Arete" },
      { key: "nombre", label: "Nombre" },
      { key: "fechaMonta", label: "Fecha monta" },
      { key: "fechaParto", label: "Parto estimado" },
      { key: "dias", label: "Días gestación" },
    ],
    rows: [
      { arete: "SA-103", nombre: "Luna", fechaMonta: "2026-03-15", fechaParto: "2026-08-12", dias: 86 },
      { arete: "SA-088", nombre: "Estrella", fechaMonta: "2026-03-16", fechaParto: "2026-08-13", dias: 85 },
      { arete: "SA-120", nombre: "Perla", fechaMonta: "2026-02-28", fechaParto: "2026-07-27", dias: 101 },
    ],
  },
  montas: {
    title: "Reporte de Montas",
    total: 18,
    columns: [
      { key: "oveja", label: "Oveja" },
      { key: "carnero", label: "Carnero" },
      { key: "fecha", label: "Fecha monta" },
      { key: "resultado", label: "Resultado" },
    ],
    rows: [
      { oveja: "SA-103 Luna", carnero: "SA-055 Toro", fecha: "2026-03-15", resultado: "Pendiente" },
      { oveja: "SA-088 Estrella", carnero: "SA-055 Toro", fecha: "2026-03-16", resultado: "Preñada" },
      { oveja: "SA-001 Blanca", carnero: "SA-042 Negro", fecha: "2026-02-10", resultado: "Vacía" },
    ],
  },
  famacha: {
    title: "Reporte FAMACHA",
    total: 15,
    columns: [
      { key: "arete", label: "Arete" },
      { key: "nombre", label: "Nombre" },
      { key: "ultimoPuntaje", label: "Último puntaje" },
      { key: "fechaChequeo", label: "Fecha chequeo" },
      { key: "alerta", label: "Alerta" },
    ],
    rows: [
      { arete: "SA-001", nombre: "Blanca", ultimoPuntaje: 2, fechaChequeo: "2026-06-01", alerta: "Desparasitar" },
      { arete: "SA-042", nombre: "Negro", ultimoPuntaje: 4, fechaChequeo: "2026-06-01", alerta: "Sin alerta" },
      { arete: "SA-103", nombre: "Luna", ultimoPuntaje: 5, fechaChequeo: "2026-06-01", alerta: "Sin alerta" },
    ],
  },
}

/* -------------------------------- Settings -------------------------------- */

export type Setting = { id: string; name: string; config: string; type: string; status: "Active" | "Inactive" }

export const settingsData: Setting[] = [
  { id: "set-1", name: "Gestation Period", config: "150 days", type: "Reproduction", status: "Active" },
  { id: "set-2", name: "Weaning Threshold", config: "70 days", type: "Weaning", status: "Active" },
  { id: "set-3", name: "FAMACHA Alert", config: "Score <= 2", type: "Health", status: "Active" },
  { id: "set-4", name: "Legacy Import", config: "CSV v1", type: "System", status: "Inactive" },
]

/* ---------------------------------- Users --------------------------------- */

export type User = { id: string; username: string; email: string; role: string }

export const usersData: User[] = [
  { id: "u-1", username: "alfonso.s", email: "alfonso@sanalfonso.ec", role: "Administrador" },
  { id: "u-2", username: "maria.t", email: "maria@sanalfonso.ec", role: "Veterinario" },
  { id: "u-3", username: "carlos.p", email: "carlos@sanalfonso.ec", role: "Operario" },
]

/* ------------------------------ Badge helpers ----------------------------- */

export type BadgeColor = "indigo" | "green" | "yellow" | "red" | "gray" | "blue" | "pink"

export const statusColor: Record<string, BadgeColor> = {
  Activo: "green",
  Inactivo: "gray",
  Vendido: "blue",
  Fallecido: "gray",
  Cuarentena: "yellow",
  Programado: "blue",
  Aplicado: "green",
  Cancelado: "gray",
  Omitido: "red",
  Pendiente: "yellow",
  Efectiva: "green",
  Inefectiva: "red",
  Preñada: "pink",
  Vacía: "gray",
  Revisar: "yellow",
  Active: "green",
  Inactive: "red",
}

export function famachaColor(score: number): BadgeColor {
  if (score <= 2) return "red"
  if (score === 3) return "yellow"
  return "green"
}
