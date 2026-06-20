import {
  BreedingCycleStatus,
  BreedingResult,
  Gender,
  SheepCategory,
} from "@sheep/domain"
import type {
  ApiBreedingCycle,
  BreedingCycleCreatePayload,
  BreedingCycleUpdatePayload,
  BreedingDiagnosisPayload,
  BulkBreedingCycleSchedulePayload,
  BulkBreedingCycleConfirmPayload,
  ConfirmBreedingMatingPayload,
} from "@/lib/api/breeding-cycle"
import type { BulkResult } from "@/lib/api/types"
import type {
  ApiRecentWeaningRecord,
  ApiWeaningRecord,
  BulkWeaningPayload,
  WeaningRecentQuery,
} from "@/lib/api/weaning"
import type { ApiSheep } from "@/lib/api/types"
import {
  enrichBreedingCycle,
  enrichSheep,
  enrichSheepList,
  findSheep,
  getMockStore,
  notFound,
} from "../store"
import { addDays, daysBetween, newId } from "../utils"
import { createMating } from "./mating"
import { seedRecentWeanings } from "../data/weaning-records"

export async function fetchBreedingCyclesByEwe(eweId: string): Promise<ApiBreedingCycle[]> {
  const cycles = getMockStore().breedingCycles.filter((c) => c.eweId === eweId)
  return cycles.map(enrichBreedingCycle)
}

export async function fetchBreedingCycles(params?: {
  cycleName?: string
  page?: number
  limit?: number
}): Promise<ApiBreedingCycle[]> {
  const { cycleName } = params ?? {}
  let cycles = getMockStore().breedingCycles.filter(
    (c) => c.status === BreedingCycleStatus.ACTIVE,
  )
  if (cycleName) cycles = cycles.filter((c) => c.cycleName === cycleName)
  return cycles.map(enrichBreedingCycle)
}

export async function confirmBreedingCycleMating(
  id: string,
  payload: ConfirmBreedingMatingPayload = {},
): Promise<ApiBreedingCycle> {
  const store = getMockStore()
  const idx = store.breedingCycles.findIndex((c) => c.id === id)
  if (idx === -1) throw notFound("Ciclo", id)
  const cycle = store.breedingCycles[idx]
  if (cycle.matingId) return enrichBreedingCycle(cycle)
  if (!cycle.ramId) {
    throw new Error("Asigna un reproductor antes de confirmar la monta")
  }

  const actualDate = payload.matingDate ?? new Date().toISOString().slice(0, 10)

  const mating = await createMating({
    maleId: cycle.ramId,
    femaleId: cycle.eweId,
    matingDate: actualDate,
    expectedBirthDate: cycle.expectedBirthDate ?? undefined,
    notes: cycle.notes
      ? `Ciclo ${cycle.cycleName}: ${cycle.notes}`
      : `Ciclo ${cycle.cycleName}`,
  })
  store.breedingCycles[idx] = { ...cycle, matingId: mating.id }
  return enrichBreedingCycle(store.breedingCycles[idx])
}

export async function bulkConfirmBreedingCycles(
  payload: BulkBreedingCycleConfirmPayload,
): Promise<BulkResult> {
  const result: BulkResult = { succeeded: [], failed: [], total: payload.ids.length }
  for (const id of payload.ids) {
    try {
      const cycle = await confirmBreedingCycleMating(id, { matingDate: payload.matingDate })
      result.succeeded.push({ sheepId: cycle.eweId, recordId: cycle.id })
    } catch (err) {
      const store = getMockStore()
      const cycle = store.breedingCycles.find((c) => c.id === id)
      result.failed.push({
        sheepId: cycle?.eweId ?? id,
        error: err instanceof Error ? err.message : "No se pudo confirmar la monta",
      })
    }
  }
  return result
}

export async function updateBreedingCycle(
  id: string,
  payload: BreedingCycleUpdatePayload,
): Promise<ApiBreedingCycle> {
  const store = getMockStore()
  const idx = store.breedingCycles.findIndex((c) => c.id === id)
  if (idx === -1) throw notFound("Ciclo", id)
  const prev = store.breedingCycles[idx]
  store.breedingCycles[idx] = {
    ...prev,
    ...payload,
    matingDate: payload.matingDate
      ? new Date(payload.matingDate).toISOString()
      : prev.matingDate,
    expectedBirthDate: payload.matingDate
      ? addDays(payload.matingDate, 147)
      : prev.expectedBirthDate,
  }
  return enrichBreedingCycle(store.breedingCycles[idx])
}

export async function createBreedingCycle(
  payload: BreedingCycleCreatePayload,
): Promise<ApiBreedingCycle> {
  const cycle: ApiBreedingCycle = {
    id: newId(),
    eweId: payload.eweId,
    ramId: payload.ramId,
    cycleName: payload.cycleName,
    matingDate: new Date(payload.matingDate).toISOString(),
    vitaselApplied: payload.vitaselApplied ?? false,
    status: BreedingCycleStatus.ACTIVE,
    expectedBirthDate: addDays(payload.matingDate, 147),
    notes: payload.notes,
  }
  getMockStore().breedingCycles.push(cycle)
  return enrichBreedingCycle(cycle)
}

export async function bulkScheduleBreedingCycles(
  payload: BulkBreedingCycleSchedulePayload,
): Promise<BulkResult> {
  const store = getMockStore()
  const result: BulkResult = { succeeded: [], failed: [], total: payload.eweIds.length }

  for (const eweId of payload.eweIds) {
    const ewe = findSheep(eweId)
    if (!ewe || ewe.gender !== Gender.FEMALE) {
      result.failed.push({ sheepId: eweId, error: "Oveja hembra no encontrada" })
      continue
    }
    if (store.breedingCycles.some((c) => c.eweId === eweId && c.cycleName === payload.cycleName)) {
      result.failed.push({ sheepId: eweId, error: "Ya existe un ciclo con ese nombre" })
      continue
    }
    const cycle = await createBreedingCycle({
      eweId,
      ramId: payload.ramId,
      cycleName: payload.cycleName,
      matingDate: payload.matingDate,
      vitaselApplied: payload.vitaselApplied,
      notes: payload.notes,
    })
    result.succeeded.push({ sheepId: eweId, recordId: cycle.id })
  }
  return result
}

export async function recordBreedingDiagnosis(
  id: string,
  payload: BreedingDiagnosisPayload,
): Promise<ApiBreedingCycle> {
  const store = getMockStore()
  let idx = store.breedingCycles.findIndex((c) => c.id === id)
  if (idx === -1) throw notFound("Ciclo", id)

  if (!store.breedingCycles[idx].matingId) {
    if (!payload.confirmMating) {
      throw new Error(
        'Confirma la monta antes del diagnóstico o activa "Confirmar monta al guardar"',
      )
    }
    await confirmBreedingCycleMating(id, {
      matingDate: payload.confirmMatingDate,
    })
    idx = store.breedingCycles.findIndex((c) => c.id === id)
  }

  store.breedingCycles[idx] = {
    ...store.breedingCycles[idx],
    diagnosisType: payload.diagnosisType,
    diagnosisDate: new Date(payload.diagnosisDate).toISOString(),
    result: payload.result,
    vitaselApplied: payload.vitaselApplied ?? store.breedingCycles[idx].vitaselApplied,
    notes: payload.notes ?? store.breedingCycles[idx].notes,
  }
  return enrichBreedingCycle(store.breedingCycles[idx])
}

export async function cancelBreedingCycle(id: string): Promise<ApiBreedingCycle> {
  const store = getMockStore()
  const idx = store.breedingCycles.findIndex((c) => c.id === id)
  if (idx === -1) throw notFound("Ciclo", id)
  store.breedingCycles[idx] = {
    ...store.breedingCycles[idx],
    status: BreedingCycleStatus.CANCELLED,
  }
  return enrichBreedingCycle(store.breedingCycles[idx])
}

export async function bulkRecordWeaning(payload: BulkWeaningPayload): Promise<BulkResult> {
  const store = getMockStore()
  const records =
    payload.records ??
    (payload.sheepIds ?? []).map((sheepId) => ({
      sheepId,
      weaningWeight: payload.defaultWeight ?? 0,
      notes: payload.notes,
    }))

  const result: BulkResult = { succeeded: [], failed: [], total: records.length }
  for (const item of records) {
    if (store.weaningRecords.some((w) => w.sheepId === item.sheepId)) {
      result.failed.push({ sheepId: item.sheepId, error: "Ya tiene registro de destete" })
      continue
    }
    const record: ApiWeaningRecord = {
      id: newId(),
      sheepId: item.sheepId,
      weaningDate: new Date(payload.weaningDate).toISOString(),
      weaningWeight: item.weaningWeight,
      lotId: payload.lotId,
      notes: item.notes ?? payload.notes,
    }
    store.weaningRecords.push(record)
    result.succeeded.push({ sheepId: item.sheepId, recordId: record.id })
  }
  return result
}

export async function fetchWeaningAlerts(minDays = 70): Promise<ApiSheep[]> {
  const store = getMockStore()
  const weanedIds = new Set(store.weaningRecords.map((w) => w.sheepId))
  const today = new Date().toISOString().slice(0, 10)

  return enrichSheepList(
    store.sheep.filter((s) => {
      if (weanedIds.has(s.id)) return false
      if (s.category !== SheepCategory.CORDERO && s.category !== SheepCategory.CORDERA) {
        return false
      }
      return daysBetween(s.birthDate.slice(0, 10), today) >= minDays
    }),
  )
}

export async function fetchRecentWeanings(
  query: WeaningRecentQuery = {},
): Promise<ApiRecentWeaningRecord[]> {
  const store = getMockStore()
  let records = [...seedRecentWeanings]

  if (query.fromDate) {
    records = records.filter((r) => r.weaningDate.slice(0, 10) >= query.fromDate!)
  }
  if (query.toDate) {
    records = records.filter((r) => r.weaningDate.slice(0, 10) <= query.toDate!)
  }
  if (query.days != null) {
    const cutoff = addDays(new Date().toISOString().slice(0, 10), -query.days)
    records = records.filter((r) => r.weaningDate.slice(0, 10) >= cutoff)
  }

  for (const record of store.weaningRecords) {
    if (records.some((r) => r.id === record.id)) continue
    const sheep = findSheep(record.sheepId)
    if (!sheep) continue
    records.push({
      ...record,
      tag: sheep.tag,
      name: sheep.name,
      category: sheep.category,
      birthDate: sheep.birthDate,
      gender: sheep.gender,
    })
  }

  return records.sort((a, b) => b.weaningDate.localeCompare(a.weaningDate))
}

export async function fetchWeaningRecordsBySheep(sheepId: string): Promise<ApiWeaningRecord[]> {
  return getMockStore()
    .weaningRecords.filter((w) => w.sheepId === sheepId)
    .sort((a, b) => b.weaningDate.localeCompare(a.weaningDate))
}
