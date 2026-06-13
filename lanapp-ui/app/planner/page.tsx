"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { EmptyState } from "@/components/ui/empty-state"
import { StatusBadge } from "@/components/ui/status-badge"
import { Field, TextInput } from "@/components/ui/form-fields"
import { Combobox } from "@/components/ui/combobox"
import { useSheepFilter } from "@/components/ui/sheep-filter"
import { fetchSheep } from "@/lib/api/sheep"
import { fetchLocations } from "@/lib/api/location"
import { bulkScheduleBreedingCycles } from "@/lib/api/breeding-cycle"
import type { ApiSheep, ApiLocation, BulkResult } from "@/lib/api/types"
import { Gender, SheepStatus } from "@sheep/domain"
import { labelCategory } from "@/lib/labels/sheep"
import { CalendarDaysIcon } from "@heroicons/react/24/outline"

const today = () => new Date().toISOString().split("T")[0]

export default function PlannerPage() {
  const [ewes, setEwes] = useState<ApiSheep[]>([])
  const [rams, setRams] = useState<ApiSheep[]>([])
  const [locations, setLocations] = useState<ApiLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [cycleName, setCycleName] = useState("")
  const [ramId, setRamId] = useState("")
  const [matingDate, setMatingDate] = useState(today())
  const [vitaselApplied, setVitaselApplied] = useState(false)
  const [notes, setNotes] = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [result, setResult] = useState<BulkResult | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const [females, males, locs] = await Promise.all([
        fetchSheep({ gender: Gender.FEMALE, status: SheepStatus.ACTIVE, limit: 300 }),
        fetchSheep({ gender: Gender.MALE, status: SheepStatus.ACTIVE, limit: 300 }),
        fetchLocations(200).catch(() => [] as ApiLocation[]),
      ])
      setEwes(females.items)
      setRams(males.items)
      setLocations(locs)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "No se pudieron cargar los datos")
      setEwes([])
      setRams([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const { filtered: visibleEwes, controls: filterControls } = useSheepFilter(ewes, locations)

  const ramOptions = useMemo(
    () =>
      rams.map((s) => ({
        value: s.id,
        label: s.tag,
        sublabel: s.name ?? labelCategory(s.category),
      })),
    [rams],
  )

  const allSelected = visibleEwes.length > 0 && visibleEwes.every((s) => selected.has(s.id))

  function toggleAll() {
    setSelected((prev) => {
      if (visibleEwes.every((s) => prev.has(s.id))) {
        const next = new Set(prev)
        visibleEwes.forEach((s) => next.delete(s.id))
        return next
      }
      const next = new Set(prev)
      visibleEwes.forEach((s) => next.add(s.id))
      return next
    })
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    setResult(null)

    if (!cycleName.trim()) {
      setFormError("Indica el nombre del ciclo (ej. 2026-A)")
      return
    }
    if (!matingDate) {
      setFormError("Indica la fecha de monta")
      return
    }
    const eweIds = Array.from(selected)
    if (eweIds.length === 0) {
      setFormError("Selecciona al menos una oveja")
      return
    }

    setSaving(true)
    try {
      const res = await bulkScheduleBreedingCycles({
        cycleName: cycleName.trim(),
        ramId: ramId || undefined,
        matingDate,
        vitaselApplied,
        notes: notes.trim() || undefined,
        eweIds,
      })
      setResult(res)
      const succeededIds = new Set(res.succeeded.map((r) => r.sheepId))
      setSelected((prev) => {
        const next = new Set(prev)
        succeededIds.forEach((id) => next.delete(id))
        return next
      })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "No se pudo programar el ciclo")
    } finally {
      setSaving(false)
    }
  }

  const eweById = useMemo(() => new Map(ewes.map((s) => [s.id, s])), [ewes])

  return (
    <DashboardLayout>
      <PageHeader
        title="Planificador de montas"
        description="Programa un ciclo reproductivo para varias ovejas a la vez"
      />

      {loadError && (
        <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
          <button type="button" onClick={load} className="ml-2 font-semibold underline">
            Reintentar
          </button>
        </div>
      )}

      {result && (
        <div
          className={`mb-4 rounded-md px-4 py-3 text-sm ${
            result.failed.length === 0 ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-800"
          }`}
        >
          <p>
            {result.succeeded.length} ciclo(s) programado(s) correctamente
            {result.failed.length > 0 && ` · ${result.failed.length} omitida(s) o con error`}.
          </p>
          {result.failed.length > 0 && (
            <ul className="mt-1 list-disc pl-5">
              {result.failed.map((f) => (
                <li key={f.sheepId}>
                  {eweById.get(f.sheepId)?.tag ?? f.sheepId}: {f.error}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Configuration card */}
        <form onSubmit={submit} className="flex flex-col gap-4 rounded-lg bg-white p-6 shadow lg:col-span-1">
          <h2 className="text-lg font-semibold text-gray-900">Configuración del ciclo</h2>
          {formError && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</div>
          )}
          <Field label="Nombre del ciclo" required htmlFor="cycle-name">
            <TextInput
              id="cycle-name"
              value={cycleName}
              onChange={(e) => setCycleName(e.target.value)}
              placeholder="2026-A"
              required
            />
          </Field>
          <Field label="Carnero (opcional)" htmlFor="ram">
            <Combobox
              id="ram"
              options={ramOptions}
              value={ramId}
              onChange={setRamId}
              placeholder="Seleccionar carnero"
              emptyMessage="Sin carneros activos"
            />
          </Field>
          <Field label="Fecha de monta" required htmlFor="mating-date">
            <TextInput
              id="mating-date"
              type="date"
              value={matingDate}
              onChange={(e) => setMatingDate(e.target.value)}
              required
            />
          </Field>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={vitaselApplied}
              onChange={(e) => setVitaselApplied(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
            />
            Aplicó Vitasel
          </label>
          <Field label="Notas" htmlFor="notes">
            <TextInput id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
          <button
            type="submit"
            disabled={saving || selected.size === 0}
            className="mt-2 inline-flex items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {saving && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            Programar ciclo ({selected.size})
          </button>
        </form>

        {/* Ewe selection */}
        <div className="lg:col-span-2">
          <div className="mb-4 rounded-lg bg-white p-4 shadow">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">Filtrar ovejas</p>
              <p className="text-sm text-gray-500">
                {visibleEwes.length} resultado(s) · {selected.size} seleccionada(s)
              </p>
            </div>
            {filterControls}
          </div>

          <div className="overflow-hidden rounded-lg bg-white shadow">
            {loading ? (
              <p className="p-8 text-center text-sm text-gray-500">Cargando ovejas...</p>
            ) : visibleEwes.length === 0 ? (
              <EmptyState
                icon={CalendarDaysIcon}
                title="Sin ovejas disponibles"
                description="No hay hembras activas para este filtro."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={toggleAll}
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                          aria-label="Seleccionar todas"
                        />
                      </th>
                      {["Arete", "Nombre", "Categoría", "Potrero"].map((h) => (
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
                    {visibleEwes.map((s) => (
                      <tr key={s.id} className={selected.has(s.id) ? "bg-indigo-50/50" : "hover:bg-gray-50"}>
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selected.has(s.id)}
                            onChange={() => toggleOne(s.id)}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                            aria-label={`Seleccionar ${s.tag}`}
                          />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">{s.tag}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{s.name || "—"}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm">
                          <StatusBadge color="indigo">{labelCategory(s.category)}</StatusBadge>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                          {s.currentLocation?.name ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
