import { lanapp } from "./client"

export type ApiWeight = {
  id: string
  sheepId: string
  weight: number
  measurementDate: string
  dailyGain?: number | null
  notes?: string | null
}

/** JSON body for POST /weight — dates are ISO strings in the UI. */
export type WeightCreatePayload = {
  sheepId: string
  weight: number
  measurementDate: string
  notes?: string
}

export type WeightUpdatePayload = Partial<WeightCreatePayload>

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
