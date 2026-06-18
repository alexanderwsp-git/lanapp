import { lanapp } from "../client"
import type { ApiWeight, WeightCreatePayload, WeightUpdatePayload } from "../weight"

export async function fetchWeightsBySheep(sheepId: string): Promise<ApiWeight[]> {
  const res = await lanapp.get<ApiWeight[]>(`weight/sheep/${sheepId}`)
  return res.data
}

export async function createWeight(payload: WeightCreatePayload): Promise<ApiWeight> {
  const res = await lanapp.post<ApiWeight>("weight", payload)
  return res.data
}

export async function updateWeight(id: string, payload: WeightUpdatePayload): Promise<ApiWeight> {
  const res = await lanapp.put<ApiWeight>(`weight/${id}`, payload)
  return res.data
}

export async function deleteWeight(id: string): Promise<void> {
  await lanapp.delete<null>(`weight/${id}`)
}
