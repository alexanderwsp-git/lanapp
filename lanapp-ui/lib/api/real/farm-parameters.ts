import type { ReproductionParameters } from "@sheep/domain"
import { lanapp } from "../client"
import type { ApiReproductionParameters } from "../farm-parameters"

export async function fetchFarmParameters(): Promise<ApiReproductionParameters> {
  const res = await lanapp.get<ApiReproductionParameters>("farm-parameters")
  return res.data
}

export async function updateFarmParameters(
  payload: ApiReproductionParameters,
): Promise<ApiReproductionParameters> {
  const res = await lanapp.put<ApiReproductionParameters>("farm-parameters", payload)
  return res.data
}
