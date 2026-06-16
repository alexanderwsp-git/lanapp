import type { LocationCreate, LocationUpdate } from "@sheep/domain"
import { lanapp } from "./client"
import type { ApiLocation, Paginated } from "./types"

export async function fetchLocations(limit = 100): Promise<ApiLocation[]> {
  const res = await lanapp.get<Paginated<ApiLocation>>(`location?page=1&limit=${limit}`)
  return res.data.items
}

export async function fetchLocationById(id: string): Promise<ApiLocation> {
  const res = await lanapp.get<ApiLocation>(`location/${id}`)
  return res.data
}

export async function createLocation(payload: LocationCreate): Promise<ApiLocation> {
  const res = await lanapp.post<ApiLocation>("location", payload)
  return res.data
}

export async function updateLocation(id: string, payload: LocationUpdate): Promise<ApiLocation> {
  const res = await lanapp.put<ApiLocation>(`location/${id}`, payload)
  return res.data
}

export async function deleteLocation(id: string): Promise<void> {
  await lanapp.delete(`location/${id}`)
}
