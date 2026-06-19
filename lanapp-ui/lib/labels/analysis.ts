import { MedicineType } from "@sheep/domain"
import { AnalysisStatus, AnalysisKind, type ApiAnalysis } from "@/lib/analysis/types"
import type { BadgeColor } from "@/mocks/labels"

const typeLabels: Record<AnalysisKind, string> = {
  [AnalysisKind.FAMACHA]: "FAMACHA",
  [AnalysisKind.COPROLOGICAL]: "Coprológico",
  [AnalysisKind.BODY_CONDITION]: "Condición corporal",
  [AnalysisKind.BLOOD]: "Sangre",
  [AnalysisKind.OTHER]: "Otro",
}

const statusLabels: Record<AnalysisStatus, string> = {
  [AnalysisStatus.SCHEDULED]: "Programado",
  [AnalysisStatus.COMPLETED]: "Realizado",
  [AnalysisStatus.CANCELLED]: "Cancelado",
  [AnalysisStatus.MISSED]: "Omitido",
}

export function labelAnalysisType(type: AnalysisKind | string): string {
  return typeLabels[type as AnalysisKind] ?? String(type)
}

export function labelAnalysisStatus(status: AnalysisStatus | string): string {
  return statusLabels[status as AnalysisStatus] ?? String(status)
}

export const analysisTypeOptions = Object.values(AnalysisKind)
export const analysisStatusOptions = Object.values(AnalysisStatus)

export const analysisStatusColor: Record<string, BadgeColor> = {
  Programado: "blue",
  Realizado: "green",
  Cancelado: "gray",
  Omitido: "red",
  [AnalysisStatus.SCHEDULED]: "blue",
  [AnalysisStatus.COMPLETED]: "green",
  [AnalysisStatus.CANCELLED]: "gray",
  [AnalysisStatus.MISSED]: "red",
}

/**
 * Convención FAMACHA de la app: puntaje BAJO = anemia/alerta (desparasitar),
 * puntaje ALTO = sin alerta. (Se conserva la semántica existente.)
 */
export function famachaDiagnosis(score: number): string {
  if (score <= 2) return "Anemia — desparasitar"
  if (score === 3) return "Vigilar"
  return "Sin alerta"
}

export function famachaColor(score: number): BadgeColor {
  if (score <= 2) return "red"
  if (score === 3) return "yellow"
  return "green"
}

export type AnalysisRecommendation = {
  needsTreatment: boolean
  message: string
  /** MedicineType sugerido para prellenar la programación de medicina. */
  medicineType?: MedicineType
}

/**
 * Dado un resultado de análisis, indica si amerita tratamiento y qué sugerir.
 * - FAMACHA ≤ 2 → desparasitar.
 * - Coprológico con resultado "alto"/"positivo" → desparasitar.
 */
export function analysisRecommendation(record: ApiAnalysis): AnalysisRecommendation {
  const type = record.analysisType?.type
  if (type === AnalysisKind.FAMACHA && record.famachaScore != null) {
    if (record.famachaScore <= 2) {
      return {
        needsTreatment: true,
        message: "Puntaje FAMACHA bajo: se recomienda desparasitar a la oveja.",
        medicineType: MedicineType.DEWORMER,
      }
    }
    return { needsTreatment: false, message: "Sin alerta. No requiere tratamiento." }
  }

  if (type === AnalysisKind.COPROLOGICAL) {
    const v = (record.resultValue ?? "").toLowerCase()
    const high = /(alto|alta|positiv|elevad)/.test(v) || parseInt(v, 10) >= 500
    if (high) {
      return {
        needsTreatment: true,
        message: "Carga parasitaria alta: se recomienda desparasitar.",
        medicineType: MedicineType.DEWORMER,
      }
    }
    return { needsTreatment: false, message: "Carga parasitaria dentro de lo normal." }
  }

  const recommended = record.analysisType?.recommendedMedicineType
  if (recommended) {
    return {
      needsTreatment: true,
      message: "El resultado podría requerir tratamiento.",
      medicineType: recommended as MedicineType,
    }
  }
  return { needsTreatment: false, message: "Sin recomendación automática para este análisis." }
}
