import type { ReproductionParameters } from "@sheep/domain"
import * as mock from "@/mocks/handlers/farm-parameters"
import * as real from "./real/farm-parameters"
import { resolveApi } from "./resolve"

export type ApiReproductionParameters = ReproductionParameters

export const { fetchFarmParameters, updateFarmParameters } = resolveApi(real, mock)
