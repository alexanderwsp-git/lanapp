import * as mock from "@/mocks/handlers/sheep"
import * as real from "./real/sheep"
import { resolveApi } from "./resolve"

export type { ApiSheepFamily, SheepListParams, SheepListResult } from "./real/sheep"

export const {
  fetchSheep,
  fetchSheepById,
  fetchSheepFamily,
  createSheep,
  updateSheep,
  updateSheepStatus,
  deleteSheep,
} = resolveApi(real, mock)
