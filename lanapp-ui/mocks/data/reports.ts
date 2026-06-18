export type ReportType = "maltonas" | "prenadas" | "montas" | "famacha"

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
