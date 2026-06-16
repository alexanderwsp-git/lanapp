import { lanapp } from "./client"

export type HealthCheckCreatePayload = {
  sheepId: string
  checkDate: string
  famachaScore: number
  weight?: number
  notes?: string
}

export type ApiHealthCheck = {
  id: string
  sheepId: string
  checkDate: string
  famachaScore: number
  weight?: number | null
  notes?: string | null
}

export async function fetchHealthChecksBySheep(sheepId: string): Promise<ApiHealthCheck[]> {
  const res = await lanapp.get<ApiHealthCheck[]>(`health-check/sheep/${sheepId}`)
  return res.data
}

export async function createHealthCheck(payload: HealthCheckCreatePayload): Promise<ApiHealthCheck> {
  const res = await lanapp.post<ApiHealthCheck>("health-check", payload)
  return res.data
}
