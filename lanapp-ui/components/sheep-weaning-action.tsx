"use client"

import { useEffect, useState } from "react"
import { AcademicCapIcon, ScaleIcon } from "@heroicons/react/24/outline"
import { StatusBadge } from "@/components/ui/status-badge"
import {
  bulkRecordWeaning,
  fetchWeaningRecordsBySheep,
  type ApiWeaningRecord,
} from "@/lib/api/weaning"
import { formatDisplayDate } from "@/lib/format"

const today = () => new Date().toISOString().slice(0, 10)

/**
 * Acción de destete en el detalle de la oveja. Si ya está destetada muestra
 * el registro; si no, permite capturar fecha + peso y crea el registro
 * oficial reutilizando bulkRecordWeaning con un único animal.
 */
export function SheepWeaningAction({
  sheepId,
  onWeaned,
}: {
  sheepId: string
  onWeaned?: () => void | Promise<void>
}) {
  const [record, setRecord] = useState<ApiWeaningRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState(today())
  const [weight, setWeight] = useState("")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    let cancelled = false
    setLoading(true)
    fetchWeaningRecordsBySheep(sheepId)
      .then((records) => {
        if (!cancelled) setRecord(records[0] ?? null)
      })
      .catch(() => {
        if (!cancelled) setRecord(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }

  useEffect(load, [sheepId])

  async function submit() {
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
      setOpen(false)
      setWeight("")
      setNotes("")
      load()
      await onWeaned?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar el destete.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="h-9 w-28 animate-pulse rounded-md bg-gray-200" />
  }

  if (record) {
    return (
      <div className="flex items-center gap-2">
        <StatusBadge color="green">Destetada</StatusBadge>
        <span className="text-xs text-gray-500">
          {formatDisplayDate(record.weaningDate)} · {Number(record.weaningWeight)} kg
        </span>
      </div>
    )
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setDate(today())
          setOpen(true)
        }}
        className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
      >
        <AcademicCapIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        Destetar
      </button>
    )
  }

  return (
    <div className="w-full rounded-md border border-gray-200 bg-gray-50 p-4">
      <h4 className="text-sm font-semibold text-gray-900">Registrar destete</h4>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
          Fecha de destete
          <input
            type="date"
            value={date}
            max={today()}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-md border-0 py-2 px-3 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
          Peso de destete (kg)
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            min="0"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="0.0"
            className="w-32 rounded-md border-0 py-2 px-3 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
          />
        </label>
        <label className="flex min-w-[12rem] flex-1 flex-col gap-1 text-xs font-medium text-gray-600">
          Notas (opcional)
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="rounded-md border-0 py-2 px-3 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
          />
        </label>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
        >
          {saving ? "Guardando…" : "Confirmar destete"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false)
            setError(null)
          }}
          className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
