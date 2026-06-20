import { SheepStatus } from "@sheep/domain"
import type { ApiSheep } from "@/lib/api/types"

/** Blocks health/weight actions when the animal is not active in the herd. */
export function activeSheepEligibility(sheep: ApiSheep): string | null {
  if (sheep.status !== SheepStatus.ACTIVE) {
    return "La oveja no está activa"
  }
  return null
}

export function analysisEligibility(sheep: ApiSheep): string | null {
  return activeSheepEligibility(sheep)
}

export function medicineEligibility(sheep: ApiSheep): string | null {
  return activeSheepEligibility(sheep)
}

export function weightEligibility(sheep: ApiSheep): string | null {
  return activeSheepEligibility(sheep)
}
