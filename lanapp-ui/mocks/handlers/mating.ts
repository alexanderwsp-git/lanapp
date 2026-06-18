import { MatingStatus } from "@sheep/domain"
import type {
  ApiMating,
  BulkMatingSchedulePayload,
  MatingCreatePayload,
} from "@/lib/api/mating"
import type { BulkResult } from "@/lib/api/types"
import { enrichMating, findSheep, getMockStore, notFound } from "../store"
import { addDays, newId } from "../utils"

export async function fetchMatingsBySheep(sheepId: string): Promise<ApiMating[]> {
  const matings = getMockStore().matings.filter(
    (m) => m.maleId === sheepId || m.femaleId === sheepId,
  )
  return matings.map(enrichMating).sort((a, b) => b.matingDate.localeCompare(a.matingDate))
}

export async function createMating(payload: MatingCreatePayload): Promise<ApiMating> {
  const mating: ApiMating = {
    id: newId(),
    maleId: payload.maleId,
    femaleId: payload.femaleId,
    matingDate: new Date(payload.matingDate).toISOString(),
    expectedBirthDate: payload.expectedBirthDate
      ? new Date(payload.expectedBirthDate).toISOString()
      : addDays(payload.matingDate, 147),
    status: MatingStatus.PENDING,
    notes: payload.notes,
  }
  getMockStore().matings.push(mating)

  const ewe = findSheep(payload.femaleId)
  if (ewe) ewe.lastMountedDate = mating.matingDate

  return enrichMating(mating)
}

export async function markMatingEffective(id: string): Promise<ApiMating> {
  return updateMatingStatus(id, MatingStatus.EFFECTIVE)
}

export async function markMatingIneffective(id: string): Promise<ApiMating> {
  return updateMatingStatus(id, MatingStatus.INEFFECTIVE)
}

function updateMatingStatus(id: string, status: MatingStatus): ApiMating {
  const store = getMockStore()
  const idx = store.matings.findIndex((m) => m.id === id)
  if (idx === -1) throw notFound("Monta", id)
  store.matings[idx] = { ...store.matings[idx], status }
  return enrichMating(store.matings[idx])
}

export async function bulkRecordMatings(payload: BulkMatingSchedulePayload): Promise<BulkResult> {
  const result: BulkResult = { succeeded: [], failed: [], total: payload.femaleIds.length }
  for (const femaleId of payload.femaleIds) {
    try {
      const mating = await createMating({
        maleId: payload.maleId,
        femaleId,
        matingDate: payload.matingDate,
        expectedBirthDate: payload.expectedBirthDate,
        notes: payload.notes,
      })
      result.succeeded.push({ sheepId: femaleId, recordId: mating.id })
    } catch (err) {
      result.failed.push({
        sheepId: femaleId,
        error: err instanceof Error ? err.message : "Error desconocido",
      })
    }
  }
  return result
}
