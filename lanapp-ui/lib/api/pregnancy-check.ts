import { DiagnosisType, PregnancyCheckKind } from "@sheep/domain"
import { lanapp } from "./client"

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
}

export type DeliveryPayload = {
  deliveryDate: string
  notes?: string
}

export async function fetchPregnancyChecksByMating(matingId: string): Promise<ApiPregnancyCheck[]> {
  const res = await lanapp.get<ApiPregnancyCheck[]>(`pregnancy-check/mating/${matingId}`)
  return res.data
}

export async function recordPregnancyCheck(payload: PregnancyCheckCreatePayload): Promise<ApiPregnancyCheck> {
  const res = await lanapp.post<ApiPregnancyCheck>("pregnancy-check", payload)
  return res.data
}

export async function recordDelivery(matingId: string, payload: DeliveryPayload): Promise<ApiPregnancyCheck> {
  const res = await lanapp.post<ApiPregnancyCheck>(`pregnancy-check/mating/${matingId}/delivery`, payload)
  return res.data
}
