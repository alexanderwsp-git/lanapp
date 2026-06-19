import { AnalysisStatus, type ApiAnalysis } from "@/lib/analysis/types"
import * as mock from "@/mocks/handlers/analysis"
import * as real from "./real/analysis"
import { resolveApi } from "./resolve"
import { toDateInputValue } from "../format"

const api = resolveApi(real, mock)

export const {
  fetchAnalysisTypes,
  createAnalysisType,
  updateAnalysisType,
  deleteAnalysisType,
  fetchAnalyses,
  fetchAnalysesBySheep,
  createAnalysis,
  updateAnalysis,
  deleteAnalysis,
  fetchPendingAnalyses,
  bulkScheduleAnalyses,
} = api

/** Marca un análisis como realizado, guardando resultado y diagnóstico. */
export async function markAnalysisCompleted(
  record: ApiAnalysis,
  opts: {
    completedDate?: string
    resultValue?: string | null
    famachaScore?: number | null
    diagnosis?: string | null
    notes?: string | null
  } = {},
): Promise<ApiAnalysis> {
  return api.updateAnalysis(record.id, {
    status: AnalysisStatus.COMPLETED,
    completedDate: opts.completedDate ?? toDateInputValue(record.scheduledDate),
    resultValue: opts.resultValue ?? record.resultValue,
    famachaScore: opts.famachaScore ?? record.famachaScore,
    diagnosis: opts.diagnosis ?? record.diagnosis,
    notes: opts.notes ?? record.notes,
  })
}
