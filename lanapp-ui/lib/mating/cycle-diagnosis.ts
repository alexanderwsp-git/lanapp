import { BreedingResult } from "@sheep/domain"
import type { ApiBreedingCycle } from "@/lib/api/breeding-cycle"
import type { ApiPregnancyCheck } from "@/lib/api/pregnancy-check"
import { matingActions } from "@/lib/mating-actions"

export type CycleDiagnosisGate = {
  canDiagnose: boolean
  diagnoseBlockedReason?: string
}

export function cycleDiagnosisGate(
  cycle: ApiBreedingCycle,
  checks?: ApiPregnancyCheck[],
): CycleDiagnosisGate {
  if (cycle.actualBirthDate) {
    return {
      canDiagnose: false,
      diagnoseBlockedReason: "Parto registrado — no se pueden agregar más diagnósticos",
    }
  }

  if (cycle.matingId && checks !== undefined) {
    const actions = matingActions(checks)
    return {
      canDiagnose: actions.canDiagnose,
      diagnoseBlockedReason: actions.diagnoseBlockedReason,
    }
  }

  if (cycle.result === BreedingResult.EMPTY) {
    return {
      canDiagnose: false,
      diagnoseBlockedReason: "Monta vacía — programa una nueva monta",
    }
  }

  if (!cycle.matingId) {
    return { canDiagnose: true }
  }

  if (
    cycle.result === BreedingResult.PREGNANT ||
    cycle.result === BreedingResult.RECHECK ||
    !cycle.result
  ) {
    return { canDiagnose: true }
  }

  return {
    canDiagnose: false,
    diagnoseBlockedReason: "No se pueden agregar más diagnósticos",
  }
}
