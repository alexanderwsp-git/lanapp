import { lanapp } from "../client"
import type { ReportConfig, ReportType } from "@/mocks/data/reports"

type ApiReportPayload = {
  title: string
  generatedAt?: string
  count?: number
  alertCount?: number
  data?: Record<string, string | number>[]
  breedingCycles?: unknown[]
  matings?: unknown[]
}

const reportColumns: Record<ReportType, { key: string; label: string }[]> = {
  maltonas: [
    { key: "arete", label: "Arete" },
    { key: "nombre", label: "Nombre" },
    { key: "sexo", label: "Sexo" },
    { key: "peso", label: "Peso (kg)" },
    { key: "edadDias", label: "Edad (días)" },
    { key: "ubicacion", label: "Ubicación" },
  ],
  prenadas: [
    { key: "arete", label: "Arete" },
    { key: "nombre", label: "Nombre" },
    { key: "fechaMonta", label: "Fecha monta" },
    { key: "fechaParto", label: "Parto estimado" },
    { key: "dias", label: "Días gestación" },
  ],
  montas: [
    { key: "oveja", label: "Oveja" },
    { key: "carnero", label: "Carnero" },
    { key: "fecha", label: "Fecha monta" },
    { key: "resultado", label: "Resultado" },
  ],
  reproductores: [
    { key: "carnero", label: "Reproductor" },
    { key: "hembras", label: "Hembras montadas" },
    { key: "montas", label: "Montas totales" },
    { key: "prenadas", label: "Preñadas" },
    { key: "tasa", label: "Tasa de preñez" },
    { key: "ultimaMonta", label: "Última monta" },
  ],
  madres: [
    { key: "madre", label: "Madre" },
    { key: "crias", label: "Crías" },
    { key: "partos", label: "Partos" },
    { key: "montas", label: "Montas totales" },
    { key: "tasa", label: "Tasa de preñez" },
    { key: "ultimoParto", label: "Último parto" },
  ],
  famacha: [
    { key: "arete", label: "Arete" },
    { key: "nombre", label: "Nombre" },
    { key: "ultimoPuntaje", label: "Último puntaje" },
    { key: "fechaChequeo", label: "Fecha chequeo" },
    { key: "alerta", label: "Alerta" },
  ],
}

function mapApiReport(reportType: ReportType, data: ApiReportPayload): ReportConfig {
  const rows = (data.data ?? []) as Record<string, string | number>[]
  return {
    title: data.title ?? reportColumns[reportType][0]?.label ?? reportType,
    total: data.count ?? data.alertCount ?? rows.length,
    columns: reportColumns[reportType],
    rows,
  }
}

export async function fetchReport(reportType: ReportType): Promise<ReportConfig> {
  const res = await lanapp.get<ApiReportPayload>(`reports/${reportType}`)
  return mapApiReport(reportType, res.data)
}
