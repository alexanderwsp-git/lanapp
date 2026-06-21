"use client"

import { useEffect, useState } from "react"
import { Drawer } from "@/components/ui/drawer"
import { Field, TextInput, Textarea } from "@/components/ui/form-fields"
import { bulkRecordWeaning } from "@/lib/api/weaning"

const today = () => new Date().toISOString().split("T")[0]

type WeaningRecordDrawerProps = {
  open: boolean
  onClose: () => void
  sheepId: string
  sheepLabel: string
  onSaved: () => void | Promise<void>
}

export function WeaningRecordDrawer({
  open,
  onClose,
  sheepId,
  sheepLabel,
  onSaved,
}: WeaningRecordDrawerProps) {
  const [date, setDate] = useState(today())
  const [weight, setWeight] = useState("")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setDate(today())
    setWeight("")
    setNotes("")
    setError(null)
  }, [open, sheepId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const w = Number(weight)
    if (!date) {
      setError("Indica la fecha de destete.")
      return
    }
    if (!Number.isFinite(w) || w <= 0) {
      setError("Indica un peso de destete válido.")
      return
    }
    setSaving(true)
    try {
      const result = await bulkRecordWeaning({
        weaningDate: date,
        records: [{ sheepId, weaningWeight: w, notes: notes.trim() || undefined }],
      })
      if (result.failed.length > 0) {
        setError(result.failed[0]?.error ?? "No se pudo registrar el destete.")
        return
      }
      await onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar el destete.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Registrar destete"
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
            form="weaning-record-form"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {saving && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            Confirmar destete
          </button>
        </>
      }
    >
      <form id="weaning-record-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <Field label="Fecha de destete" required htmlFor="weaning-date">
          <TextInput
            id="weaning-date"
            type="date"
            value={date}
            max={today()}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </Field>

        <Field label="Peso de destete (kg)" required htmlFor="weaning-weight">
          <TextInput
            id="weaning-weight"
            type="number"
            inputMode="decimal"
            step="0.1"
            min="0"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="0.0"
            required
          />
        </Field>

        <Field label="Notas" htmlFor="weaning-notes">
          <Textarea
            id="weaning-notes"
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
