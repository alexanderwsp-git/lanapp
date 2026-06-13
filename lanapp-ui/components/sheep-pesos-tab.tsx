"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { WeightProgressChart } from "@/components/ui/weight-progress-chart"
import { EmptyState } from "@/components/ui/empty-state"
import { Modal } from "@/components/ui/modal"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Field, TextInput, Textarea } from "@/components/ui/form-fields"
import {
  createWeight,
  deleteWeight,
  fetchWeightsBySheep,
  updateWeight,
  type ApiWeight,
} from "@/lib/api/weight"
import { formatDisplayDate, dailyGainByWeightId, formatDailyGain, toDateInputValue } from "@/lib/format"
import { ScaleIcon, PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline"

const today = () => new Date().toISOString().split("T")[0]

type SheepPesosTabProps = {
  sheepId: string
}

export function SheepPesosTab({ sheepId }: SheepPesosTabProps) {
  const [records, setRecords] = useState<ApiWeight[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [peso, setPeso] = useState("")
  const [fecha, setFecha] = useState(today())
  const [notas, setNotas] = useState("")
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [editing, setEditing] = useState<ApiWeight | null>(null)
  const [editPeso, setEditPeso] = useState("")
  const [editFecha, setEditFecha] = useState("")
  const [editNotas, setEditNotas] = useState("")
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  const [toDelete, setToDelete] = useState<ApiWeight | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const data = await fetchWeightsBySheep(sheepId)
      setRecords(data)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "No se pudieron cargar los pesajes")
      setRecords([])
    } finally {
      setLoading(false)
    }
  }, [sheepId])

  useEffect(() => {
    load()
  }, [load])

  const chartPoints = useMemo(
    () =>
      records.map((w) => ({
        date: toDateInputValue(w.measurementDate),
        weight: Number(w.weight),
      })),
    [records],
  )

  const gainById = useMemo(() => dailyGainByWeightId(records), [records])

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    const value = Number.parseFloat(peso)
    if (!Number.isFinite(value) || value <= 0 || !fecha) {
      setFormError("Indica un peso válido y la fecha del pesaje")
      return
    }

    setSaving(true)
    try {
      const created = await createWeight({
        sheepId,
        weight: value,
        measurementDate: fecha,
        ...(notas.trim() ? { notes: notas.trim() } : {}),
      })
      setRecords((prev) =>
        [created, ...prev].sort(
          (a, b) =>
            new Date(b.measurementDate).getTime() - new Date(a.measurementDate).getTime(),
        ),
      )
      setPeso("")
      setFecha(today())
      setNotas("")
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "No se pudo registrar el peso")
    } finally {
      setSaving(false)
    }
  }

  function openEdit(record: ApiWeight) {
    setEditing(record)
    setEditPeso(String(record.weight))
    setEditFecha(toDateInputValue(record.measurementDate))
    setEditNotas(record.notes ?? "")
    setEditError(null)
  }

  async function handleEditSave(e: React.FormEvent) {
    e.preventDefault()
    setEditError(null)
    const value = Number.parseFloat(editPeso)
    if (!editing || !Number.isFinite(value) || value <= 0 || !editFecha) {
      setEditError("Indica un peso válido y la fecha del pesaje")
      return
    }

    setEditSaving(true)
    try {
      const updated = await updateWeight(editing.id, {
        weight: value,
        measurementDate: editFecha,
        notes: editNotas.trim() || undefined,
      })
      setRecords((prev) =>
        prev
          .map((r) => (r.id === editing.id ? updated : r))
          .sort(
            (a, b) =>
              new Date(b.measurementDate).getTime() - new Date(a.measurementDate).getTime(),
          ),
      )
      setEditing(null)
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "No se pudo actualizar el peso")
    } finally {
      setEditSaving(false)
    }
  }

  async function handleDelete() {
    if (!toDelete) return
    setDeleting(true)
    try {
      await deleteWeight(toDelete.id)
      setRecords((prev) => prev.filter((r) => r.id !== toDelete.id))
      setToDelete(null)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "No se pudo eliminar el peso")
      setToDelete(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <WeightProgressChart points={chartPoints} />

      <form onSubmit={handleRegister} className="rounded-lg bg-white p-4 shadow">
        {formError && (
          <div className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</div>
        )}
        <div className="flex flex-wrap items-end gap-4">
          <Field label="Peso (kg)" htmlFor="peso" required className="w-32">
            <TextInput
              id="peso"
              type="number"
              step="0.1"
              min="0.1"
              value={peso}
              onChange={(e) => setPeso(e.target.value)}
              placeholder="28.5"
            />
          </Field>
          <Field label="Fecha del pesaje" htmlFor="fecha" required className="w-48">
            <TextInput id="fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </Field>
          <Field label="Notas" htmlFor="notas" className="min-w-[12rem] flex-1">
            <TextInput
              id="notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Opcional"
            />
          </Field>
          <button
            type="submit"
            disabled={!peso || !fecha || saving}
            className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {saving && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            Registrar peso
          </button>
          <p className="ml-auto self-center text-xs text-gray-400">
            Ganancia = promedio entre este pesaje y el anterior.
          </p>
        </div>
      </form>

      {loadError && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
          <button type="button" onClick={load} className="ml-2 font-semibold underline">
            Reintentar
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-lg bg-white shadow">
        {loading ? (
          <p className="p-8 text-center text-sm text-gray-500">Cargando pesajes…</p>
        ) : records.length === 0 ? (
          <EmptyState icon={ScaleIcon} title="Sin pesajes" description="No hay registros de peso aún." />
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {["Fecha", "Peso (kg)", "Ganancia prom. (g/día)", "Notas", ""].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.map((w) => (
                <tr key={w.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                    {formatDisplayDate(w.measurementDate)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                    {Number(w.weight)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                    {formatDailyGain(gainById.get(w.id) ?? null)}
                  </td>
                  <td className="max-w-xs px-4 py-3 text-sm text-gray-700">
                    {w.notes?.trim() || "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-sm">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(w)}
                        className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-indigo-600"
                        aria-label={`Editar pesaje del ${toDateInputValue(w.measurementDate)}`}
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setToDelete(w)}
                        className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600"
                        aria-label={`Eliminar pesaje del ${toDateInputValue(w.measurementDate)}`}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title="Editar peso"
        footer={
          <>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="edit-peso-form"
              disabled={editSaving}
              className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {editSaving && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              )}
              Guardar
            </button>
          </>
        }
      >
        <form id="edit-peso-form" onSubmit={handleEditSave} className="flex flex-col gap-4">
          {editError && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{editError}</div>
          )}
          <Field label="Peso (kg)" htmlFor="edit-peso" required>
            <TextInput
              id="edit-peso"
              type="number"
              step="0.1"
              min="0.1"
              value={editPeso}
              onChange={(e) => setEditPeso(e.target.value)}
            />
          </Field>
          <Field label="Fecha del pesaje" htmlFor="edit-fecha" required>
            <TextInput
              id="edit-fecha"
              type="date"
              value={editFecha}
              onChange={(e) => setEditFecha(e.target.value)}
            />
          </Field>
          <Field label="Notas" htmlFor="edit-notas">
            <Textarea
              id="edit-notas"
              rows={2}
              value={editNotas}
              onChange={(e) => setEditNotas(e.target.value)}
              placeholder="Opcional"
            />
          </Field>
        </form>
      </Modal>

      <ConfirmDialog
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Eliminar registro de peso"
        message="¿Eliminar este registro de peso?"
      />
    </div>
  )
}
