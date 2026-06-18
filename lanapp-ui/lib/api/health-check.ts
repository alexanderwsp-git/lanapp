import * as mock from "@/mocks/handlers/health-weight"
import * as real from "./real/health-check"
import { resolveApi } from "./resolve"

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

export const { fetchHealthChecksBySheep, createHealthCheck } = resolveApi(real, mock)
