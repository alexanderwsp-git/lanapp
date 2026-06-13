"use client"

import { useState } from "react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { Modal } from "@/components/ui/modal"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { EmptyState } from "@/components/ui/empty-state"
import { Field, TextInput, Textarea } from "@/components/ui/form-fields"
import { ubicacionesData, type Ubicacion } from "@/lib/mock-data"
import { PlusIcon, MapPinIcon, PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline"

const empty = { id: "", nombre: "", direccion: "", latitud: "", longitud: "", descripcion: "" }

export default function LocationsPage() {
  const [rows, setRows] = useState<Ubicacion[]>(ubicacionesData)
  const [editing, setEditing] = useState<Ubicacion | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [toDelete, setToDelete] = useState<Ubicacion | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [form, setForm] = useState<Ubicacion>(empty)
  const [saving, setSaving] = useState(false)

  function openNew() {
    setEditing(null)
    setForm(empty)
    setFormOpen(true)
  }
  function openEdit(u: Ubicacion) {
    setEditing(u)
    setForm(u)
    setFormOpen(true)
  }
  function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setTimeout(() => {
      if (editing) {
        setRows((prev) => prev.map((r) => (r.id === editing.id ? { ...form, id: editing.id } : r)))
      } else {
        setRows((prev) => [...prev, { ...form, id: `loc-${Date.now()}` }])
      }
      setSaving(false)
      setFormOpen(false)
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

  return (
    <DashboardLayout>
      <PageHeader
        title="Ubicaciones"
        description="Potreros y áreas de manejo de la granja"
        action={
          <button
            onClick={openNew}
            className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            <PlusIcon className="h-5 w-5" aria-hidden="true" />
            Nueva ubicación
          </button>
        }
      />

      {rows.length === 0 ? (
        <div className="rounded-lg bg-white shadow">
          <EmptyState
            icon={MapPinIcon}
            title="Sin ubicaciones"
            description="Agrega potreros para asignar ovejas a cada área."
            action={
              <button
                onClick={openNew}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
              >
                Nueva ubicación
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((u) => (
            <div key={u.id} className="flex flex-col rounded-lg bg-white p-5 shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
                    <MapPinIcon className="h-5 w-5 text-indigo-600" aria-hidden="true" />
                  </div>
                  <div>
                    <Link href={`/locations/${u.id}`} className="text-sm font-semibold text-gray-900 hover:text-indigo-600">
                      {u.nombre}
                    </Link>
                    <p className="text-xs text-gray-500">{u.direccion}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(u)}
                    className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-indigo-600"
                    aria-label={`Editar ${u.nombre}`}
                  >
                    <PencilSquareIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setToDelete(u)}
                    className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    aria-label={`Eliminar ${u.nombre}`}
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <p className="mt-4 line-clamp-2 text-sm text-gray-600">{u.descripcion || "Sin descripción."}</p>
              <p className="mt-3 text-xs text-gray-400">
                Lat {u.latitud} · Lng {u.longitud}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Create / edit modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Editar ubicación" : "Nueva ubicación"}
        description="Define el potrero o área de manejo."
      >
        <form onSubmit={save} className="flex flex-col gap-4">
          <Field label="Nombre" required htmlFor="nombre">
            <TextInput
              id="nombre"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              required
            />
          </Field>
          <Field label="Dirección" htmlFor="direccion">
            <TextInput id="direccion" value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Latitud" htmlFor="lat">
              <TextInput id="lat" value={form.latitud} onChange={(e) => setForm({ ...form, latitud: e.target.value })} />
            </Field>
            <Field label="Longitud" htmlFor="lng">
              <TextInput id="lng" value={form.longitud} onChange={(e) => setForm({ ...form, longitud: e.target.value })} />
            </Field>
          </div>
          <Field label="Descripción" htmlFor="desc">
            <Textarea id="desc" rows={3} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
          </Field>
          <div className="mt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
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
              {editing ? "Guardar" : "Crear"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar ubicación"
        message={`¿Eliminar "${toDelete?.nombre}"? Las ovejas asignadas quedarán sin ubicación.`}
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </DashboardLayout>
  )
}
