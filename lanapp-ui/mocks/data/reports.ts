import { IDS } from "../ids"

export type ReportType =
  | "maltonas"
  | "prenadas"
  | "montas"
  | "famacha"
  | "reproductores"
  | "madres"

export type ReportConfig = {
  title: string
  total: number
  columns: { key: string; label: string }[]
  rows: Record<string, string | number>[]
}

export const seedReports: Record<ReportType, ReportConfig> = {
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
      { arete: "SA-103", nombre: "Luna", fechaMonta: "2026-03-15", fechaParto: "2026-08-09", dias: 86 },
      { arete: "SA-088", nombre: "Estrella", fechaMonta: "2026-03-16", fechaParto: "2026-08-10", dias: 85 },
      { arete: "SA-120", nombre: "Perla", fechaMonta: "2026-02-28", fechaParto: "2026-07-24", dias: 101 },
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
  reproductores: {
    title: "Cobertura por reproductor",
    total: 3,
    columns: [
      { key: "carnero", label: "Reproductor" },
      { key: "hembras", label: "Hembras montadas" },
      { key: "montas", label: "Montas totales" },
      { key: "prenadas", label: "Preñadas" },
      { key: "tasa", label: "Tasa de preñez" },
      { key: "ultimaMonta", label: "Última monta" },
    ],
    rows: [
      { id: IDS.sheep.toro, carnero: "SA-055 Toro", hembras: 5, montas: 8, prenadas: 4, tasa: "80%", ultimaMonta: "2026-03-16" },
      { id: IDS.sheep.negro, carnero: "SA-042 Negro", hembras: 3, montas: 4, prenadas: 1, tasa: "33%", ultimaMonta: "2026-02-28" },
      { carnero: "SA-091 Rayo", hembras: 2, montas: 2, prenadas: 1, tasa: "50%", ultimaMonta: "2026-01-20" },
    ],
  },
  madres: {
    title: "Maternidad por oveja",
    total: 4,
    columns: [
      { key: "madre", label: "Madre" },
      { key: "crias", label: "Crías" },
      { key: "partos", label: "Partos" },
      { key: "montas", label: "Montas totales" },
      { key: "tasa", label: "Tasa de preñez" },
      { key: "ultimoParto", label: "Último parto" },
    ],
    rows: [
      { id: IDS.sheep.luna, madre: "SA-103 Luna", crias: 6, partos: 4, montas: 5, tasa: "80%", ultimoParto: "2026-02-20" },
      { id: IDS.sheep.estrella, madre: "SA-088 Estrella", crias: 4, partos: 3, montas: 4, tasa: "75%", ultimoParto: "2025-12-10" },
      { id: IDS.sheep.blanca, madre: "SA-001 Blanca", crias: 2, partos: 2, montas: 3, tasa: "67%", ultimoParto: "2025-09-02" },
      { madre: "SA-120 Perla", crias: 1, partos: 1, montas: 2, tasa: "50%", ultimoParto: "2025-07-18" },
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
