import type { MatingCreate } from "@sheep/domain"
import { lanapp } from "../client"
import type { BulkResult } from "../types"
import type { ApiMating, BulkMatingSchedulePayload, MatingCreatePayload } from "../mating"

export async function fetchMatingsBySheep(sheepId: string): Promise<ApiMating[]> {
  const res = await lanapp.get<ApiMating[]>(`mating/sheep/${sheepId}`)
  return res.data
}

export async function createMating(payload: MatingCreatePayload): Promise<ApiMating> {
  const res = await lanapp.post<ApiMating>("mating", payload as unknown as MatingCreate)
  return res.data
}

export async function markMatingEffective(id: string): Promise<ApiMating> {
  const res = await lanapp.post<ApiMating>(`mating/${id}/effective`, {})
  return res.data
}

export async function markMatingIneffective(id: string): Promise<ApiMating> {
  const res = await lanapp.post<ApiMating>(`mating/${id}/ineffective`, {})
  return res.data
}

export async function bulkRecordMatings(payload: BulkMatingSchedulePayload): Promise<BulkResult> {
  const res = await lanapp.post<BulkResult>("mating/bulk", payload)
  return res.data
}
