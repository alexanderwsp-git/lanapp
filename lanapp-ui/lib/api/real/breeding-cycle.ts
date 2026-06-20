import { lanapp } from "../client"
import type { BulkResult } from "../types"
import type {
  ApiBreedingCycle,
  BreedingCycleCreatePayload,
  BreedingCycleUpdatePayload,
  BreedingDiagnosisPayload,
  BulkBreedingCycleSchedulePayload,
  BulkBreedingCycleConfirmPayload,
  ConfirmBreedingMatingPayload,
} from "../breeding-cycle"

type PaginatedBreedingCycles = {
  items: ApiBreedingCycle[]
  total: number
  page: number
  limit: number
  totalPages: number
}

type RawBreedingCycle = ApiBreedingCycle & { mating?: { matingDate?: string } | null }

function normalizeCycle(cycle: RawBreedingCycle): ApiBreedingCycle {
  const { mating, ...rest } = cycle
  return {
    ...rest,
    confirmedMatingDate:
      rest.confirmedMatingDate ??
      (mating?.matingDate ? String(mating.matingDate).slice(0, 10) : null),
  }
}

export async function fetchBreedingCyclesByEwe(eweId: string): Promise<ApiBreedingCycle[]> {
  const res = await lanapp.get<RawBreedingCycle[]>(`breeding-cycle/ewe/${eweId}`)
  return res.data.map(normalizeCycle)
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
  const rows = Array.isArray(data) ? data : (data.items ?? [])
  return (rows as RawBreedingCycle[]).map(normalizeCycle)
}

export async function confirmBreedingCycleMating(
  id: string,
  payload: ConfirmBreedingMatingPayload = {},
): Promise<ApiBreedingCycle> {
  const res = await lanapp.post<RawBreedingCycle>(`breeding-cycle/${id}/confirm-mating`, payload)
  return normalizeCycle(res.data)
}

export async function bulkConfirmBreedingCycles(
  payload: BulkBreedingCycleConfirmPayload,
): Promise<BulkResult> {
  const res = await lanapp.post<BulkResult>("breeding-cycle/bulk/confirm-mating", payload)
  return res.data
}

export async function createBreedingCycle(
  payload: BreedingCycleCreatePayload,
): Promise<ApiBreedingCycle> {
  const res = await lanapp.post<RawBreedingCycle>("breeding-cycle", payload)
  return normalizeCycle(res.data)
}

export async function updateBreedingCycle(
  id: string,
  payload: BreedingCycleUpdatePayload,
): Promise<ApiBreedingCycle> {
  const res = await lanapp.put<RawBreedingCycle>(`breeding-cycle/${id}`, payload)
  return normalizeCycle(res.data)
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
  const res = await lanapp.patch<RawBreedingCycle>(`breeding-cycle/${id}/diagnosis`, payload)
  return normalizeCycle(res.data)
}

export async function cancelBreedingCycle(id: string): Promise<ApiBreedingCycle> {
  const res = await lanapp.post<RawBreedingCycle>(`breeding-cycle/${id}/cancel`, {})
  return normalizeCycle(res.data)
}
