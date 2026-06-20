"use client"

import { useEffect, useState } from "react"
import { Drawer } from "@/components/ui/drawer"
import { Field, TextInput, Textarea } from "@/components/ui/form-fields"
import { markApplicationApplied } from "@/lib/api/medicine"
import type { ApiMedicineApplication } from "@/lib/api/types"
import { toDateInputValue } from "@/lib/format"

type MedicineApplyDrawerProps = {
  open: boolean
  onClose: () => void
  application: ApiMedicineApplication | null
  medicineName: string
  sheepLabel: string
  onSaved: () => void
}

export function MedicineApplyDrawer({
  open,
  onClose,
  application,
  medicineName,
  sheepLabel,
  onSaved,
}: MedicineApplyDrawerProps) {
  const today = () => new Date().toISOString().slice(0, 10)
  const [appliedDate, setAppliedDate] = useState(today())
  const [scheduleNext, setScheduleNext] = useState(false)
  const [nextScheduledDate, setNextScheduledDate] = useState("")
  const [notes, setNotes] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!application || !open) return
    const scheduled = toDateInputValue(application.applicationDate)
    setAppliedDate(scheduled <= today() ? today() : scheduled)
    setScheduleNext(false)
    setNextScheduledDate("")
    setNotes(application.notes ?? "")
    setError(null)
  }, [application, open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!application) return
    if (scheduleNext && !nextScheduledDate) {
      setError("Indica la fecha de la próxima dosis")
      return
    }
    setSaving(true)
    setError(null)
    try {
      await markApplicationApplied(application, {
        appliedDate,
        nextScheduledDate: scheduleNext ? nextScheduledDate : undefined,
        notes,
      })
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar la aplicación")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Registrar aplicación"
      description={application ? `${medicineName} → ${sheepLabel}` : undefined}
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
            form="medicine-apply-form"
            disabled={saving}
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
      <form id="medicine-apply-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        <Field label="Fecha en que se aplicó" required htmlFor="apply-date">
          <TextInput
            id="apply-date"
            type="date"
            value={appliedDate}
            onChange={(e) => setAppliedDate(e.target.value)}
            required
          />
        </Field>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={scheduleNext}
            onChange={(e) => {
              const checked = e.target.checked
              setScheduleNext(checked)
              if (checked && !nextScheduledDate) {
                const d = new Date(appliedDate)
                d.setDate(d.getDate() + 7)
                setNextScheduledDate(d.toISOString().slice(0, 10))
              }
            }}
            className="rounded border-gray-300 text-indigo-600"
          />
          Programar próxima dosis
        </label>
        {scheduleNext && (
          <Field label="Fecha próxima dosis" required htmlFor="apply-next">
            <TextInput
              id="apply-next"
              type="date"
              value={nextScheduledDate}
              onChange={(e) => setNextScheduledDate(e.target.value)}
              required
            />
          </Field>
        )}
        <Field label="Notas" htmlFor="apply-notes">
          <Textarea
            id="apply-notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Opcional"
          />
        </Field>
      </form>
    </Drawer>
  )
}
