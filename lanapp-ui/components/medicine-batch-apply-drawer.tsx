"use client"

import { useEffect, useMemo, useState } from "react"
import { Drawer } from "@/components/ui/drawer"
import { Field, Select, TextInput } from "@/components/ui/form-fields"
import { markApplicationApplied } from "@/lib/api/medicine"
import type { ApiMedicine, ApiMedicineApplication, ApiSheep } from "@/lib/api/types"
import { toDateInputValue } from "@/lib/format"

export type BatchApplyEntry = {
  selected: boolean
  notes: string
  scheduleNext: boolean
  nextScheduledDate: string
}

type MedicineBatchApplyDrawerProps = {
  open: boolean
  onClose: () => void
  applications: ApiMedicineApplication[]
  sheepById: Map<string, ApiSheep>
  medById: Map<string, ApiMedicine>
  onSaved: (savedCount: number) => void
}

const today = () => new Date().toISOString().slice(0, 10)

function emptyEntry(): BatchApplyEntry {
  return { selected: true, notes: "", scheduleNext: false, nextScheduledDate: "" }
}

function sheepTag(sheepId: string, sheepById: Map<string, ApiSheep>): string {
  const s = sheepById.get(sheepId)
  return s ? (s.name ? `${s.tag} (${s.name})` : s.tag) : sheepId.slice(0, 8)
}

export function MedicineBatchApplyDrawer({
  open,
  onClose,
  applications,
  sheepById,
  medById,
  onSaved,
}: MedicineBatchApplyDrawerProps) {
  const [batchMedicineId, setBatchMedicineId] = useState("")
  const [batchDate, setBatchDate] = useState(today())
  const [batchEntries, setBatchEntries] = useState<Record<string, BatchApplyEntry>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedCount, setSavedCount] = useState<number | null>(null)

  const medicineOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string; count: number }>()
    for (const app of applications) {
      const med = medById.get(app.medicineId)
      if (!med) continue
      const existing = map.get(med.id)
      if (existing) existing.count++
      else map.set(med.id, { id: med.id, name: med.name, count: 1 })
    }
    return Array.from(map.values())
  }, [applications, medById])

  const batchRows = useMemo(
    () => applications.filter((a) => a.medicineId === batchMedicineId),
    [applications, batchMedicineId],
  )

  const selectedCount = useMemo(() => {
    return batchRows.reduce((n, app) => {
      const entry = batchEntries[app.id]
      return entry?.selected !== false ? n + 1 : n
    }, 0)
  }, [batchRows, batchEntries])

  useEffect(() => {
    if (!open) return
    const first = medicineOptions[0]?.id ?? ""
    setBatchMedicineId(first)
    setBatchDate(today())
    setBatchEntries({})
    setError(null)
    setSavedCount(null)
  }, [open, medicineOptions])

  useEffect(() => {
    if (!open || !batchMedicineId) return
    setBatchEntries((prev) => {
      const next = { ...prev }
      for (const app of batchRows) {
        if (!next[app.id]) next[app.id] = emptyEntry()
      }
      return next
    })
  }, [open, batchMedicineId, batchRows])

  function setEntry(appId: string, patch: Partial<BatchApplyEntry>) {
    setBatchEntries((prev) => ({
      ...prev,
      [appId]: { ...(prev[appId] ?? emptyEntry()), ...patch },
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSavedCount(null)
    if (!batchMedicineId) return setError("Selecciona un medicamento")
    if (!batchDate) return setError("Indica la fecha de aplicación")

    const toSave = batchRows.filter((app) => batchEntries[app.id]?.selected !== false)
    if (toSave.length === 0) return setError("Selecciona al menos una aplicación para confirmar")

    for (const app of toSave) {
      const entry = batchEntries[app.id] ?? emptyEntry()
      if (entry.scheduleNext && !entry.nextScheduledDate) {
        return setError(`Indica la fecha de próxima dosis para ${sheepTag(app.sheepId, sheepById)}`)
      }
    }

    setSaving(true)
    try {
      let saved = 0
      for (const app of toSave) {
        const entry = batchEntries[app.id] ?? emptyEntry()
        await markApplicationApplied(app, {
          appliedDate: batchDate,
          nextScheduledDate: entry.scheduleNext ? entry.nextScheduledDate : undefined,
          notes: entry.notes.trim() || app.notes || undefined,
        })
        saved++
      }
      setSavedCount(saved)
      onSaved(saved)
      setBatchEntries({})
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron registrar las aplicaciones")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Registrar aplicaciones"
      description="Confirma las aplicaciones programadas pendientes."
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cerrar
          </button>
          <button
            type="submit"
            form="medicine-batch-apply-form"
            disabled={saving || selectedCount === 0 || medicineOptions.length === 0}
            className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-60"
          >
            {saving && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            Confirmar {selectedCount > 0 ? `(${selectedCount})` : ""}
          </button>
        </>
      }
    >
      <form id="medicine-batch-apply-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        {savedCount != null && (
          <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
            {savedCount} aplicación(es) registrada(s).
          </div>
        )}

        {medicineOptions.length === 0 ? (
          <p className="rounded-md border border-gray-200 bg-gray-50 px-3 py-4 text-center text-sm text-gray-500">
            No hay aplicaciones programadas pendientes.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Medicamento" htmlFor="batch-apply-med">
                <Select
                  id="batch-apply-med"
                  value={batchMedicineId}
                  onChange={(e) => {
                    setBatchMedicineId(e.target.value)
                    setBatchEntries({})
                    setSavedCount(null)
                  }}
                >
                  {medicineOptions.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.count})
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Fecha de aplicación" required htmlFor="batch-apply-date">
                <TextInput
                  id="batch-apply-date"
                  type="date"
                  value={batchDate}
                  onChange={(e) => setBatchDate(e.target.value)}
                  required
                />
              </Field>
            </div>

            <div>
              <p className="mb-1.5 text-sm font-medium text-gray-700">
                Ovejas pendientes ({batchRows.length})
              </p>
              <div className="flex flex-col divide-y divide-gray-100 overflow-hidden rounded-md border border-gray-200">
                {batchRows.length === 0 ? (
                  <p className="px-3 py-4 text-center text-sm text-gray-500">
                    Sin aplicaciones pendientes de este medicamento.
                  </p>
                ) : (
                  batchRows.map((app) => {
                    const entry = batchEntries[app.id] ?? emptyEntry()
                    const scheduled = toDateInputValue(app.applicationDate)
                    return (
                      <div key={app.id} className="flex flex-col gap-2 px-3 py-3">
                        <div className="flex items-start justify-between gap-2">
                          <label className="flex min-w-0 flex-1 items-start gap-2">
                            <input
                              type="checkbox"
                              checked={entry.selected}
                              onChange={(e) => setEntry(app.id, { selected: e.target.checked })}
                              className="mt-1 rounded border-gray-300"
                            />
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-medium text-gray-900">
                                {sheepTag(app.sheepId, sheepById)}
                              </span>
                              <span className="block text-xs text-gray-500">
                                Programada: {scheduled}
                              </span>
                            </span>
                          </label>
                        </div>
                        <Field label="Notas" htmlFor={`batch-notes-${app.id}`}>
                          <TextInput
                            id={`batch-notes-${app.id}`}
                            value={entry.notes}
                            onChange={(e) => setEntry(app.id, { notes: e.target.value })}
                            placeholder="Opcional"
                          />
                        </Field>
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={entry.scheduleNext}
                            onChange={(e) => {
                              const checked = e.target.checked
                              setEntry(app.id, {
                                scheduleNext: checked,
                                nextScheduledDate:
                                  checked && !entry.nextScheduledDate
                                    ? (() => {
                                        const d = new Date(batchDate)
                                        d.setDate(d.getDate() + 7)
                                        return d.toISOString().slice(0, 10)
                                      })()
                                    : entry.nextScheduledDate,
                              })
                            }}
                            className="rounded border-gray-300 text-indigo-600"
                          />
                          Programar próxima dosis
                        </label>
                        {entry.scheduleNext && (
                          <Field label="Fecha próxima dosis" htmlFor={`batch-next-${app.id}`}>
                            <TextInput
                              id={`batch-next-${app.id}`}
                              type="date"
                              value={entry.nextScheduledDate}
                              onChange={(e) =>
                                setEntry(app.id, { nextScheduledDate: e.target.value })
                              }
                              required
                            />
                          </Field>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </>
        )}
      </form>
    </Drawer>
  )
}
