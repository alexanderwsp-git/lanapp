import { lanapp } from "../client"
import type { ApiHealthCheck, HealthCheckCreatePayload } from "../health-check"

export async function fetchHealthChecksBySheep(sheepId: string): Promise<ApiHealthCheck[]> {
  const res = await lanapp.get<ApiHealthCheck[]>(`health-check/sheep/${sheepId}`)
  return res.data
}

export async function createHealthCheck(payload: HealthCheckCreatePayload): Promise<ApiHealthCheck> {
  const res = await lanapp.post<ApiHealthCheck>("health-check", payload)
  return res.data
}
