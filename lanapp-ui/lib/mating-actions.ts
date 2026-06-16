import {
  BreedingResult,
  canRecordDelivery,
  canRecordDiagnosis,
  deriveMatingPhase,
  hasConfirmedPregnancy,
  type MatingCheckLike,
  type MatingPhase,
} from "@sheep/domain"
import type { ApiPregnancyCheck } from "@/lib/api/pregnancy-check"

export function matingActions(checks: ApiPregnancyCheck[]) {
  const phase = deriveMatingPhase(checks)
  const canDiagnose =
    canRecordDiagnosis(phase, BreedingResult.PREGNANT).ok ||
    canRecordDiagnosis(phase, BreedingResult.EMPTY).ok ||
    canRecordDiagnosis(phase, BreedingResult.RECHECK).ok

  const deliverGate = canRecordDelivery(phase)

  return {
    phase,
    canDiagnose,
    canDeliver: deliverGate.ok,
    diagnoseBlockedReason:
      phase === "delivered"
        ? "Parto ya registrado"
        : phase === "empty"
          ? "Monta vacía — registra una nueva monta"
          : !canDiagnose
            ? "No se pueden agregar más diagnósticos"
            : undefined,
    deliverBlockedReason: deliverGate.ok ? undefined : deliverGate.reason,
  }
}

export function diagnoseOptionsForPhase(
  phase: MatingPhase,
  checks: MatingCheckLike[] = [],
): Array<"Preñada" | "Vacía" | "Revisar"> {
  if (phase === "pregnant" || hasConfirmedPregnancy(checks)) {
    return ["Revisar", "Vacía"]
  }
  if (phase === "recheck" || phase === "awaiting_diagnosis") {
    return ["Preñada", "Vacía", "Revisar"]
  }
  return []
}

export function isPostPregnancyFollowUp(checks: MatingCheckLike[]): boolean {
  return hasConfirmedPregnancy(checks)
}
