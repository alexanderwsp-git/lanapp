import type { MatingCreate, MatingStatus } from "@sheep/domain"
import { lanapp } from "./client"
import type { ApiSheep, BulkResult } from "./types"

export type ApiMating = {
  id: string
  maleId: string
  femaleId: string
  matingDate: string
  expectedBirthDate?: string | null
  status: MatingStatus
  notes?: string | null
  male?: Pick<ApiSheep, "id" | "tag" | "name" | "birthDate"> | null
  female?: Pick<ApiSheep, "id" | "tag" | "name" | "birthDate"> | null
}

export type BulkMatingSchedulePayload = {
  maleId: string
  matingDate: string
  expectedBirthDate?: string
  notes?: string
  femaleIds: string[]
}

export type MatingCreatePayload = {
  maleId: string
  femaleId: string
  matingDate: string
  expectedBirthDate?: string
  notes?: string
}

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
