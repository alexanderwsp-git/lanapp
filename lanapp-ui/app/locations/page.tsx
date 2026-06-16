"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { Modal } from "@/components/ui/modal"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { EmptyState } from "@/components/ui/empty-state"
import { Field, TextInput, Textarea } from "@/components/ui/form-fields"
import {
  createLocation,
  deleteLocation,
  fetchLocations,
  updateLocation,
} from "@/lib/api/location"
import type { ApiLocation } from "@/lib/api/types"
import { PlusIcon, MapPinIcon, PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline"

type FormState = {
  name: string
  address: string
  latitude: string
  longitude: string
  description: string
}

const emptyForm = (): FormState => ({
  name: "",
  address: "",
  latitude: "",
  longitude: "",
  description: "",
})

export default function LocationsPage() {
  const [rows, setRows] = useState<ApiLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [editing, setEditing] = useState<ApiLocation | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [toDelete, setToDelete] = useState<ApiLocation | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      setRows(await fetchLocations(200))
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "No se pudieron cargar las ubicaciones")
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function openNew() {
    setEditing(null)
    setForm(emptyForm())
    setFormOpen(true)
  }

  function openEdit(u: ApiLocation) {
    setEditing(u)
    setForm({
      name: u.name,
      address: u.address,
      latitude: u.latitude != null ? String(u.latitude) : "",
      longitude: u.longitude != null ? String(u.longitude) : "",
      description: u.description ?? "",
    })
    setFormOpen(true)
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        address: form.address.trim() || "—",
        description: form.description.trim() || undefined,
        latitude: form.latitude ? Number(form.latitude) : undefined,
        longitude: form.longitude ? Number(form.longitude) : undefined,
      }
      if (editing) {
        await updateLocation(editing.id, payload)
      } else {
        await createLocation(payload)
      }
      setFormOpen(false)
      await load()
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "No se pudo guardar")
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    if (!toDelete) return
    setDeleting(true)
    try {
      await deleteLocation(toDelete.id)
      setToDelete(null)
      await load()
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "No se pudo eliminar")
      setToDelete(null)
    } finally {
      setDeleting(false)
    }
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

      {loadError && (
        <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
          <button type="button" onClick={load} className="ml-2 font-semibold underline">
            Reintentar
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Cargando ubicaciones…</p>
      ) : rows.length === 0 ? (
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
                      {u.name}
                    </Link>
                    <p className="text-xs text-gray-500">{u.address}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(u)}
                    className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-indigo-600"
                    aria-label={`Editar ${u.name}`}
                  >
                    <PencilSquareIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setToDelete(u)}
                    className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    aria-label={`Eliminar ${u.name}`}
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <p className="mt-4 line-clamp-2 text-sm text-gray-600">{u.description || "Sin descripción."}</p>
              {(u.latitude != null || u.longitude != null) && (
                <p className="mt-3 text-xs text-gray-400">
                  Lat {u.latitude ?? "—"} · Lng {u.longitude ?? "—"}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

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
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </Field>
          <Field label="Dirección" htmlFor="direccion">
            <TextInput
              id="direccion"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Latitud" htmlFor="lat">
              <TextInput id="lat" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} />
            </Field>
            <Field label="Longitud" htmlFor="lng">
              <TextInput id="lng" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} />
            </Field>
          </div>
          <Field label="Descripción" htmlFor="desc">
            <Textarea id="desc" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
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
              {saving ? "Guardando…" : editing ? "Guardar" : "Crear"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar ubicación"
        message={`¿Eliminar "${toDelete?.name}"? Las ovejas asignadas quedarán sin ubicación.`}
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </DashboardLayout>
  )
}
