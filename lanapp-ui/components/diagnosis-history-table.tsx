import type { ApiPregnancyCheck } from "@/lib/api/pregnancy-check"
import { MatingActivityFeed, matingPhaseSummary } from "@/components/mating-timeline"

/** Activity feed of diagnosis + parto events. */
export function DiagnosisHistoryTable({
  checks,
  emptyMessage = "Sin eventos registrados.",
}: {
  checks: ApiPregnancyCheck[]
  emptyMessage?: string
}) {
  if (checks.length === 0) return <p className="text-sm text-gray-500">{emptyMessage}</p>
  return <MatingActivityFeed checks={checks} />
}

export function latestDiagnosisSummary(checks: ApiPregnancyCheck[]) {
  const s = matingPhaseSummary(checks)
  return { label: s.detail ? `${s.label} · ${s.detail}` : s.label, color: s.color }
}
