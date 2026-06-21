import { DiagnosisType, PregnancyCheckKind } from "@sheep/domain"
import * as mock from "@/mocks/handlers/pregnancy-check"
import * as real from "./real/pregnancy-check"
import { resolveApi } from "./resolve"

export type PregnancyCheckCreatePayload = {
  matingId: string
  checkDate: string
  isPregnant: boolean
  checkType?: DiagnosisType
  notes?: string
  nextCheckDate?: string
  vitaselApplied?: boolean
}

export type ApiPregnancyCheck = {
  id: string
  matingId: string
  checkDate: string
  isPregnant: boolean
  checkType?: DiagnosisType | null
  kind?: PregnancyCheckKind | null
  notes?: string | null
  nextCheckDate?: string | null
  offspringBorn?: number | null
  offspringAlive?: number | null
  offspringLost?: number | null
}

export type DeliveryPayload = {
  deliveryDate: string
  notes?: string
  offspringBorn?: number
  offspringAlive?: number
  offspringLost?: number
}

export const { fetchPregnancyChecksByMating, recordPregnancyCheck, recordDelivery } = resolveApi(real, mock)
