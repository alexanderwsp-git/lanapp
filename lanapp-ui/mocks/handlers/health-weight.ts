import type {
  ApiWeight,
  WeightCreatePayload,
  WeightUpdatePayload,
} from "@/lib/api/weight"
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
