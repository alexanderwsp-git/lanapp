"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { Drawer } from "@/components/ui/drawer"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { EmptyState } from "@/components/ui/empty-state"
import { Field, TextInput, Textarea } from "@/components/ui/form-fields"
import { BREEDS } from "@/lib/mock-data"
import { PlusIcon, PencilSquareIcon, TrashIcon, TagIcon } from "@heroicons/react/24/outline"

const labelClass = "block text-sm font-medium text-gray-700"
const fieldClass =
  "mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"

type Raza = { id: string; nombre: string; notas: string }

const initialRazas: Raza[] = BREEDS.slice(0, 6).map((b, i) => ({
  id: `raza-${i}`,
  nombre: b,
  notas: "",
}))

const emptyRaza: Raza = { id: "", nombre: "", notas: "" }

export default function SettingsPage() {
  const [razas, setRazas] = useState<Raza[]>(initialRazas)
  const [editing, setEditing] = useState<Raza | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [form, setForm] = useState<Raza>(emptyRaza)
  const [saving, setSaving] = useState(false)
  const [toDelete, setToDelete] = useState<Raza | null>(null)
  const [deleting, setDeleting] = useState(false)

  function openNew() {
    setEditing(null)
    setForm(emptyRaza)
    setDrawerOpen(true)
  }
  function openEdit(r: Raza) {
    setEditing(r)
    setForm(r)
    setDrawerOpen(true)
  }
  function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setTimeout(() => {
      if (editing) {
        setRazas((prev) => prev.map((x) => (x.id === editing.id ? { ...form, id: editing.id } : x)))
      } else {
        setRazas((prev) => [...prev, { ...form, id: `raza-${Date.now()}` }])
      }
      setSaving(false)
      setDrawerOpen(false)
    }, 700)
  }
  function confirmDelete() {
    if (!toDelete) return
    setDeleting(true)
    setTimeout(() => {
      setRazas((prev) => prev.filter((x) => x.id !== toDelete.id))
      setDeleting(false)
      setToDelete(null)
    }, 700)
  }

  return (
    <DashboardLayout>
      <PageHeader title="Configuración" description="Ajustes de la granja y preferencias" />

      <div className="flex flex-col gap-6">
        {/* Datos de la granja */}
        <section className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-base font-semibold text-gray-900">Datos de la granja</h2>
          <p className="mt-1 text-sm text-gray-500">Información general de tu explotación ovina.</p>
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="granja" className={labelClass}>
                Nombre de la granja
              </label>
              <input id="granja" type="text" defaultValue="Granja San Alfonso" className={fieldClass} />
            </div>
            <div>
              <label htmlFor="ubicacion" className={labelClass}>
                Ubicación
              </label>
              <input id="ubicacion" type="text" defaultValue="Chimborazo, Ecuador" className={fieldClass} />
            </div>
            <div>
              <label htmlFor="responsable" className={labelClass}>
                Responsable
              </label>
              <input id="responsable" type="text" defaultValue="Alfonso Suárez" className={fieldClass} />
            </div>
            <div>
              <label htmlFor="moneda" className={labelClass}>
                Moneda
              </label>
              <select id="moneda" className={fieldClass} defaultValue="USD">
                <option value="USD">USD — Dólar</option>
                <option value="EUR">EUR — Euro</option>
              </select>
            </div>
          </div>
        </section>

        {/* Razas (CRUD) */}
        <section className="rounded-lg bg-white shadow">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Razas</h2>
              <p className="mt-1 text-sm text-gray-500">Catálogo de razas disponibles al registrar ovejas.</p>
            </div>
            <button
              onClick={openNew}
              className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
            >
              <PlusIcon className="h-5 w-5" aria-hidden="true" />
              Nueva raza
            </button>
          </div>
          {razas.length === 0 ? (
            <EmptyState
              icon={TagIcon}
              title="Sin razas"
              description="Agrega razas para clasificar tus ovejas."
              action={
                <button onClick={openNew} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
                  Nueva raza
                </button>
              }
            />
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {["Nombre", "Notas", ""].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {razas.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-3 text-sm font-medium text-gray-900">{r.nombre}</td>
                    <td className="max-w-md truncate px-6 py-3 text-sm text-gray-500">{r.notas || "—"}</td>
                    <td className="whitespace-nowrap px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(r)}
                          className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-indigo-600"
                          aria-label={`Editar ${r.nombre}`}
                        >
                          <PencilSquareIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => setToDelete(r)}
                          className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                          aria-label={`Eliminar ${r.nombre}`}
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
        </section>

        {/* Preferencias */}
        <section className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-base font-semibold text-gray-900">Preferencias</h2>
          <div className="mt-6 flex flex-col divide-y divide-gray-100">
            {[
              { t: "Alertas FAMACHA", d: "Notificar cuando una oveja alcance grado 4 o superior." },
              { t: "Recordatorios de monta", d: "Avisar fechas de monta y parto estimado." },
              { t: "Stock de medicamentos", d: "Alertar cuando un medicamento esté bajo stock." },
            ].map((item, i) => (
              <label key={item.t} className={`flex items-center justify-between gap-4 ${i === 0 ? "pb-4" : "py-4"}`}>
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.t}</p>
                  <p className="text-sm text-gray-500">{item.d}</p>
                </div>
                <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600" />
              </label>
            ))}
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <button className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            Cancelar
          </button>
          <button className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
            Guardar cambios
          </button>
        </div>
      </div>

      {/* Raza add/edit drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editing ? "Editar raza" : "Nueva raza"}
        description="Define una raza para el catálogo de ovejas."
        footer={
          <>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="raza-form"
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
          </>
        }
      >
        <form id="raza-form" onSubmit={save} className="flex flex-col gap-4">
          <Field label="Nombre" required htmlFor="raza-nombre">
            <TextInput
              id="raza-nombre"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Ej. Dorper"
              required
            />
          </Field>
          <Field label="Notas" htmlFor="raza-notas">
            <Textarea id="raza-notas" rows={3} value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} />
          </Field>
        </form>
      </Drawer>

      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar raza"
        message={`¿Eliminar la raza "${toDelete?.nombre}"? Las ovejas existentes conservarán su raza registrada.`}
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </DashboardLayout>
  )
}
