"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { Modal } from "@/components/ui/modal"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Field, TextInput, Select } from "@/components/ui/form-fields"
import {
  breedingData,
  BREEDING_RESULTS,
  statusColor,
  sheepData,
  type BreedingRecord,
} from "@/lib/mock-data"
import { PlusIcon, CalendarDaysIcon, TrashIcon, PencilSquareIcon } from "@heroicons/react/24/outline"

const hembras = sheepData.filter((s) => s.sexo === "Hembra")
const machos = sheepData.filter((s) => s.sexo === "Macho")

const emptyBreeding: BreedingRecord = {
  id: "",
  oveja: hembras[0] ? `${hembras[0].arete} ${hembras[0].nombre}` : "",
  carnero: machos[0] ? `${machos[0].arete} ${machos[0].nombre}` : "",
  fechaMonta: "",
  resultado: "Pendiente",
  vitasel: false,
}

export default function PlannerPage() {
  const [rows, setRows] = useState<BreedingRecord[]>(breedingData)
  const [form, setForm] = useState<BreedingRecord>(emptyBreeding)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<BreedingRecord | null>(null)
  const [toDelete, setToDelete] = useState<BreedingRecord | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  function openNew() {
    setEditing(null)
    setForm(emptyBreeding)
    setOpen(true)
  }
  function openEdit(b: BreedingRecord) {
    setEditing(b)
    setForm(b)
    setOpen(true)
  }
  function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setTimeout(() => {
      if (editing) {
        setRows((prev) => prev.map((r) => (r.id === editing.id ? { ...form, id: editing.id } : r)))
      } else {
        setRows((prev) => [{ ...form, id: `b-${Date.now()}` }, ...prev])
      }
      setSaving(false)
      setOpen(false)
    }, 700)
  }
  function confirmDelete() {
    if (!toDelete) return
    setDeleting(true)
    setTimeout(() => {
      setRows((prev) => prev.filter((r) => r.id !== toDelete.id))
      setDeleting(false)
      setToDelete(null)
    }, 700)
  }

  const ordered = [...rows].sort((a, b) => b.fechaMonta.localeCompare(a.fechaMonta))

  return (
    <DashboardLayout>
      <PageHeader
        title="Planificador de montas"
        description="Registro y seguimiento de montas del rebaño"
        action={
          <button
            onClick={openNew}
            className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            <PlusIcon className="h-5 w-5" aria-hidden="true" />
            Registrar monta
          </button>
        }
      />

      <div className="overflow-hidden rounded-lg bg-white shadow">
        {ordered.length === 0 ? (
          <EmptyState
            icon={CalendarDaysIcon}
            title="Sin montas registradas"
            description="Registra una monta para iniciar el seguimiento reproductivo."
            action={
              <button onClick={openNew} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
                Registrar monta
              </button>
            }
          />
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {["Oveja", "Carnero", "Fecha monta", "Vitasel", "Resultado", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ordered.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">{b.oveja}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{b.carnero}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{b.fechaMonta}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    {b.vitasel ? <StatusBadge color="green">Sí</StatusBadge> : <StatusBadge color="gray">No</StatusBadge>}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <StatusBadge color={statusColor[b.resultado]}>{b.resultado}</StatusBadge>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(b)}
                        className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-indigo-600"
                        aria-label="Editar monta"
                      >
                        <PencilSquareIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setToDelete(b)}
                        className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                        aria-label="Eliminar monta"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Breeding modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Editar monta" : "Registrar monta"}
        description="Vincula una oveja con un carnero y registra el resultado."
      >
        <form onSubmit={save} className="flex flex-col gap-4">
          <Field label="Oveja" required htmlFor="oveja">
            <Select id="oveja" value={form.oveja} onChange={(e) => setForm({ ...form, oveja: e.target.value })}>
              {hembras.map((s) => (
                <option key={s.id}>{`${s.arete} ${s.nombre}`}</option>
              ))}
            </Select>
          </Field>
          <Field label="Carnero" required htmlFor="carnero">
            <Select id="carnero" value={form.carnero} onChange={(e) => setForm({ ...form, carnero: e.target.value })}>
              {machos.map((s) => (
                <option key={s.id}>{`${s.arete} ${s.nombre}`}</option>
              ))}
            </Select>
          </Field>
          <Field label="Fecha de monta" required htmlFor="fecha">
            <TextInput id="fecha" type="date" value={form.fechaMonta} onChange={(e) => setForm({ ...form, fechaMonta: e.target.value })} required />
          </Field>
          <Field label="Resultado" htmlFor="resultado">
            <Select id="resultado" value={form.resultado} onChange={(e) => setForm({ ...form, resultado: e.target.value as BreedingRecord["resultado"] })}>
              {BREEDING_RESULTS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </Select>
          </Field>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.vitasel}
              onChange={(e) => setForm({ ...form, vitasel: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
            />
            Aplicó Vitasel
          </label>
          <div className="mt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {saving && (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              )}
              {editing ? "Guardar" : "Registrar"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar monta"
        message={`¿Eliminar el registro de monta de ${toDelete?.oveja}?`}
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </DashboardLayout>
  )
}
