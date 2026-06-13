import { BreedingCycleStatus, BreedingResult } from "@sheep/domain"

const BREEDING_RESULT_LABELS: Record<BreedingResult, string> = {
  [BreedingResult.PREGNANT]: "Preñada",
  [BreedingResult.EMPTY]: "Vacía",
  [BreedingResult.RECHECK]: "Revisar",
}

const BREEDING_CYCLE_STATUS_LABELS: Record<BreedingCycleStatus, string> = {
  [BreedingCycleStatus.ACTIVE]: "Activo",
  [BreedingCycleStatus.CANCELLED]: "Cancelado",
}

export function labelBreedingResult(result?: BreedingResult | null): string {
  if (!result) return "Pendiente"
  return BREEDING_RESULT_LABELS[result]
}

export function labelBreedingCycleStatus(status: BreedingCycleStatus): string {
  return BREEDING_CYCLE_STATUS_LABELS[status]
}

export function breedingResultBadgeColor(
  result?: BreedingResult | null,
): "yellow" | "green" | "red" | "gray" {
  if (!result) return "yellow"
  if (result === BreedingResult.PREGNANT) return "green"
  if (result === BreedingResult.EMPTY) return "red"
  return "gray"
}
