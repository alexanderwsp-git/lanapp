import { lanapp } from "./client"
import type { BulkResult } from "./types"

export type BulkBreedingCycleSchedulePayload = {
  cycleName: string
  ramId?: string
  matingDate: string
  vitaselApplied?: boolean
  notes?: string
  eweIds: string[]
}

export async function bulkScheduleBreedingCycles(
  payload: BulkBreedingCycleSchedulePayload,
): Promise<BulkResult> {
  const res = await lanapp.post<BulkResult>("breeding-cycle/bulk", payload)
  return res.data
}

/** Logical cancel — row stays in DB with status Cancelled (not hard delete). */
export async function cancelBreedingCycle(id: string): Promise<void> {
  await lanapp.post(`breeding-cycle/${id}/cancel`, {})
}
