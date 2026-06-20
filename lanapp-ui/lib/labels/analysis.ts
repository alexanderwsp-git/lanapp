import {
  analysisRecommendation as domainAnalysisRecommendation,
  type AnalysisRecommendation,
} from "@sheep/domain"
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

export type { AnalysisRecommendation }

/** @see @sheep/domain analysisRecommendation */
export function analysisRecommendation(record: ApiAnalysis): AnalysisRecommendation {
  return domainAnalysisRecommendation(record)
}
