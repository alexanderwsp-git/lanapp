import { MedicineStatus } from "@sheep/domain"
import { AnalysisStatus, AnalysisType, type ApiAnalysis, type ApiAnalysisType } from "@/lib/analysis/types"
import { createAnalysis, markAnalysisCompleted, updateAnalysis } from "@/lib/api/analysis"
import { createMedicineApplication } from "@/lib/api/medicine"
import type { ApiMedicine } from "@/lib/api/types"
import { toDateInputValue } from "@/lib/format"

export const FAMACHA_SCORES = [1, 2, 3, 4, 5] as const

export const famachaScoreButton: Record<number, { active: string; idle: string }> = {
  1: { active: "border-red-500 bg-red-600 text-white", idle: "border-red-200 text-red-700 hover:bg-red-50" },
  2: { active: "border-red-400 bg-red-500 text-white", idle: "border-red-200 text-red-700 hover:bg-red-50" },
  3: { active: "border-yellow-400 bg-yellow-400 text-yellow-900", idle: "border-yellow-200 text-yellow-700 hover:bg-yellow-50" },
  4: { active: "border-green-400 bg-green-500 text-white", idle: "border-green-200 text-green-700 hover:bg-green-50" },
  5: { active: "border-green-500 bg-green-600 text-white", idle: "border-green-200 text-green-700 hover:bg-green-50" },
}

export type DiagnosisFormState = {
  completedDate: string
  famachaScore: number | null
  resultValue: string
  diagnosis: string
  diagnosisTouched: boolean
  notes: string
  suggestedMedicineId: string
  suggestedMedicineTouched: boolean
  scheduleTreatment: boolean
  scheduleTreatmentTouched: boolean
  applyTreatmentNow: boolean
  scheduleFollowUp: boolean
  followUpDate: string
  scheduleOnly: boolean
}

export function emptyDiagnosisForm(completedDate?: string): DiagnosisFormState {
  const d = completedDate ?? new Date().toISOString().slice(0, 10)
  const followUp = new Date(`${d}T00:00:00.000Z`)
  followUp.setUTCDate(followUp.getUTCDate() + 30)
  return {
    completedDate: d,
    famachaScore: null,
    resultValue: "",
    diagnosis: "",
    diagnosisTouched: false,
    notes: "",
    suggestedMedicineId: "",
    suggestedMedicineTouched: false,
    scheduleTreatment: false,
    scheduleTreatmentTouched: false,
    applyTreatmentNow: false,
    scheduleFollowUp: false,
    followUpDate: followUp.toISOString().slice(0, 10),
    scheduleOnly: false,
  }
}

export function diagnosisFormFromAnalysis(record: ApiAnalysis): DiagnosisFormState {
  const baseDate = record.completedDate ?? record.scheduledDate
  const scheduled = toDateInputValue(baseDate)
  const today = new Date().toISOString().slice(0, 10)
  const defaultDate =
    record.status === AnalysisStatus.COMPLETED
      ? scheduled
      : scheduled <= today
        ? today
        : scheduled
  return {
    ...emptyDiagnosisForm(defaultDate),
    famachaScore: record.famachaScore ?? null,
    resultValue: record.resultValue ?? "",
    diagnosis: record.diagnosis ?? "",
    diagnosisTouched: !!record.diagnosis,
    notes: record.notes ?? "",
  }
}

export function treatmentNotes(typeName: string, diagnosis: string | null | undefined): string {
  const dx = diagnosis?.trim()
  return dx ? `Desde análisis: ${typeName} — ${dx}` : `Desde análisis: ${typeName}`
}

export function medsForType(meds: ApiMedicine[], medicineType?: string): ApiMedicine[] {
  if (!medicineType) return []
  const ofType = meds.filter((m) => m.type === medicineType)
  return ofType.length > 0 ? ofType : meds
}

export type SaveDiagnosisInput = {
  record: ApiAnalysis
  form: DiagnosisFormState
  meds: ApiMedicine[]
  sheepLabel: string
}

export type SaveDiagnosisResult = {
  successMessage: string
}

function validateCaptureFields(record: ApiAnalysis, form: DiagnosisFormState): void {
  const isFamacha = record.analysisType?.type === AnalysisType.FAMACHA
  if (isFamacha && form.famachaScore == null) {
    throw new Error("Selecciona el puntaje FAMACHA")
  }
  if (!isFamacha && !form.resultValue.trim()) {
    throw new Error("Ingresa el valor del análisis")
  }
}

function capturePayload(record: ApiAnalysis, form: DiagnosisFormState) {
  const isFamacha = record.analysisType?.type === AnalysisType.FAMACHA
  return {
    completedDate: form.completedDate,
    famachaScore: isFamacha ? form.famachaScore : null,
    resultValue: isFamacha ? String(form.famachaScore) : form.resultValue.trim(),
    diagnosis: form.diagnosis.trim() || null,
    notes: form.notes.trim() || null,
  }
}

async function appendMedicineAndFollowUp(
  saved: ApiAnalysis,
  record: ApiAnalysis,
  form: DiagnosisFormState,
  meds: ApiMedicine[],
  typeNameLabel: string,
  sheepLabel: string,
  baseMessage: string,
): Promise<string> {
  let successMsg = baseMessage

  if (form.scheduleTreatment && form.suggestedMedicineId) {
    const chosenMed = meds.find((m) => m.id === form.suggestedMedicineId)
    const applied = form.applyTreatmentNow
    await createMedicineApplication({
      medicineId: form.suggestedMedicineId,
      sheepId: saved.sheepId,
      analysisId: saved.id,
      applicationDate: new Date(form.completedDate),
      status: applied ? MedicineStatus.APPLIED : MedicineStatus.SCHEDULED,
      notes: treatmentNotes(typeNameLabel, form.diagnosis),
    })
    if (applied) {
      successMsg = `${baseMessage} Medicamento aplicado para ${sheepLabel}${
        chosenMed ? ` (${chosenMed.name})` : ""
      }.`
    } else {
      successMsg = `${baseMessage} Medicamento programado para ${sheepLabel}${
        chosenMed ? ` (${chosenMed.name})` : ""
      }.`
    }
  }

  if (form.scheduleFollowUp && form.followUpDate) {
    await createAnalysis({
      analysisTypeId: record.analysisTypeId,
      sheepId: record.sheepId,
      scheduledDate: form.followUpDate,
      notes: `Seguimiento de ${typeNameLabel}`,
    })
    successMsg += ` Seguimiento programado para ${form.followUpDate}.`
  }

  return successMsg
}

export async function saveAnalysisDiagnosis(input: SaveDiagnosisInput): Promise<SaveDiagnosisResult> {
  const { record, form, meds, sheepLabel } = input
  const typeNameLabel = record.analysisType?.name ?? "Análisis"

  validateCaptureFields(record, form)

  const saved = await markAnalysisCompleted(record, capturePayload(record, form))

  const successMessage = await appendMedicineAndFollowUp(
    saved,
    record,
    form,
    meds,
    typeNameLabel,
    sheepLabel,
    `Análisis registrado para ${sheepLabel}.`,
  )

  return { successMessage }
}

export async function updateAnalysisDiagnosis(input: SaveDiagnosisInput): Promise<SaveDiagnosisResult> {
  const { record, form, meds, sheepLabel } = input
  const typeNameLabel = record.analysisType?.name ?? "Análisis"

  validateCaptureFields(record, form)

  const saved = await updateAnalysis(record.id, capturePayload(record, form))

  const successMessage = await appendMedicineAndFollowUp(
    saved,
    record,
    form,
    meds,
    typeNameLabel,
    sheepLabel,
    `Diagnóstico actualizado para ${sheepLabel}.`,
  )

  return { successMessage }
}

export type ScheduleOnlyFormState = {
  typeId: string
  scheduledDate: string
  notes: string
}

export function emptyScheduleOnlyForm(typeId?: string): ScheduleOnlyFormState {
  return {
    typeId: typeId ?? "",
    scheduledDate: new Date().toISOString().slice(0, 10),
    notes: "",
  }
}

export async function saveAnalysisScheduleOnly(input: {
  sheepId: string
  form: ScheduleOnlyFormState
  sheepLabel: string
}): Promise<SaveDiagnosisResult> {
  const { sheepId, form, sheepLabel } = input
  if (!form.typeId) throw new Error("Selecciona un tipo de análisis")
  if (!form.scheduledDate) throw new Error("Indica la fecha programada")
  await createAnalysis({
    analysisTypeId: form.typeId,
    sheepId,
    scheduledDate: form.scheduledDate,
    notes: form.notes.trim() || undefined,
  })
  return { successMessage: `Análisis programado para ${sheepLabel}.` }
}

export async function saveAdHocAnalysisDiagnosis(input: {
  sheepId: string
  analysisType: ApiAnalysisType
  form: DiagnosisFormState
  meds: ApiMedicine[]
  sheepLabel: string
}): Promise<SaveDiagnosisResult> {
  const { sheepId, analysisType, form, meds, sheepLabel } = input
  const created = await createAnalysis({
    analysisTypeId: analysisType.id,
    sheepId,
    scheduledDate: form.completedDate,
    notes: form.notes.trim() || undefined,
  })
  const record: ApiAnalysis = { ...created, analysisType }
  return saveAnalysisDiagnosis({ record, form, meds, sheepLabel })
}
