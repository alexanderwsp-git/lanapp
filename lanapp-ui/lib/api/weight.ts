import * as mock from "@/mocks/handlers/health-weight"
import * as real from "./real/weight"
import { resolveApi } from "./resolve"

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

export const { fetchWeightsBySheep, createWeight, updateWeight, deleteWeight } = resolveApi(real, mock)
