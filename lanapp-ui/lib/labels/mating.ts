import { MatingStatus } from "@sheep/domain"

const MATING_STATUS_LABELS: Record<MatingStatus, string> = {
  [MatingStatus.PENDING]: "Pendiente",
  [MatingStatus.EFFECTIVE]: "Efectiva",
  [MatingStatus.INEFFECTIVE]: "Inefectiva",
}

export function labelMatingStatus(status: MatingStatus): string {
  return MATING_STATUS_LABELS[status] ?? status
}

export function matingStatusBadgeColor(
  status: MatingStatus,
): "yellow" | "green" | "red" | "gray" {
  if (status === MatingStatus.EFFECTIVE) return "green"
  if (status === MatingStatus.INEFFECTIVE) return "red"
  if (status === MatingStatus.PENDING) return "yellow"
  return "gray"
}

import { addDaysToIso, DEFAULT_REPRODUCTION_PARAMETERS } from "@sheep/domain"

/** @deprecated Use farm parameters via useReproductionParameters(). */
export const GESTATION_DAYS = DEFAULT_REPRODUCTION_PARAMETERS.gestationDays

export function addDays(isoDate: string, days: number): string {
  return addDaysToIso(isoDate, days)
}
