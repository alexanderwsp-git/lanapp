"use client"

import { useEffect, useState } from "react"
import { Drawer } from "@/components/ui/drawer"
import { Field, Select, TextInput, Textarea } from "@/components/ui/form-fields"
import type { ApiMedicine } from "@/lib/api/types"
import { labelMedicineType } from "@/lib/labels/medicine"
import {
  emptyMedicineApplicationForm,
  saveMedicineApplication,
  type MedicineApplicationFormState,
} from "@/lib/medicine/application-form"

type MedicineScheduleDrawerProps = {
  open: boolean
  onClose: () => void
  sheepId: string
  sheepLabel: string
  medicines: ApiMedicine[]
  defaultMedicineId?: string
  defaultDate?: string
  analysisId?: string
  onSaved: (message: string) => void
}

export function MedicineScheduleDrawer({
  open,
  onClose,
  sheepId,
  sheepLabel,
  medicines,
  defaultMedicineId,
  defaultDate,
  analysisId,
  onSaved,
}: MedicineScheduleDrawerProps) {
  const today = () => new Date().toISOString().slice(0, 10)
  const [form, setForm] = useState<MedicineApplicationFormState>(
    emptyMedicineApplicationForm(defaultMedicineId, false),
  )
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm({
      ...emptyMedicineApplicationForm(defaultMedicineId ?? medicines[0]?.id, false),
      applicationDate: defaultDate ?? today(),
    })
    setError(null)
  }, [open, defaultMedicineId, defaultDate, medicines])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      if (form.scheduleNext && !form.nextScheduledDate) {
        throw new Error("Indica la fecha de la próxima dosis")
      }
      const { successMessage } = await saveMedicineApplication({
        sheepId,
        form: { ...form, scheduleOnly: false },
        analysisId,
        sheepLabel,
      })
      onSaved(successMessage)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la aplicación")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Nueva aplicación"
      description={sheepLabel}
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
            form="medicine-schedule-form"
            disabled={saving || medicines.length === 0}
            className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-60"
          >
            {saving && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            Confirmar aplicado
          </button>
        </>
      }
    >
      <form id="medicine-schedule-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        {medicines.length === 0 ? (
          <p className="text-sm text-gray-500">No hay medicamentos en el catálogo.</p>
        ) : (
          <>
            <Field label="Medicamento" required htmlFor="med-sched-med">
              <Select
                id="med-sched-med"
                value={form.medicineId}
                onChange={(e) => setForm((prev) => ({ ...prev, medicineId: e.target.value }))}
                required
              >
                {medicines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} — {labelMedicineType(m.type)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Fecha en que se aplicó" required htmlFor="med-sched-date">
              <TextInput
                id="med-sched-date"
                type="date"
                value={form.applicationDate}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, applicationDate: e.target.value }))
                }
                required
              />
            </Field>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.scheduleNext}
                onChange={(e) => {
                  const checked = e.target.checked
                  setForm((prev) => ({
                    ...prev,
                    scheduleNext: checked,
                    nextScheduledDate:
                      checked && !prev.nextScheduledDate
                        ? (() => {
                            const d = new Date(prev.applicationDate)
                            d.setDate(d.getDate() + 7)
                            return d.toISOString().slice(0, 10)
                          })()
                        : prev.nextScheduledDate,
                  }))
                }}
                className="rounded border-gray-300 text-indigo-600"
              />
              Programar próxima dosis
            </label>
            {form.scheduleNext && (
              <Field label="Fecha próxima dosis" required htmlFor="med-sched-next">
                <TextInput
                  id="med-sched-next"
                  type="date"
                  value={form.nextScheduledDate}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, nextScheduledDate: e.target.value }))
                  }
                  required
                />
              </Field>
            )}
            <Field label="Notas" htmlFor="med-sched-notes">
              <Textarea
                id="med-sched-notes"
                rows={2}
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Opcional"
              />
            </Field>
          </>
        )}
      </form>
    </Drawer>
  )
}
