"use client"

import { useMemo, useState } from "react"
import { WeightProgressChart } from "@/components/ui/weight-progress-chart"
import { EmptyState } from "@/components/ui/empty-state"
import { Modal } from "@/components/ui/modal"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Field, TextInput } from "@/components/ui/form-fields"
import { calcDailyGain, weightHistory as seedWeights, type WeightRecord } from "@/lib/mock-data"
import { ScaleIcon, PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline"

const today = () => new Date().toISOString().split("T")[0]

/** Recompute ganancia for the full series, sorted ascending by fecha (§15.3). */
function withGains(records: WeightRecord[]): WeightRecord[] {
  const sorted = [...records].sort((a, b) => a.fecha.localeCompare(b.fecha))
  return sorted.map((r, i) =>
    i === 0
      ? { ...r, ganancia: null }
      : { ...r, ganancia: calcDailyGain(r.peso, r.fecha, sorted[i - 1].peso, sorted[i - 1].fecha) },
  )
}

export function SheepPesosTab() {
  const [records, setRecords] = useState<WeightRecord[]>(() => withGains(seedWeights))
  const [peso, setPeso] = useState("")
  const [fecha, setFecha] = useState(today())
  const [editing, setEditing] = useState<WeightRecord | null>(null)
  const [editPeso, setEditPeso] = useState("")
  const [editFecha, setEditFecha] = useState("")
  const [toDelete, setToDelete] = useState<WeightRecord | null>(null)

  // Show most recent first in the table.
  const rows = useMemo(() => [...records].sort((a, b) => b.fecha.localeCompare(a.fecha)), [records])
  const chartPoints = useMemo(() => records.map((w) => ({ date: w.fecha, weight: w.peso })), [records])

  function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    const value = Number.parseFloat(peso)
    if (!Number.isFinite(value) || value <= 0 || !fecha) return
    const next: WeightRecord = { id: `w-${Date.now()}`, fecha, peso: value, ganancia: null }
    setRecords((prev) => withGains([...prev, next]))
    setPeso("")
    setFecha(today())
  }

  function openEdit(record: WeightRecord) {
    setEditing(record)
    setEditPeso(String(record.peso))
    setEditFecha(record.fecha)
  }

  function handleEditSave(e: React.FormEvent) {
    e.preventDefault()
    const value = Number.parseFloat(editPeso)
    if (!editing || !Number.isFinite(value) || value <= 0 || !editFecha) return
    setRecords((prev) =>
      withGains(prev.map((r) => (r.id === editing.id ? { ...r, peso: value, fecha: editFecha } : r))),
    )
    setEditing(null)
  }

  function handleDelete() {
    if (!toDelete) return
    setRecords((prev) => withGains(prev.filter((r) => r.id !== toDelete.id)))
    setToDelete(null)
  }

  return (
    <div className="flex flex-col gap-4">
      <WeightProgressChart points={chartPoints} />

      {/* Inline register form */}
      <form onSubmit={handleRegister} className="rounded-lg bg-white p-4 shadow">
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
          <button
            type="submit"
            disabled={!peso || !fecha}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            Registrar peso
          </button>
          <p className="ml-auto self-center text-xs text-gray-400">
            Ganancia = promedio entre este pesaje y el anterior.
          </p>
        </div>
      </form>

      {/* History table */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        {rows.length === 0 ? (
          <EmptyState icon={ScaleIcon} title="Sin pesajes" description="No hay registros de peso aún." />
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {["Fecha", "Peso (kg)", "Ganancia prom. (g/día)", ""].map((h) => (
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
              {rows.map((w) => (
                <tr key={w.id}>
                  <td className="px-4 py-3 text-sm text-gray-900">{w.fecha}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{w.peso}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{w.ganancia ?? "—"}</td>
                  <td className="px-4 py-3 text-right text-sm">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(w)}
                        className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-indigo-600"
                        aria-label={`Editar pesaje del ${w.fecha}`}
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setToDelete(w)}
                        className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600"
                        aria-label={`Eliminar pesaje del ${w.fecha}`}
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

      {/* Edit modal */}
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
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Guardar
            </button>
          </>
        }
      >
        <form id="edit-peso-form" onSubmit={handleEditSave} className="flex flex-col gap-4">
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
        </form>
      </Modal>

      <ConfirmDialog
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        title="Eliminar registro de peso"
        message="¿Eliminar este registro de peso?"
      />
    </div>
  )
}
