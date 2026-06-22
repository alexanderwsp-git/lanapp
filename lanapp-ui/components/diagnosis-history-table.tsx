import type { ApiPregnancyCheck } from "@/lib/api/pregnancy-check"
import { MatingActivityFeed } from "@/components/mating-timeline"

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
