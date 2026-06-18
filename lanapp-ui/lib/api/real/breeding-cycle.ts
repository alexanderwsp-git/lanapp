import { lanapp } from "../client"
import type { BulkResult } from "../types"
import type {
  ApiBreedingCycle,
  BreedingCycleCreatePayload,
  BreedingDiagnosisPayload,
  BulkBreedingCycleSchedulePayload,
} from "../breeding-cycle"

type PaginatedBreedingCycles = {
  items: ApiBreedingCycle[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export async function fetchBreedingCyclesByEwe(eweId: string): Promise<ApiBreedingCycle[]> {
  const res = await lanapp.get<ApiBreedingCycle[]>(`breeding-cycle/ewe/${eweId}`)
  return res.data
}

export async function fetchBreedingCycles(params?: {
  cycleName?: string
  page?: number
  limit?: number
}): Promise<ApiBreedingCycle[]> {
  const { cycleName, page = 1, limit = 500 } = params ?? {}
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (cycleName) qs.set("cycleName", cycleName)

  const res = await lanapp.get<ApiBreedingCycle[] | PaginatedBreedingCycles>(
    `breeding-cycle?${qs.toString()}`,
  )
  const data = res.data
  if (Array.isArray(data)) return data
  return data.items ?? []
}

export async function confirmBreedingCycleMating(id: string): Promise<ApiBreedingCycle> {
  const res = await lanapp.post<ApiBreedingCycle>(`breeding-cycle/${id}/confirm-mating`, {})
  return res.data
}

export async function createBreedingCycle(
  payload: BreedingCycleCreatePayload,
): Promise<ApiBreedingCycle> {
  const res = await lanapp.post<ApiBreedingCycle>("breeding-cycle", payload)
  return res.data
}

export async function bulkScheduleBreedingCycles(
  payload: BulkBreedingCycleSchedulePayload,
): Promise<BulkResult> {
  const res = await lanapp.post<BulkResult>("breeding-cycle/bulk", payload)
  return res.data
}

export async function recordBreedingDiagnosis(
  id: string,
  payload: BreedingDiagnosisPayload,
): Promise<ApiBreedingCycle> {
  const res = await lanapp.patch<ApiBreedingCycle>(`breeding-cycle/${id}/diagnosis`, payload)
  return res.data
}

export async function cancelBreedingCycle(id: string): Promise<ApiBreedingCycle> {
  const res = await lanapp.post<ApiBreedingCycle>(`breeding-cycle/${id}/cancel`, {})
  return res.data
}
