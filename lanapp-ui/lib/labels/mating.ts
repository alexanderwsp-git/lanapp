import {
  MatingStatus,
  MATING_PHASE_LABELS,
  deriveMatingPhase,
  deliveryCheck,
  latestDiagnosis,
  type MatingPhase,
} from "@sheep/domain"
import { addDaysToIso, DEFAULT_REPRODUCTION_PARAMETERS } from "@sheep/domain"
import type { ApiPregnancyCheck } from "@/lib/api/pregnancy-check"
import { formatDisplayDate } from "@/lib/format"
import { labelDiagnosisType } from "@/lib/labels/breeding"

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

/** Planned cycle row — no confirmed mating yet. */
export function labelPlannedMatingStatus(): string {
  return "Monta planificada · ECO pendiente"
}

/** Confirmed mating awaiting first ECO. */
export function labelConfirmedAwaitingEco(): string {
  return "Monta confirmada · ECO pendiente"
}

export function labelMatingPhase(phase: MatingPhase): string {
  if (phase === "awaiting_diagnosis") return labelConfirmedAwaitingEco()
  return MATING_PHASE_LABELS[phase]
}

export function matingPhaseBadgeColor(
  phase: MatingPhase,
): "green" | "red" | "yellow" | "gray" | "indigo" {
  switch (phase) {
    case "pregnant":
    case "delivered":
      return "green"
    case "empty":
      return "red"
    case "recheck":
      return "yellow"
    case "awaiting_diagnosis":
      return "gray"
    default:
      return "indigo"
  }
}

export function matingPhaseSummary(checks: ApiPregnancyCheck[]): {
  phase: MatingPhase
  label: string
  color: ReturnType<typeof matingPhaseBadgeColor>
  detail?: string
} {
  const phase = deriveMatingPhase(checks)
  const label = labelMatingPhase(phase)
  const color = matingPhaseBadgeColor(phase)

  const delivery = deliveryCheck(checks)
  const dx = latestDiagnosis(checks)

  if (phase === "delivered" && delivery) {
    return { phase, label, color, detail: formatDisplayDate(delivery.checkDate) }
  }
  if (phase === "awaiting_diagnosis") {
    return { phase, label, color }
  }
  if (dx) {
    const type = dx.checkType ? labelDiagnosisType(dx.checkType as ApiPregnancyCheck["checkType"]) : "Chequeo"
    return {
      phase,
      label,
      color,
      detail: `${type} · ${formatDisplayDate(dx.checkDate)}`,
    }
  }
  return { phase, label, color }
}

/** @deprecated Use farm parameters via useReproductionParameters(). */
export const GESTATION_DAYS = DEFAULT_REPRODUCTION_PARAMETERS.gestationDays

export function addDays(isoDate: string, days: number): string {
  return addDaysToIso(isoDate, days)
}
