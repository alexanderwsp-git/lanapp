import { lanapp } from "./client"
import type { BulkResult } from "./types"

export type BulkMatingSchedulePayload = {
  maleId: string
  matingDate: string
  expectedBirthDate?: string
  notes?: string
  femaleIds: string[]
}

export async function bulkRecordMatings(
  payload: BulkMatingSchedulePayload,
): Promise<BulkResult> {
  const res = await lanapp.post<BulkResult>("mating/bulk", payload)
  return res.data
}
