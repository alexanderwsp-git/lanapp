import {
  BirthType,
  Gender,
  SheepCategory,
  SheepStatus,
  type SheepCreate,
  type SheepStatus as SheepStatusType,
  type SheepUpdate,
} from "@sheep/domain"
import type { SheepListParams, SheepListResult } from "@/lib/api/sheep"
import type { ApiSheep } from "@/lib/api/types"
import {
  enrichSheep,
  enrichSheepList,
  findSheep,
  getMockStore,
  notFound,
} from "../store"
import { newId, paginate } from "../utils"

function filterSheep(items: ApiSheep[], params: SheepListParams): ApiSheep[] {
  return items.filter((s) => {
    if (params.gender && s.gender !== params.gender) return false
    if (params.status && s.status !== params.status) return false
    if (params.category && s.category !== params.category) return false
    if (params.locationId && s.currentLocationId !== params.locationId) return false
    return true
  })
}

export async function fetchSheep(params: SheepListParams = {}): Promise<SheepListResult> {
  const { page = 1, limit = 100 } = params
  const filtered = enrichSheepList(filterSheep(getMockStore().sheep, params))
  return paginate(filtered, page, limit)
}

export async function fetchSheepById(id: string): Promise<ApiSheep> {
  const sheep = findSheep(id)
  if (!sheep) throw notFound("Oveja", id)
  return enrichSheep(sheep)
}

export async function createSheep(payload: SheepCreate): Promise<ApiSheep> {
  const store = getMockStore()
  const sheep: ApiSheep = {
    id: newId(),
    tag: payload.tag,
    name: payload.name,
    breed: payload.breed,
    gender: payload.gender,
    birthDate: new Date(payload.birthDate).toISOString(),
    birthType: payload.birthType ?? BirthType.SINGLE,
    weight: payload.weight,
    status: SheepStatus.ACTIVE,
    category:
      payload.gender === Gender.MALE ? SheepCategory.CORDERO : SheepCategory.CORDERA,
    recordType: payload.recordType,
    currentLocationId: payload.currentLocationId,
    notes: payload.notes,
  }
  store.sheep.push(sheep)
  return enrichSheep(sheep)
}

export async function updateSheep(id: string, payload: SheepUpdate): Promise<ApiSheep> {
  const store = getMockStore()
  const idx = store.sheep.findIndex((s) => s.id === id)
  if (idx === -1) throw notFound("Oveja", id)
  const current = store.sheep[idx]
  const updated: ApiSheep = {
    ...current,
    ...payload,
    birthDate: payload.birthDate
      ? new Date(payload.birthDate).toISOString()
      : current.birthDate,
    ...(payload.isBreedingRam === true
      ? { breedingRamMarkedAt: new Date().toISOString().split("T")[0] }
      : payload.isBreedingRam === false
        ? { breedingRamMarkedAt: null }
        : {}),
  }
  store.sheep[idx] = updated
  return enrichSheep(updated)
}

export async function updateSheepStatus(id: string, status: SheepStatusType): Promise<ApiSheep> {
  return updateSheep(id, { status } as SheepUpdate)
}

export async function deleteSheep(id: string): Promise<void> {
  const store = getMockStore()
  const idx = store.sheep.findIndex((s) => s.id === id)
  if (idx === -1) throw notFound("Oveja", id)
  store.sheep.splice(idx, 1)
}
