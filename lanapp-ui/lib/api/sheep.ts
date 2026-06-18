import * as mock from "@/mocks/handlers/sheep"
import * as real from "./real/sheep"
import { resolveApi } from "./resolve"

export type { SheepListParams, SheepListResult } from "./real/sheep"

export const {
  fetchSheep,
  fetchSheepById,
  createSheep,
  updateSheep,
  updateSheepStatus,
  deleteSheep,
} = resolveApi(real, mock)
