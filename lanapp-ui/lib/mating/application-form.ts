import {
  expectedBirthFromMating,
  suggestedRemateDate,
  type ReproductionParameters,
} from "@sheep/domain"
import {
  confirmBreedingCycleMating,
  createBreedingCycle,
  updateBreedingCycle,
} from "@/lib/api/breeding-cycle"
import { createMating } from "@/lib/api/mating"
import { toDateInputValue } from "@/lib/format"

export type MatingFormState = {
  partnerId: string
  matingDate: string
  plannedDate: string
  cycleName: string
  notes: string
  scheduleOnly: boolean
  scheduleNext: boolean
  nextScheduledDate: string
  nextNotes: string
}

export function defaultCycleName(date = new Date()): string {
  return `${date.getFullYear()}-A`
}

export function emptyMatingForm(
  defaults: Partial<MatingFormState> & { scheduleOnly?: boolean } = {},
): MatingFormState {
  const today = new Date().toISOString().slice(0, 10)
  return {
    partnerId: defaults.partnerId ?? "",
    matingDate: defaults.matingDate ?? today,
    plannedDate: defaults.plannedDate ?? defaults.matingDate ?? today,
    cycleName: defaults.cycleName ?? defaultCycleName(),
    notes: defaults.notes ?? "",
    scheduleOnly: defaults.scheduleOnly ?? false,
    scheduleNext: false,
    nextScheduledDate: "",
    nextNotes: "",
  }
}

async function scheduleNextMating(input: {
  femaleId: string
  maleId: string | undefined
  cycleName: string
  nextScheduledDate: string
  nextNotes?: string
}): Promise<void> {
  const { femaleId, maleId, cycleName, nextScheduledDate, nextNotes } = input
  const remateName = `${cycleName.replace(/\s*·\s*remate$/i, "").trim()} · remate`
  await createBreedingCycle({
    eweId: femaleId,
    cycleName: remateName,
    ramId: maleId,
    matingDate: nextScheduledDate,
    notes: nextNotes,
  })
}

export async function saveMatingForm(input: {
  sheepId: string
  isFemale: boolean
  form: MatingFormState
  sheepLabel: string
  plannedCycleId?: string
  reproParams: ReproductionParameters
}): Promise<{ successMessage: string }> {
  const { sheepId, isFemale, form, sheepLabel, plannedCycleId, reproParams } = input

  if (!form.matingDate) throw new Error("Indica la fecha de monta")

  const femaleId = isFemale ? sheepId : form.partnerId
  const maleId = isFemale ? form.partnerId : sheepId
  const notes = form.notes.trim() || undefined
  const cycleName = form.cycleName.trim() || defaultCycleName()

  if (plannedCycleId && !form.scheduleOnly) {
    if (!form.partnerId) throw new Error("Selecciona un reproductor")
    await updateBreedingCycle(plannedCycleId, {
      ramId: maleId,
      notes,
    })
    await confirmBreedingCycleMating(plannedCycleId, { matingDate: form.matingDate })

    if (form.scheduleNext && form.nextScheduledDate) {
      await scheduleNextMating({
        femaleId,
        maleId,
        cycleName,
        nextScheduledDate: form.nextScheduledDate,
        nextNotes: form.nextNotes.trim() || undefined,
      })
      return {
        successMessage: `Monta registrada para ${sheepLabel}. Próxima monta programada.`,
      }
    }
    return { successMessage: `Monta registrada para ${sheepLabel}.` }
  }

  if (form.scheduleOnly) {
    if (!isFemale && !form.partnerId) {
      throw new Error("Selecciona una oveja")
    }
    if (!cycleName) throw new Error("Indica el nombre del ciclo")
    await createBreedingCycle({
      eweId: femaleId,
      cycleName,
      ramId: maleId || undefined,
      matingDate: form.matingDate,
      notes,
    })
    return { successMessage: `Monta programada para ${sheepLabel}.` }
  }

  if (!form.partnerId) {
    throw new Error(isFemale ? "Selecciona un reproductor" : "Selecciona una oveja")
  }

  const expectedBirth = expectedBirthFromMating(form.matingDate, reproParams)
  await createMating({
    maleId,
    femaleId,
    matingDate: form.matingDate,
    expectedBirthDate: expectedBirth || undefined,
    notes,
  })

  if (form.scheduleNext && form.nextScheduledDate) {
    await scheduleNextMating({
      femaleId,
      maleId,
      cycleName,
      nextScheduledDate: form.nextScheduledDate,
      nextNotes: form.nextNotes.trim() || undefined,
    })
    return {
      successMessage: `Monta registrada para ${sheepLabel}. Próxima monta programada.`,
    }
  }

  return { successMessage: `Monta registrada para ${sheepLabel}.` }
}

export function defaultNextMatingDate(
  matingDate: string,
  reproParams: ReproductionParameters,
): string {
  const base = matingDate <= new Date().toISOString().slice(0, 10) ? matingDate : new Date().toISOString().slice(0, 10)
  return suggestedRemateDate(base, reproParams)
}

export function matingFormFromPlannedCycle(cycle: {
  ramId?: string | null
  matingDate: string
  cycleName: string
  notes?: string | null
}): MatingFormState {
  const planned = toDateInputValue(cycle.matingDate)
  const today = new Date().toISOString().slice(0, 10)
  return emptyMatingForm({
    partnerId: cycle.ramId ?? "",
    matingDate: today,
    plannedDate: planned,
    cycleName: cycle.cycleName,
    notes: cycle.notes ?? "",
    scheduleOnly: false,
  })
}
