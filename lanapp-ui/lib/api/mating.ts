import type { MatingStatus } from "@sheep/domain"
import type { ApiSheep } from "./types"
import * as mock from "@/mocks/handlers/mating"
import * as real from "./real/mating"
import { resolveApi } from "./resolve"

export type ApiMating = {
  id: string
  maleId: string
  femaleId: string
  matingDate: string
  expectedBirthDate?: string | null
  status: MatingStatus
  notes?: string | null
  male?: Pick<ApiSheep, "id" | "tag" | "name" | "birthDate"> | null
  female?: Pick<ApiSheep, "id" | "tag" | "name" | "birthDate"> | null
}

export type BulkMatingSchedulePayload = {
  maleId: string
  matingDate: string
  expectedBirthDate?: string
  notes?: string
  femaleIds: string[]
}

export type MatingCreatePayload = {
  maleId: string
  femaleId: string
  matingDate: string
  expectedBirthDate?: string
  notes?: string
}

export const {
  fetchMatingsBySheep,
  createMating,
  markMatingEffective,
  markMatingIneffective,
  bulkRecordMatings,
} = resolveApi(real, mock)
