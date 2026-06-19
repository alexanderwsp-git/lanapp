/**
 * Modelo de Análisis (capa de la app Next, sin tocar @sheep/domain).
 * Reemplaza al antiguo modelo health-check y soporta múltiples tipos de
 * análisis (FAMACHA, coprológico/parasitario, condición corporal, etc.).
 */

export const AnalysisType = {
  FAMACHA: "FAMACHA",
  COPROLOGICAL: "COPROLOGICAL",
  BODY_CONDITION: "BODY_CONDITION",
  BLOOD: "BLOOD",
  OTHER: "OTHER",
} as const
export type AnalysisType = (typeof AnalysisType)[keyof typeof AnalysisType]

export const AnalysisStatus = {
  SCHEDULED: "Scheduled",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  MISSED: "Missed",
} as const
export type AnalysisStatus = (typeof AnalysisStatus)[keyof typeof AnalysisStatus]

/** Catálogo de tipos de análisis configurables (como el catálogo de medicamentos). */
export type ApiAnalysisType = {
  id: string
  type: AnalysisType
  name: string
  description?: string | null
  /** Unidad del resultado, p. ej. "hpg" (huevos por gramo) o "1–5". */
  defaultUnit?: string | null
  /** Tipo de medicamento sugerido si el resultado amerita tratamiento (MedicineType). */
  recommendedMedicineType?: string | null
}

/** Registro de un análisis programado o realizado a una oveja. */
export type ApiAnalysis = {
  id: string
  analysisTypeId: string
  sheepId: string
  scheduledDate: string
  completedDate?: string | null
  status: AnalysisStatus
  /** Resultado libre (p. ej. "Alto", "320 hpg", "Negativo"). */
  resultValue?: string | null
  /** Puntaje FAMACHA 1–5 cuando el tipo es FAMACHA. */
  famachaScore?: number | null
  diagnosis?: string | null
  notes?: string | null
  analysisType?: ApiAnalysisType | null
  sheep?: { id: string; tag: string; name?: string | null } | null
}

export type AnalysisTypeCreate = {
  type: AnalysisType
  name: string
  description?: string | null
  defaultUnit?: string | null
  recommendedMedicineType?: string | null
}
export type AnalysisTypeUpdate = Partial<AnalysisTypeCreate>

export type AnalysisCreate = {
  analysisTypeId: string
  sheepId: string
  scheduledDate: string
  status?: AnalysisStatus
  resultValue?: string | null
  famachaScore?: number | null
  diagnosis?: string | null
  notes?: string | null
}

export type AnalysisUpdate = {
  scheduledDate?: string
  completedDate?: string | null
  status?: AnalysisStatus
  resultValue?: string | null
  famachaScore?: number | null
  diagnosis?: string | null
  notes?: string | null
}

export type BulkAnalysisSchedulePayload = {
  analysisTypeId: string
  scheduledDate: string
  notes?: string
  sheepIds?: string[]
  filters?: {
    gender?: string
    status?: string
    category?: string
    locationId?: string
  }
}
