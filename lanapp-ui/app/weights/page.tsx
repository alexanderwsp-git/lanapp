"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { EmptyState } from "@/components/ui/empty-state"
import { DataTable } from "@/components/ui/data-table"
import { Field, TextInput, Textarea } from "@/components/ui/form-fields"
import { Drawer } from "@/components/ui/drawer"
import { useSheepFilter } from "@/components/ui/sheep-filter"
import { fetchSheep } from "@/lib/api/sheep"
import { fetchLocations } from "@/lib/api/location"
import { bulkRecordWeights } from "@/lib/api/weight"
import type { ApiLocation, ApiSheep, BulkResult } from "@/lib/api/types"
import { labelCategory } from "@/lib/labels/sheep"
import { displayKgValue, formatDisplayDate, toKg } from "@/lib/format"
import { IconSchedule } from "@/lib/icons/analysis-medicine"
import { ScaleIcon } from "@heroicons/react/24/outline"

const today = () => new Date().toISOString().split("T")[0]

export default function WeightsPage() {
  const [sheep, setSheep] = useState<ApiSheep[]>([])
  const [locations, setLocations] = useState<ApiLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [bulkOpen, setBulkOpen] = useState(false)
  const [measurementDate, setMeasurementDate] = useState(today())
  const [bulkNotes, setBulkNotes] = useState("")
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set())
  const [weights, setWeights] = useState<Record<string, string>>({})
  const [savingBulk, setSavingBulk] = useState(false)
  const [bulkError, setBulkError] = useState<string | null>(null)
  const [bulkResult, setBulkResult] = useState<BulkResult | null>(null)

  useEffect(() => {
    let cancelled = false
    async function loadAll() {
      setLoading(true)
      setLoadError(null)
      try {
        const [sheepRes, locsRes] = await Promise.all([
          fetchSheep({ page: 1, limit: 300 }),
          fetchLocations(200).catch(() => [] as ApiLocation[]),
        ])
        if (cancelled) return
        setSheep(sheepRes.items)
        setLocations(locsRes)
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : "No se pudieron cargar las ovejas")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadAll()
    return () => {
      cancelled = true
    }
  }, [])

  const sheepById = useMemo(() => new Map(sheep.map((s) => [s.id, s])), [sheep])
  const { filtered: visibleSheep, controls: filterControls } = useSheepFilter(sheep, locations)
  const bulkAllSelected =
    visibleSheep.length > 0 && visibleSheep.every((s) => bulkSelected.has(s.id))
  const selectedRows = useMemo(
    () => sheep.filter((s) => bulkSelected.has(s.id)),
    [sheep, bulkSelected],
  )

  function toggleBulkAll() {
    setBulkSelected((prev) => {
      if (visibleSheep.every((s) => prev.has(s.id))) {
        const next = new Set(prev)
        visibleSheep.forEach((s) => next.delete(s.id))
        return next
      }
      const next = new Set(prev)
      visibleSheep.forEach((s) => next.add(s.id))
      return next
    })
  }

  function toggleBulkOne(id: string) {
    setBulkSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function openBulk(prefill?: { sheepId?: string }) {
    const ids = prefill?.sheepId ? [prefill.sheepId] : Array.from(bulkSelected)
    if (ids.length === 0) return
    setBulkSelected(new Set(ids))
    setMeasurementDate(today())
    setBulkNotes("")
    setWeights(
      Object.fromEntries(
        ids.map((id) => {
          const s = sheepById.get(id)
          const kg = toKg(s?.latestWeight) ?? toKg(s?.weight)
          return [id, kg != null ? String(kg) : ""]
        }),
      ),
    )
    setBulkError(null)
    setBulkResult(null)
    setBulkOpen(true)
  }

  async function saveBulk(e: React.FormEvent) {
    e.preventDefault()
    setBulkError(null)
    setBulkResult(null)
    if (!measurementDate) return setBulkError("Indica la fecha del pesaje")
    if (selectedRows.length === 0) return setBulkError("Selecciona al menos una oveja")

    const records = selectedRows.map((s) => ({
      sheepId: s.id,
      weight: Number.parseFloat(weights[s.id]),
    }))
    const invalid = records.find((r) => !Number.isFinite(r.weight) || r.weight <= 0)
    if (invalid) {
      setBulkError("Todos los pesos deben ser mayores a 0 (decimales permitidos, ej. 12.3)")
      return
    }

    setSavingBulk(true)
    try {
      const res = await bulkRecordWeights({
        measurementDate,
        notes: bulkNotes.trim() || undefined,
        records,
      })
      setBulkResult(res)
      const succeededIds = new Set(res.succeeded.map((r) => r.sheepId))
      setBulkSelected((prev) => {
        const next = new Set(prev)
        succeededIds.forEach((id) => next.delete(id))
        return next
      })
      if (res.failed.length === 0) setBulkOpen(false)
    } catch (err) {
      setBulkError(err instanceof Error ? err.message : "No se pudo registrar el peso en lote")
    } finally {
      setSavingBulk(false)
    }
  }

  function sheepTag(id: string) {
    const s = sheepById.get(id)
    return s ? (s.name ? `${s.tag} (${s.name})` : s.tag) : id
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Pesos"
        description="Registro masivo de pesajes para una o muchas ovejas"
        action={
          <button
            onClick={() => openBulk()}
            disabled={bulkSelected.size === 0}
            className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
          >
            <ScaleIcon className="h-5 w-5" aria-hidden="true" />
            Registrar pesos ({bulkSelected.size})
          </button>
        }
      />

      {loadError && (
        <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{loadError}</div>
      )}

      <div className="mb-4 flex items-start gap-3">
        <IconSchedule className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" aria-hidden="true" />
        <p className="text-sm text-gray-600">
          Selecciona ovejas en la tabla y registra el peso del día. Si ya hay un pesaje en esa
          fecha, se actualiza.
        </p>
      </div>

      <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
        <p className="mb-2 text-sm font-medium text-gray-700">Filtrar ovejas</p>
        {filterControls}
      </div>

      <div className="mt-4">
        <DataTable
          rows={visibleSheep}
          rowKey={(s) => s.id}
          loading={loading}
          loadingText="Cargando ovejas..."
          rowClassName={(s) => (bulkSelected.has(s.id) ? "bg-indigo-50/50" : undefined)}
          selection={{
            selectedKeys: bulkSelected,
            onToggleRow: toggleBulkOne,
            onToggleAll: toggleBulkAll,
            allSelected: bulkAllSelected,
            ariaLabel: (s) => `Seleccionar ${s.tag}`,
          }}
          empty={
            <EmptyState
              icon={ScaleIcon}
              title="Sin ovejas"
              description="No hay ovejas que coincidan con el filtro."
            />
          }
          columns={[
            {
              key: "tag",
              header: "Arete",
              className: "whitespace-nowrap font-medium text-gray-900",
              cell: (s) => s.tag,
            },
            {
              key: "name",
              header: "Nombre",
              className: "whitespace-nowrap",
              cell: (s) => s.name || "—",
            },
            {
              key: "category",
              header: "Categoría",
              className: "whitespace-nowrap",
              cell: (s) => labelCategory(s.category),
            },
            {
              key: "birth",
              header: "Nacimiento",
              className: "whitespace-nowrap",
              cell: (s) => formatDisplayDate(s.birthDate),
            },
            {
              key: "weight",
              header: "Último peso (kg)",
              className: "whitespace-nowrap",
              cell: (s) => displayKgValue(s.latestWeight ?? s.weight),
            },
            {
              key: "actions",
              header: "",
              align: "right",
              className: "whitespace-nowrap",
              cell: (s) => (
                <button
                  type="button"
                  onClick={() => openBulk({ sheepId: s.id })}
                  title="Registrar peso"
                  aria-label="Registrar peso"
                  className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-indigo-600"
                >
                  <ScaleIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              ),
            },
          ]}
        />
      </div>

      <Drawer
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        title="Registrar pesos"
        description={`${selectedRows.length} oveja(s) seleccionada(s)`}
        footer={
          <>
            <button
              type="button"
              onClick={() => setBulkOpen(false)}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="weights-bulk-form"
              disabled={savingBulk || selectedRows.length === 0}
              className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {savingBulk && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              )}
              Registrar ({selectedRows.length})
            </button>
          </>
        }
      >
        <form id="weights-bulk-form" onSubmit={saveBulk} className="flex flex-col gap-4">
          {bulkError && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{bulkError}</div>
          )}
          {bulkResult && bulkResult.failed.length > 0 && (
            <div className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
              <p className="font-medium">
                {bulkResult.succeeded.length} registrado(s), {bulkResult.failed.length} con error:
              </p>
              <ul className="mt-1 list-disc pl-5">
                {bulkResult.failed.map((f) => (
                  <li key={f.sheepId}>
                    {sheepTag(f.sheepId)}: {f.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Field label="Fecha del pesaje" required htmlFor="bulk-weight-date">
            <TextInput
              id="bulk-weight-date"
              type="date"
              value={measurementDate}
              onChange={(e) => setMeasurementDate(e.target.value)}
              required
            />
          </Field>
          <Field label="Notas (opcional)" htmlFor="bulk-weight-notes">
            <Textarea
              id="bulk-weight-notes"
              rows={2}
              value={bulkNotes}
              onChange={(e) => setBulkNotes(e.target.value)}
            />
          </Field>
          <div>
            <p className="mb-1.5 text-sm font-medium text-gray-700">Peso por oveja (kg)</p>
            <p className="mb-2 text-xs text-gray-500">Decimales permitidos (ej. 12.3)</p>
            <div className="divide-y divide-gray-100 rounded-md border border-gray-200">
              {selectedRows.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-3 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{s.tag}</p>
                    <p className="truncate text-xs text-gray-500">{s.name || labelCategory(s.category)}</p>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={weights[s.id] ?? ""}
                    onChange={(e) => setWeights((prev) => ({ ...prev, [s.id]: e.target.value }))}
                    className="w-24 rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    aria-label={`Peso ${s.tag}`}
                    required
                  />
                </div>
              ))}
            </div>
          </div>
        </form>
      </Drawer>
    </DashboardLayout>
  )
}
