import {
  DiagnosisType,
  isOutsideEcoWindow,
  suggestedEcoWindow,
  suggestedRemateDate,
  type ReproductionParameters,
} from "@sheep/domain"
import { createBreedingCycle, recordBreedingDiagnosis } from "@/lib/api/breeding-cycle"
import type { ApiBreedingCycle } from "@/lib/api/breeding-cycle"
import {
  recordPregnancyCheck,
  type ApiPregnancyCheck,
  type PregnancyCheckCreatePayload,
} from "@/lib/api/pregnancy-check"
import type { ApiMating } from "@/lib/api/mating"
import { defaultCycleName } from "@/lib/mating/application-form"
import { uiResultToBreedingResult } from "@/lib/labels/breeding"
import { diagnoseOptionsForPhase, isPostPregnancyFollowUp, matingActions } from "@/lib/mating-actions"

export type EcoResult = "Preñada" | "Vacía" | "Revisar"

export type DiagnosisFormState = {
  checkDate: string
  result: EcoResult
  diagnosisType: DiagnosisType
  notes: string
  nextCheckDate: string
  vitaselApplied: boolean
  scheduleRemate: boolean
  remateDate: string
  remateNotes: string
  confirmMating: boolean
  confirmMatingDate: string
}

const today = () => new Date().toISOString().split("T")[0]

export function emptyDiagnosisForm(defaults: Partial<DiagnosisFormState> = {}): DiagnosisFormState {
  return {
    checkDate: defaults.checkDate ?? today(),
    result: defaults.result ?? "Preñada",
    diagnosisType: defaults.diagnosisType ?? DiagnosisType.ECO,
    notes: defaults.notes ?? "",
    nextCheckDate: defaults.nextCheckDate ?? "",
    vitaselApplied: defaults.vitaselApplied ?? false,
    scheduleRemate: false,
    remateDate: defaults.remateDate ?? "",
    remateNotes: defaults.remateNotes ?? "",
    confirmMating: defaults.confirmMating ?? false,
    confirmMatingDate: defaults.confirmMatingDate ?? today(),
  }
}

export function diagnosisFormFromMating(
  mating: ApiMating & { checks: ApiPregnancyCheck[] },
  reproParams: ReproductionParameters,
): DiagnosisFormState {
  const { phase } = matingActions(mating.checks)
  const options = diagnoseOptionsForPhase(phase, mating.checks)
  const window = suggestedEcoWindow(mating.matingDate, reproParams)
  const followUp = isPostPregnancyFollowUp(mating.checks)
  const defaultDate = today() >= window.min && today() <= window.max ? today() : window.min
  const checkDate = followUp ? today() : defaultDate
  return emptyDiagnosisForm({
    result: options[0] ?? "Preñada",
    checkDate,
    nextCheckDate: followUp ? "" : window.max,
    remateDate: suggestedRemateDate(checkDate, reproParams),
  })
}

export function diagnosisFormFromCycle(
  cycle: ApiBreedingCycle,
  checks?: ApiPregnancyCheck[],
  reproParams?: ReproductionParameters,
): DiagnosisFormState {
  if (cycle.matingId && checks && reproParams) {
    const options = diagnoseOptionsForPhase(matingActions(checks).phase, checks)
    const followUp = isPostPregnancyFollowUp(checks)
    const matingDate = cycle.confirmedMatingDate ?? cycle.matingDate
    const window = suggestedEcoWindow(matingDate, reproParams)
    const defaultDate = today() >= window.min && today() <= window.max ? today() : window.min
    const checkDate = followUp ? today() : defaultDate
    return emptyDiagnosisForm({
      result: options[0] ?? "Preñada",
      checkDate,
      confirmMating: false,
      confirmMatingDate: matingDate,
      nextCheckDate: followUp ? "" : window.max,
      remateDate: suggestedRemateDate(checkDate, reproParams),
    })
  }

  return emptyDiagnosisForm({
    confirmMating: !cycle.matingId,
    confirmMatingDate: today(),
  })
}

export function ecoOutsideWindow(
  checkDate: string,
  matingDate: string,
  reproParams: ReproductionParameters,
): boolean {
  if (!checkDate) return false
  return isOutsideEcoWindow(checkDate, matingDate, reproParams)
}

async function scheduleRemateCycle(input: {
  femaleId: string
  maleId?: string
  cycleName?: string
  remateDate: string
  remateNotes?: string
}): Promise<void> {
  const baseName = (input.cycleName?.trim() || defaultCycleName()).replace(/\s*·\s*remate$/i, "").trim()
  await createBreedingCycle({
    eweId: input.femaleId,
    cycleName: `${baseName} · remate`,
    ramId: input.maleId,
    matingDate: input.remateDate,
    notes: input.remateNotes,
  })
}

export async function saveMatingDiagnosis(input: {
  mating: ApiMating & { checks: ApiPregnancyCheck[] }
  form: DiagnosisFormState
  sheepId: string
  isFemale: boolean
  reproParams: ReproductionParameters
}): Promise<void> {
  const { mating, form, sheepId, isFemale, reproParams } = input
  const followUp = isPostPregnancyFollowUp(mating.checks)

  if (form.result === "Vacía" && followUp) {
    const ok = window.confirm(
      "La oveja fue confirmada preñada en esta monta. ¿Marcar como vacía (pérdida de gestación o error de diagnóstico)? Esto desbloqueará la oveja para una nueva monta.",
    )
    if (!ok) throw new Error("Cancelado")
  }

  const isPregnant = form.result === "Preñada"
  await recordPregnancyCheck({
    matingId: mating.id,
    checkDate: form.checkDate,
    isPregnant,
    checkType: form.diagnosisType,
    notes: form.notes.trim() || undefined,
    nextCheckDate: form.result === "Revisar" && form.nextCheckDate ? form.nextCheckDate : undefined,
    vitaselApplied: form.result === "Vacía" ? form.vitaselApplied : undefined,
  } satisfies PregnancyCheckCreatePayload)

  if (form.result === "Vacía" && form.scheduleRemate && form.remateDate && !followUp) {
    await scheduleRemateCycle({
      femaleId: isFemale ? sheepId : mating.femaleId,
      maleId: isFemale ? mating.maleId : sheepId,
      remateDate: form.remateDate,
      remateNotes: form.remateNotes.trim() || undefined,
    })
  }
}

export async function saveCycleDiagnosis(input: {
  cycle: ApiBreedingCycle
  form: DiagnosisFormState
  checks?: ApiPregnancyCheck[]
}): Promise<{ remateCycleName?: string }> {
  const { cycle, form, checks = [] } = input
  const hasMating = !!cycle.matingId
  const followUp = isPostPregnancyFollowUp(checks)

  if (form.result === "Vacía" && followUp) {
    const ok = window.confirm(
      "La oveja fue confirmada preñada en esta monta. ¿Marcar como vacía (pérdida de gestación o error de diagnóstico)? Esto desbloqueará la oveja para una nueva monta.",
    )
    if (!ok) throw new Error("Cancelado")
  }

  if (!hasMating && form.confirmMating && !form.confirmMatingDate) {
    throw new Error("Indica la fecha de monta")
  }
  if (!hasMating && !form.confirmMating) {
    throw new Error('Confirma la monta o activa "Confirmar monta al guardar"')
  }

  await recordBreedingDiagnosis(cycle.id, {
    diagnosisType: form.diagnosisType,
    diagnosisDate: form.checkDate,
    result: uiResultToBreedingResult(form.result),
    notes: form.notes.trim() || undefined,
    nextCheckDate: form.result === "Revisar" && form.nextCheckDate ? form.nextCheckDate : undefined,
    vitaselApplied: form.result === "Vacía" ? form.vitaselApplied : undefined,
    confirmMating: !hasMating && form.confirmMating,
    confirmMatingDate: !hasMating && form.confirmMating ? form.confirmMatingDate : undefined,
  })

  if (form.result === "Vacía" && form.scheduleRemate && form.remateDate && !followUp) {
    const baseName = (cycle.cycleName?.trim() || defaultCycleName())
      .replace(/\s*·\s*remate$/i, "")
      .trim()
    const remateCycleName = `${baseName} · remate`
    await scheduleRemateCycle({
      femaleId: cycle.eweId,
      maleId: cycle.ramId ?? undefined,
      cycleName: cycle.cycleName,
      remateDate: form.remateDate,
      remateNotes: form.remateNotes.trim() || undefined,
    })
    return { remateCycleName }
  }

  return {}
}

export function defaultRemateDate(checkDate: string, reproParams: ReproductionParameters): string {
  return suggestedRemateDate(checkDate, reproParams)
}
