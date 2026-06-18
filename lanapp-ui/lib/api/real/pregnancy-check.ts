import { lanapp } from "../client"
import type {
  ApiPregnancyCheck,
  DeliveryPayload,
  PregnancyCheckCreatePayload,
} from "../pregnancy-check"

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
