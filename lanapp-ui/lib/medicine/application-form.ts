import { MedicineStatus } from "@sheep/domain"
import { createMedicineApplication } from "@/lib/api/medicine"

export type MedicineApplicationFormState = {
  medicineId: string
  applicationDate: string
  notes: string
  scheduleOnly: boolean
  scheduleNext: boolean
  nextScheduledDate: string
  nextNotes: string
}

export function emptyMedicineApplicationForm(
  medicineId?: string,
  scheduleOnly = false,
): MedicineApplicationFormState {
  return {
    medicineId: medicineId ?? "",
    applicationDate: new Date().toISOString().slice(0, 10),
    notes: "",
    scheduleOnly,
    scheduleNext: false,
    nextScheduledDate: "",
    nextNotes: "",
  }
}

export async function saveMedicineApplication(input: {
  sheepId: string
  form: MedicineApplicationFormState
  analysisId?: string
  sheepLabel: string
}): Promise<{ successMessage: string }> {
  const { sheepId, form, analysisId, sheepLabel } = input
  if (!form.medicineId) throw new Error("Selecciona un medicamento")
  if (!form.applicationDate) throw new Error("Indica la fecha")

  const notes = form.notes.trim() || undefined

  if (form.scheduleOnly) {
    await createMedicineApplication({
      medicineId: form.medicineId,
      sheepId,
      analysisId,
      applicationDate: new Date(form.applicationDate),
      status: MedicineStatus.SCHEDULED,
      notes,
    })
    return { successMessage: `Aplicación programada para ${sheepLabel}.` }
  }

  await createMedicineApplication({
    medicineId: form.medicineId,
    sheepId,
    analysisId,
    applicationDate: new Date(form.applicationDate),
    status: MedicineStatus.APPLIED,
    notes,
  })

  if (form.scheduleNext && form.nextScheduledDate) {
    const nextNotes = form.nextNotes.trim() || undefined
    await createMedicineApplication({
      medicineId: form.medicineId,
      sheepId,
      applicationDate: new Date(form.nextScheduledDate),
      status: MedicineStatus.SCHEDULED,
      notes: nextNotes,
    })
    return {
      successMessage: `Aplicación registrada para ${sheepLabel}. Próxima dosis programada.`,
    }
  }

  return { successMessage: `Aplicación registrada para ${sheepLabel}.` }
}
