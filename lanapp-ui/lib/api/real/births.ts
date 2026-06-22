import { lanapp } from "../client"
import type { ApiMating } from "../mating"
import type { ApiPregnancyCheck } from "../pregnancy-check"
import type { ApiSheep } from "../types"

export type ApiPendingDelivery = {
  sheep: ApiSheep
  mating: ApiMating
  checks: ApiPregnancyCheck[]
}

export async function fetchPendingDeliveries(): Promise<ApiPendingDelivery[]> {
  const res = await lanapp.get<ApiPendingDelivery[]>("births/pending-delivery")
  return res.data
}
