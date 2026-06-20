import { AnalysisStatus, type ApiAnalysis } from "@/lib/analysis/types"
import { toDateInputValue } from "@/lib/format"

export function todayInput(): string {
  return new Date().toISOString().slice(0, 10)
}

export function isAnalysisDue(a: ApiAnalysis): boolean {
  return a.status === AnalysisStatus.SCHEDULED && toDateInputValue(a.scheduledDate) <= todayInput()
}
