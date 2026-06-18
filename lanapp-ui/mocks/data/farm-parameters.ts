import { DEFAULT_REPRODUCTION_PARAMETERS } from "@sheep/domain"
import type { ApiReproductionParameters } from "@/lib/api/farm-parameters"

export const seedFarmParameters: ApiReproductionParameters = {
  ...DEFAULT_REPRODUCTION_PARAMETERS,
}
