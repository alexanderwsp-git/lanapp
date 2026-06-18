import type { LocationCreate, LocationUpdate } from "@sheep/domain"
import type { ApiLocation } from "@/lib/api/types"
import { findLocation, getMockStore, notFound } from "../store"
import { newId, paginate } from "../utils"

export async function fetchLocations(limit = 100): Promise<ApiLocation[]> {
  const result = paginate(getMockStore().locations, 1, limit)
  return result.items
}

export async function fetchLocationById(id: string): Promise<ApiLocation> {
  const location = findLocation(id)
  if (!location) throw notFound("Ubicación", id)
  return { ...location }
}

export async function createLocation(payload: LocationCreate): Promise<ApiLocation> {
  const location: ApiLocation = {
    id: newId(),
    name: payload.name,
    address: payload.address,
    latitude: payload.latitude ?? null,
    longitude: payload.longitude ?? null,
    description: payload.description ?? null,
  }
  getMockStore().locations.push(location)
  return location
}

export async function updateLocation(id: string, payload: LocationUpdate): Promise<ApiLocation> {
  const store = getMockStore()
  const idx = store.locations.findIndex((l) => l.id === id)
  if (idx === -1) throw notFound("Ubicación", id)
  store.locations[idx] = { ...store.locations[idx], ...payload }
  return store.locations[idx]
}

export async function deleteLocation(id: string): Promise<void> {
  const store = getMockStore()
  const idx = store.locations.findIndex((l) => l.id === id)
  if (idx === -1) throw notFound("Ubicación", id)
  store.locations.splice(idx, 1)
}
