import type {
  ApiWeight,
  BulkWeightPayload,
  WeightCreatePayload,
  WeightUpdatePayload,
} from "@/lib/api/weight"
import type { BulkResult } from "@/lib/api/types"
import { getMockStore, notFound } from "../store"
import { calcDailyGain, newId } from "../utils"

export async function fetchWeightsBySheep(sheepId: string): Promise<ApiWeight[]> {
  return getMockStore()
    .weights.filter((w) => w.sheepId === sheepId)
    .sort((a, b) => a.measurementDate.localeCompare(b.measurementDate))
}

export async function createWeight(payload: WeightCreatePayload): Promise<ApiWeight> {
  const store = getMockStore()
  const previous = store.weights
    .filter((w) => w.sheepId === payload.sheepId)
    .sort((a, b) => b.measurementDate.localeCompare(a.measurementDate))[0]

  const measurementDate = new Date(payload.measurementDate).toISOString()
  const dailyGain = previous
    ? calcDailyGain(
        payload.weight,
        payload.measurementDate,
        previous.weight,
        previous.measurementDate.slice(0, 10),
      )
    : null

  const record: ApiWeight = {
    id: newId(),
    sheepId: payload.sheepId,
    weight: payload.weight,
    measurementDate,
    dailyGain,
    notes: payload.notes,
  }
  store.weights.push(record)
  return record
}

export async function updateWeight(id: string, payload: WeightUpdatePayload): Promise<ApiWeight> {
  const store = getMockStore()
  const idx = store.weights.findIndex((w) => w.id === id)
  if (idx === -1) throw notFound("Peso", id)
  store.weights[idx] = {
    ...store.weights[idx],
    ...payload,
    measurementDate: payload.measurementDate
      ? new Date(payload.measurementDate).toISOString()
      : store.weights[idx].measurementDate,
  }
  return store.weights[idx]
}

export async function deleteWeight(id: string): Promise<void> {
  const store = getMockStore()
  const idx = store.weights.findIndex((w) => w.id === id)
  if (idx === -1) throw notFound("Peso", id)
  store.weights.splice(idx, 1)
}

export async function bulkRecordWeights(payload: BulkWeightPayload): Promise<BulkResult> {
  const result: BulkResult = { succeeded: [], failed: [], total: 0 }
  const items =
    payload.records ??
    (payload.sheepIds ?? []).map((sheepId) => ({
      sheepId,
      weight: payload.defaultWeight!,
      notes: payload.notes,
    }))
  result.total = items.length
  for (const item of items) {
    try {
      const record = await createWeight({
        sheepId: item.sheepId,
        weight: item.weight,
        measurementDate: payload.measurementDate,
        notes: item.notes ?? payload.notes,
      })
      result.succeeded.push({ sheepId: item.sheepId, recordId: record.id })
    } catch (err) {
      result.failed.push({
        sheepId: item.sheepId,
        error: err instanceof Error ? err.message : "No se pudo registrar el peso",
      })
    }
  }
  return result
}
