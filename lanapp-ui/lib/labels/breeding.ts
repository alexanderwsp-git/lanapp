import { BreedingCycleStatus, BreedingResult, DiagnosisType, PREGNANCY_DIAGNOSIS_TYPES } from "@sheep/domain"

const BREEDING_RESULT_LABELS: Record<BreedingResult, string> = {
  [BreedingResult.PREGNANT]: "Preñada",
  [BreedingResult.EMPTY]: "Vacía",
  [BreedingResult.RECHECK]: "Revisar",
}

const BREEDING_CYCLE_STATUS_LABELS: Record<BreedingCycleStatus, string> = {
  [BreedingCycleStatus.ACTIVE]: "Activo",
  [BreedingCycleStatus.CANCELLED]: "Cancelado",
}

const DIAGNOSIS_TYPE_LABELS: Record<DiagnosisType, string> = {
  [DiagnosisType.ECO]: "ECO",
  [DiagnosisType.CONTROL_MONTA]: "Control manual",
  [DiagnosisType.FAMACHA]: "ECO",
}

/** Pregnancy diagnosis on Montas + Planificador — ECO only. */
export const diagnosisTypesForForms = PREGNANCY_DIAGNOSIS_TYPES

/** @deprecated Use diagnosisTypesForForms. */
export const diagnosisTypeOptions = Object.values(DiagnosisType)

export function labelBreedingResult(result?: BreedingResult | null): string {
  if (!result) return "Pendiente"
  return BREEDING_RESULT_LABELS[result]
}

export function labelBreedingCycleStatus(status: BreedingCycleStatus): string {
  return BREEDING_CYCLE_STATUS_LABELS[status]
}

export function labelDiagnosisType(type?: DiagnosisType | null): string {
  if (!type) return "—"
  return DIAGNOSIS_TYPE_LABELS[type] ?? type
}

export function breedingResultBadgeColor(
  result?: BreedingResult | null,
): "yellow" | "green" | "red" | "gray" {
  if (!result) return "yellow"
  if (result === BreedingResult.PREGNANT) return "green"
  if (result === BreedingResult.EMPTY) return "red"
  return "gray"
}

export function uiResultToBreedingResult(
  label: "Preñada" | "Vacía" | "Revisar",
): BreedingResult {
  if (label === "Preñada") return BreedingResult.PREGNANT
  if (label === "Vacía") return BreedingResult.EMPTY
  return BreedingResult.RECHECK
}

export function breedingResultToUiOptions(): Array<"Preñada" | "Vacía" | "Revisar"> {
  return ["Preñada", "Vacía", "Revisar"]
}
