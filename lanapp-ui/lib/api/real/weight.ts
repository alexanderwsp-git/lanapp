import { lanapp, type FetchOptions } from "../client"
import type { ApiWeight, BulkWeightPayload, WeightCreatePayload, WeightUpdatePayload } from "../weight"
import type { BulkResult } from "../types"

export async function fetchWeightsBySheep(
  sheepId: string,
  options?: FetchOptions,
): Promise<ApiWeight[]> {
  const res = await lanapp.get<ApiWeight[]>(`weight/sheep/${sheepId}`, options)
  return res.data
}

export async function createWeight(payload: WeightCreatePayload): Promise<ApiWeight> {
  const res = await lanapp.post<ApiWeight>("weight", payload)
  return res.data
}

export async function updateWeight(id: string, payload: WeightUpdatePayload): Promise<ApiWeight> {
  const res = await lanapp.put<ApiWeight>(`weight/${id}`, payload)
  return res.data
}

export async function deleteWeight(id: string): Promise<void> {
  await lanapp.delete<null>(`weight/${id}`)
}

export async function bulkRecordWeights(payload: BulkWeightPayload): Promise<BulkResult> {
  const res = await lanapp.post<BulkResult>("weight/bulk", payload)
  return res.data
}
