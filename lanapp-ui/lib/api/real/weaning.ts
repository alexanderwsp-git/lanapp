import { lanapp } from "../client"
import type { ApiSheep, BulkResult } from "../types"
import type {
  ApiRecentWeaningRecord,
  ApiWeaningRecord,
  BulkWeaningPayload,
  WeaningRecentQuery,
} from "../weaning"

export async function bulkRecordWeaning(payload: BulkWeaningPayload): Promise<BulkResult> {
  const res = await lanapp.post<BulkResult>("weaning-record/bulk", payload)
  return res.data
}

export async function fetchWeaningAlerts(minDays = 70): Promise<ApiSheep[]> {
  const res = await lanapp.get<ApiSheep[]>(`weaning-record/alerts?minDays=${minDays}`)
  return res.data
}

export async function fetchRecentWeanings(query: WeaningRecentQuery = {}): Promise<ApiRecentWeaningRecord[]> {
  const params = new URLSearchParams()
  if (query.fromDate) params.set("fromDate", query.fromDate)
  if (query.toDate) params.set("toDate", query.toDate)
  if (query.days != null) params.set("days", String(query.days))
  const qs = params.toString()
  const res = await lanapp.get<ApiRecentWeaningRecord[]>(`weaning-record/recent${qs ? `?${qs}` : ""}`)
  return res.data
}

export async function fetchWeaningRecordsBySheep(sheepId: string): Promise<ApiWeaningRecord[]> {
  const res = await lanapp.get<ApiWeaningRecord[]>(`weaning-record/sheep/${sheepId}`)
  return res.data
}
