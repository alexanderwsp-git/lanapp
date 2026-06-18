import type { ApiReproductionParameters } from "@/lib/api/farm-parameters"
import { getMockStore } from "../store"

export async function fetchFarmParameters(): Promise<ApiReproductionParameters> {
  return { ...getMockStore().farmParameters }
}

export async function updateFarmParameters(
  payload: ApiReproductionParameters,
): Promise<ApiReproductionParameters> {
  getMockStore().farmParameters = { ...payload }
  return { ...payload }
}
