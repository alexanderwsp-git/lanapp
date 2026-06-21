"use client"

import { useEffect, useMemo, useState } from "react"
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline"
import { Drawer } from "@/components/ui/drawer"
import { Field, Select, TextInput, Textarea } from "@/components/ui/form-fields"
import { SwitchField } from "@/components/ui/switch"
import { AnalysisStatus, AnalysisType, type ApiAnalysis, type ApiAnalysisType } from "@/lib/analysis/types"
import type { ApiMedicine } from "@/lib/api/types"
import {
  defaultFollowUpNotes,
  defaultMedicineNotes,
  diagnosisFormFromAnalysis,
  emptyDiagnosisForm,
  FAMACHA_SCORES,
  famachaScoreButton,
  medsForType,
  saveAdHocAnalysisDiagnosis,
  saveAnalysisDiagnosis,
  saveAnalysisScheduleOnly,
  updateAnalysisDiagnosis,
  type DiagnosisFormState,
} from "@/lib/analysis/diagnosis-form"
import {
  analysisRecommendation,
  famachaDiagnosis,
  labelAnalysisType,
} from "@/lib/labels/analysis"
import { labelMedicineType } from "@/lib/labels/medicine"

type AnalysisDiagnosisDrawerProps = {
  open: boolean
  onClose: () => void
  record: ApiAnalysis | null
  sheepLabel: string
  meds: ApiMedicine[]
  onSaved: (message: string) => void
  /** Ad-hoc mode: required when record is null */
  sheepId?: string
  types?: ApiAnalysisType[]
}

function Separator() {
  return <hr className="border-gray-200" />
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-medium text-gray-800">{children}</p>
}

function drawerMeta(record: ApiAnalysis | null, isAdHoc: boolean, scheduleOnly: boolean) {
  if (isAdHoc && scheduleOnly) {
    return { title: "Programar análisis", submit: "Programar" }
  }
  if (isAdHoc) {
    return { title: "Registrar análisis", submit: "Guardar análisis" }
  }
  if (record?.status === AnalysisStatus.COMPLETED) {
    return { title: "Actualizar diagnóstico", submit: "Guardar cambios" }
  }
  if (record?.status === AnalysisStatus.SCHEDULED) {
    return { title: "Agregar diagnóstico", submit: "Guardar diagnóstico" }
  }
  return { title: "Registrar análisis", submit: "Guardar análisis" }
}

export function AnalysisDiagnosisDrawer({
  open,
  onClose,
  record,
  sheepLabel,
  meds,
  onSaved,
  sheepId,
  types = [],
}: AnalysisDiagnosisDrawerProps) {
  const isAdHoc = !record
  const [form, setForm] = useState<DiagnosisFormState>(emptyDiagnosisForm())
  const [adhocTypeId, setAdhocTypeId] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setError(null)
    if (record) {
      setForm(diagnosisFormFromAnalysis(record))
      setAdhocTypeId("")
      return
    }
    setForm(emptyDiagnosisForm())
    setAdhocTypeId(types[0]?.id ?? "")
  }, [record, open, types])

  const activeType = record?.analysisType ?? types.find((t) => t.id === adhocTypeId) ?? types[0] ?? null
  const isFamacha = activeType?.type === AnalysisType.FAMACHA
  const showCapture = !isAdHoc || !form.scheduleOnly

  const livePreview = useMemo<ApiAnalysis | null>(() => {
    if (!activeType || !showCapture) return null
    const base: ApiAnalysis = record ?? {
      id: "",
      analysisTypeId: activeType.id,
      sheepId: sheepId ?? "",
      scheduledDate: form.completedDate,
      status: "scheduled" as ApiAnalysis["status"],
      analysisType: activeType,
    }
    return {
      ...base,
      famachaScore: form.famachaScore,
      resultValue: form.resultValue,
      diagnosis: form.diagnosis,
    }
  }, [record, activeType, sheepId, form.famachaScore, form.resultValue, form.diagnosis, form.completedDate, showCapture])

  const liveRecommendation = livePreview ? analysisRecommendation(livePreview) : null
  const suggestedMeds = useMemo(
    () => medsForType(meds, liveRecommendation?.medicineType),
    [meds, liveRecommendation?.medicineType],
  )

  useEffect(() => {
    if (!liveRecommendation?.needsTreatment || form.suggestedMedicineTouched) return
    const first = suggestedMeds[0]?.id ?? ""
    if (first && form.suggestedMedicineId !== first) {
      setForm((prev) => (prev.suggestedMedicineTouched ? prev : { ...prev, suggestedMedicineId: first }))
    }
  }, [liveRecommendation?.needsTreatment, suggestedMeds, form.suggestedMedicineTouched, form.suggestedMedicineId])

  useEffect(() => {
    if (!form.scheduleTreatment || form.suggestedMedicineTouched) return
    const first = suggestedMeds[0]?.id ?? meds[0]?.id ?? ""
    if (first && form.suggestedMedicineId !== first) {
      setForm((prev) => ({ ...prev, suggestedMedicineId: first }))
    }
  }, [form.scheduleTreatment, suggestedMeds, meds, form.suggestedMedicineTouched, form.suggestedMedicineId])

  const typeLabel = activeType?.name ?? "Análisis"

  useEffect(() => {
    if (!form.scheduleTreatment || form.medicineNotesTouched) return
    const suggested = defaultMedicineNotes(typeLabel, form.diagnosis)
    setForm((prev) => (prev.medicineNotes === suggested ? prev : { ...prev, medicineNotes: suggested }))
  }, [form.scheduleTreatment, form.medicineNotesTouched, form.diagnosis, typeLabel])

  useEffect(() => {
    if (!form.scheduleFollowUp || form.followUpNotesTouched) return
    const suggested = defaultFollowUpNotes(typeLabel)
    setForm((prev) => (prev.followUpNotes === suggested ? prev : { ...prev, followUpNotes: suggested }))
  }, [form.scheduleFollowUp, form.followUpNotesTouched, typeLabel])

  function selectScore(score: number) {
    setForm((prev) => ({
      ...prev,
      famachaScore: score,
      diagnosis: prev.diagnosisTouched ? prev.diagnosis : famachaDiagnosis(score),
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      if (isAdHoc && form.scheduleOnly) {
        if (!sheepId) throw new Error("Falta identificador de oveja")
        const { successMessage } = await saveAnalysisScheduleOnly({
          sheepId,
          form: {
            typeId: adhocTypeId,
            scheduledDate: form.completedDate,
            notes: form.notes,
          },
          sheepLabel,
        })
        onSaved(successMessage)
      } else if (isAdHoc) {
        if (!sheepId) throw new Error("Falta identificador de oveja")
        const analysisType = types.find((t) => t.id === adhocTypeId)
        if (!analysisType) throw new Error("Selecciona un tipo de análisis")
        const { successMessage } = await saveAdHocAnalysisDiagnosis({
          sheepId,
          analysisType,
          form,
          meds,
          sheepLabel,
        })
        onSaved(successMessage)
      } else if (record.status === AnalysisStatus.COMPLETED) {
        const { successMessage } = await updateAnalysisDiagnosis({
          record,
          form,
          meds,
          sheepLabel,
        })
        onSaved(successMessage)
      } else {
        const { successMessage } = await saveAnalysisDiagnosis({
          record,
          form,
          meds,
          sheepLabel,
        })
        onSaved(successMessage)
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar")
    } finally {
      setSaving(false)
    }
  }

  const { title, submit } = drawerMeta(record, isAdHoc, form.scheduleOnly)

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={title}
      description={
        isAdHoc
          ? sheepLabel
          : record
            ? `${typeLabel} → ${sheepLabel}`
            : undefined
      }
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="analysis-diagnosis-form"
            disabled={saving || (isAdHoc && types.length === 0)}
            className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-60"
          >
            {saving && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            {submit}
          </button>
        </>
      }
    >
      <form id="analysis-diagnosis-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        {isAdHoc && types.length === 0 && (
          <p className="text-sm text-gray-500">No hay tipos de análisis configurados.</p>
        )}

        {(isAdHoc ? types.length > 0 : true) && (
          <>
            {isAdHoc && (
              <>
                <SwitchField
                  label="Programar para después"
                  description="Sin resultado ni diagnóstico — solo agenda el estudio"
                  checked={form.scheduleOnly}
                  onChange={(checked) => setForm({ ...form, scheduleOnly: checked })}
                  aria-label="Programar para después"
                />
                <Field label="Tipo de análisis" required htmlFor="diag-type">
                  <Select
                    id="diag-type"
                    value={adhocTypeId}
                    onChange={(e) => setAdhocTypeId(e.target.value)}
                    required
                  >
                    {types.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({labelAnalysisType(t.type)})
                      </option>
                    ))}
                  </Select>
                </Field>
              </>
            )}

            {form.scheduleOnly && isAdHoc ? (
              <>
                <Field label="Fecha programada" required htmlFor="diag-scheduled-date">
                  <TextInput
                    id="diag-scheduled-date"
                    type="date"
                    value={form.completedDate}
                    onChange={(e) => setForm({ ...form, completedDate: e.target.value })}
                    required
                  />
                </Field>
                <Field label="Notas" htmlFor="diag-schedule-notes">
                  <Textarea
                    id="diag-schedule-notes"
                    rows={3}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Motivo o recordatorio"
                  />
                </Field>
              </>
            ) : (
              <>
                <Separator />

                <div className="flex flex-col gap-3">
                  <SectionHeading>Captura del análisis</SectionHeading>

                  <Field
                    label={isAdHoc ? "Fecha del análisis" : "Fecha del análisis"}
                    required
                    htmlFor="diag-date"
                  >
                    <TextInput
                      id="diag-date"
                      type="date"
                      value={form.completedDate}
                      onChange={(e) => {
                        const completedDate = e.target.value
                        setForm((prev) => ({
                          ...prev,
                          completedDate,
                          treatmentDate: prev.treatmentDateTouched ? prev.treatmentDate : completedDate,
                        }))
                      }}
                      required
                    />
                  </Field>

                  {isFamacha ? (
                    <Field label="Puntaje FAMACHA (1–5)" required>
                      <div className="flex flex-wrap items-center gap-2">
                        {FAMACHA_SCORES.map((s) => {
                          const styles = famachaScoreButton[s]
                          const active = form.famachaScore === s
                          return (
                            <button
                              key={s}
                              type="button"
                              onClick={() => selectScore(s)}
                              aria-pressed={active}
                              className={`flex h-11 w-11 items-center justify-center rounded-md border text-sm font-semibold transition ${
                                active ? styles.active : `bg-white ${styles.idle}`
                              }`}
                            >
                              {s}
                            </button>
                          )
                        })}
                        <span className="self-center text-xs text-gray-400">1–2 anemia · 4–5 saludable</span>
                      </div>
                    </Field>
                  ) : (
                    <Field label="Resultado del análisis" required htmlFor="diag-value">
                      <TextInput
                        id="diag-value"
                        value={form.resultValue}
                        onChange={(e) => setForm({ ...form, resultValue: e.target.value })}
                        placeholder={
                          activeType?.defaultUnit
                            ? `Ej. 320 ${activeType.defaultUnit}`
                            : "Valor medido"
                        }
                        required
                      />
                    </Field>
                  )}

                  <Field label="Diagnóstico" htmlFor="diag-text">
                    <TextInput
                      id="diag-text"
                      value={form.diagnosis}
                      onChange={(e) =>
                        setForm({ ...form, diagnosis: e.target.value, diagnosisTouched: true })
                      }
                      placeholder="Interpretación del resultado"
                    />
                  </Field>

                  <Field label="Notas del análisis" htmlFor="diag-notes">
                    <Textarea
                      id="diag-notes"
                      rows={3}
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      placeholder="Observaciones de este estudio"
                    />
                  </Field>
                </div>

                <Separator />

                <SwitchField
                  label="Medicamento al guardar"
                  description="Programar o aplicar una dosis vinculada a este análisis"
                  checked={form.scheduleTreatment}
                  onChange={(checked) =>
                    setForm({
                      ...form,
                      scheduleTreatment: checked,
                      scheduleTreatmentTouched: true,
                    })
                  }
                  disabled={meds.length === 0}
                  aria-label="Medicamento al guardar"
                />

                {form.scheduleTreatment && (
                  <div className="flex flex-col gap-3">
                    {liveRecommendation?.needsTreatment && (
                      <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                        <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                        <p>{liveRecommendation.message}</p>
                      </div>
                    )}

                    {meds.length === 0 ? (
                      <p className="text-xs text-gray-500">
                        No hay medicamentos en el catálogo. Podrás programarlo en Medicina.
                      </p>
                    ) : (
                      <>
                        <SwitchField
                          label="Aplicar ahora"
                          description="Registra la dosis como aplicada en la fecha del análisis"
                          checked={form.applyTreatmentNow}
                          onChange={(checked) => setForm({ ...form, applyTreatmentNow: checked })}
                          aria-label="Aplicar medicamento ahora"
                        />
                        {!form.applyTreatmentNow && (
                          <Field label="Fecha programada" required htmlFor="diag-treatment-date">
                            <TextInput
                              id="diag-treatment-date"
                              type="date"
                              value={form.treatmentDate}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  treatmentDate: e.target.value,
                                  treatmentDateTouched: true,
                                })
                              }
                              required
                            />
                          </Field>
                        )}
                        <Field label="Medicamento" htmlFor="diag-suggested-med">
                          <Select
                            id="diag-suggested-med"
                            value={form.suggestedMedicineId}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                suggestedMedicineId: e.target.value,
                                suggestedMedicineTouched: true,
                              })
                            }
                          >
                            <option value="">Seleccionar medicamento</option>
                            {meds.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name} — {labelMedicineType(m.type)}
                              </option>
                            ))}
                          </Select>
                        </Field>
                        <Field label="Notas de la aplicación" htmlFor="diag-medicine-notes">
                          <Textarea
                            id="diag-medicine-notes"
                            rows={2}
                            value={form.medicineNotes}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                medicineNotes: e.target.value,
                                medicineNotesTouched: true,
                              })
                            }
                            placeholder="Observaciones de esta dosis"
                          />
                        </Field>
                      </>
                    )}
                  </div>
                )}

                <Separator />

                <SwitchField
                  label={`Programar seguimiento (${typeLabel})`}
                  description="Crea un nuevo análisis programado"
                  checked={form.scheduleFollowUp}
                  onChange={(checked) => setForm({ ...form, scheduleFollowUp: checked })}
                  aria-label="Programar seguimiento"
                />

                {form.scheduleFollowUp && (
                  <div className="flex flex-col gap-3">
                    <Field label="Fecha del seguimiento" htmlFor="diag-followup">
                      <TextInput
                        id="diag-followup"
                        type="date"
                        value={form.followUpDate}
                        onChange={(e) => setForm({ ...form, followUpDate: e.target.value })}
                        required
                      />
                    </Field>
                    <Field label="Notas del seguimiento" htmlFor="diag-followup-notes">
                      <Textarea
                        id="diag-followup-notes"
                        rows={2}
                        value={form.followUpNotes}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            followUpNotes: e.target.value,
                            followUpNotesTouched: true,
                          })
                        }
                        placeholder="Motivo o recordatorio del próximo estudio"
                      />
                    </Field>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </form>
    </Drawer>
  )
}
