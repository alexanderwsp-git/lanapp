"use client"

import { useEffect, useState } from "react"
import { Drawer } from "@/components/ui/drawer"
import { Field, Select, TextInput, Textarea } from "@/components/ui/form-fields"
import type { ApiAnalysisType } from "@/lib/analysis/types"
import { createAnalysis } from "@/lib/api/analysis"
import { labelAnalysisType } from "@/lib/labels/analysis"

type AnalysisScheduleDrawerProps = {
  open: boolean
  onClose: () => void
  sheepId: string
  sheepLabel: string
  types: ApiAnalysisType[]
  defaultTypeId?: string
  onSaved: () => void
}

export function AnalysisScheduleDrawer({
  open,
  onClose,
  sheepId,
  sheepLabel,
  types,
  defaultTypeId,
  onSaved,
}: AnalysisScheduleDrawerProps) {
  const today = () => new Date().toISOString().slice(0, 10)
  const [typeId, setTypeId] = useState(defaultTypeId ?? types[0]?.id ?? "")
  const [scheduledDate, setScheduledDate] = useState(today())
  const [notes, setNotes] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setTypeId(defaultTypeId ?? types[0]?.id ?? "")
    setScheduledDate(today())
    setNotes("")
    setError(null)
  }, [open, defaultTypeId, types])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!typeId) return setError("Selecciona un tipo de análisis")
    if (!scheduledDate) return setError("Indica la fecha")
    setSaving(true)
    setError(null)
    try {
      await createAnalysis({
        analysisTypeId: typeId,
        sheepId,
        scheduledDate,
        notes: notes.trim() || undefined,
      })
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo programar el análisis")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Programar análisis"
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
            form="analysis-schedule-form"
            disabled={saving || types.length === 0}
            className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {saving && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            Programar
          </button>
        </>
      }
    >
      <form id="analysis-schedule-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        {types.length === 0 ? (
          <p className="text-sm text-gray-500">No hay tipos de análisis configurados.</p>
        ) : (
          <>
            <Field label="Tipo de análisis" required htmlFor="sched-type">
              <Select id="sched-type" value={typeId} onChange={(e) => setTypeId(e.target.value)} required>
                {types.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({labelAnalysisType(t.type)})
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Fecha programada" required htmlFor="sched-date">
              <TextInput
                id="sched-date"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                required
              />
            </Field>
            <Field label="Notas" htmlFor="sched-notes">
              <Textarea
                id="sched-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Opcional"
              />
            </Field>
          </>
        )}
      </form>
    </Drawer>
  )
}
