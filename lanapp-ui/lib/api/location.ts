import { lanapp } from "./client"
import type { ApiLocation, Paginated } from "./types"

export async function fetchLocations(limit = 100): Promise<ApiLocation[]> {
  const res = await lanapp.get<Paginated<ApiLocation>>(`location?page=1&limit=${limit}`)
  return res.data.items
}
