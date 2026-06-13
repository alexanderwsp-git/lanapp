"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { StatCard } from "@/components/ui/stat-card"
import { EmptyState } from "@/components/ui/empty-state"
import { StatusBadge } from "@/components/ui/status-badge"
import { Drawer } from "@/components/ui/drawer"
import { Field, TextInput } from "@/components/ui/form-fields"
import { fetchWeaningAlerts, bulkRecordWeaning } from "@/lib/api/weaning"
import type { ApiSheep, BulkResult } from "@/lib/api/types"
import { labelCategory } from "@/lib/labels/sheep"
import { toDateInputValue } from "@/lib/format"
import { BellAlertIcon, CheckCircleIcon, ScaleIcon } from "@heroicons/react/24/outline"

const WEANING_THRESHOLD = 70
const ALERT_MIN_DAYS = 75

const today = () => new Date().toISOString().split("T")[0]

function ageInDays(birthDate: string): number {
  const birth = new Date(birthDate)
  const diff = Date.now() - birth.getTime()
  return Math.max(0, Math.floor(diff / 86_400_000))
}

export default function WeaningPage() {
  const [rows, setRows] = useState<ApiSheep[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [weaningDate, setWeaningDate] = useState(today())
  const [lotId, setLotId] = useState("")
  const [weights, setWeights] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [result, setResult] = useState<BulkResult | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const alerts = await fetchWeaningAlerts(ALERT_MIN_DAYS)
      setRows(alerts)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "No se pudieron cargar las alertas")
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const sheepById = useMemo(() => new Map(rows.map((s) => [s.id, s])), [rows])
  const selectedRows = useMemo(
    () => rows.filter((s) => selected.has(s.id)),
    [rows, selected],
  )

  const allSelected = rows.length > 0 && selected.size === rows.length

  const avgWeight = rows.length
    ? (rows.reduce((acc, r) => acc + (r.weight ?? 0), 0) / rows.length).toFixed(1)
    : "0"

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(rows.map((s) => s.id)))
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function openDrawer(ids?: string[]) {
    const targetIds = ids ?? Array.from(selected)
    if (targetIds.length === 0) return
    if (ids) setSelected(new Set(ids))
    setWeaningDate(today())
    setLotId("")
    setWeights(
      Object.fromEntries(
        targetIds.map((id) => [id, String(sheepById.get(id)?.weight ?? "")]),
      ),
    )
    setFormError(null)
    setResult(null)
    setDrawerOpen(true)
  }

  async function submitDestete(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    if (!weaningDate) {
      setFormError("Indica la fecha de destete")
      return
    }

    const records = selectedRows.map((s) => ({
      sheepId: s.id,
      weaningWeight: Number(weights[s.id]),
    }))

    const invalid = records.find((r) => !Number.isFinite(r.weaningWeight) || r.weaningWeight <= 0)
    if (invalid) {
      setFormError("Todos los pesos de destete deben ser mayores a 0")
      return
    }

    setSaving(true)
    try {
      const res = await bulkRecordWeaning({ weaningDate, lotId: lotId.trim() || undefined, records })
      setResult(res)
      const succeededIds = new Set(res.succeeded.map((r) => r.sheepId))
      setRows((prev) => prev.filter((s) => !succeededIds.has(s.id)))
      setSelected(new Set())
      if (res.failed.length === 0) {
        setDrawerOpen(false)
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "No se pudo registrar el destete")
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Alertas de destete"
        description={`Corderos que superan el umbral de ${WEANING_THRESHOLD} días sin registro de destete`}
        action={
          <button
            onClick={() => openDrawer()}
            disabled={selected.size === 0}
            className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
          >
            <CheckCircleIcon className="h-5 w-5" aria-hidden="true" />
            Destetar seleccionados ({selected.size})
          </button>
        }
      />

      {result && (
        <div
          className={`mb-4 rounded-md px-4 py-3 text-sm ${
            result.failed.length === 0 ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-800"
          }`}
        >
          {result.succeeded.length} destete(s) registrado(s) correctamente
          {result.failed.length > 0 && ` · ${result.failed.length} con error`}.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Alertas activas" value={rows.length} icon={BellAlertIcon} hint="Listos para destetar" />
        <StatCard label="Peso promedio" value={`${avgWeight} kg`} icon={ScaleIcon} hint="De los corderos en alerta" />
        <StatCard label="Umbral destete" value={`${WEANING_THRESHOLD} días`} icon={CheckCircleIcon} hint={`Alertas desde ${ALERT_MIN_DAYS} días`} />
      </div>

      {loadError && (
        <div className="mt-6 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
          <button type="button" onClick={load} className="ml-2 font-semibold underline">
            Reintentar
          </button>
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-lg bg-white shadow">
        {loading ? (
          <p className="p-8 text-center text-sm text-gray-500">Cargando alertas...</p>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={CheckCircleIcon}
            title="Sin alertas de destete"
            description="No hay corderos pendientes de destete en este momento."
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
                      aria-label="Seleccionar todos"
                    />
                  </th>
                  {["Arete", "Nombre", "Categoría", "Edad (días)", "Peso (kg)", ""].map((h, i) => (
                    <th
                      key={`${h}-${i}`}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                    >
                      {h || "\u00a0"}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((s) => {
                  const days = ageInDays(s.birthDate)
                  return (
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
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{days}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{s.weight ?? "—"}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <button
                          onClick={() => openDrawer([s.id])}
                          className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
                        >
                          <CheckCircleIcon className="h-4 w-4" aria-hidden="true" />
                          Destetar
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Registrar destete"
        description={`${selectedRows.length} cordero(s) seleccionado(s)`}
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
              form="destete-form"
              disabled={saving || selectedRows.length === 0}
              className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {saving && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              )}
              Registrar destete
            </button>
          </>
        }
      >
        <form id="destete-form" onSubmit={submitDestete} className="flex flex-col gap-4">
          {formError && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</div>
          )}
          {result && result.failed.length > 0 && (
            <div className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
              <p className="font-medium">Algunos registros fallaron:</p>
              <ul className="mt-1 list-disc pl-5">
                {result.failed.map((f) => (
                  <li key={f.sheepId}>
                    {sheepById.get(f.sheepId)?.tag ?? f.sheepId}: {f.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Field label="Fecha de destete" required htmlFor="weaning-date">
            <TextInput
              id="weaning-date"
              type="date"
              value={weaningDate}
              onChange={(e) => setWeaningDate(e.target.value)}
              required
            />
          </Field>
          <Field label="Lote (opcional)" htmlFor="weaning-lot">
            <TextInput
              id="weaning-lot"
              value={lotId}
              onChange={(e) => setLotId(e.target.value)}
              placeholder="Ej. Lote-3"
            />
          </Field>
          <div>
            <p className="mb-1.5 text-sm font-medium text-gray-700">Peso de destete por cordero (kg)</p>
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
                    min="0"
                    value={weights[s.id] ?? ""}
                    onChange={(e) => setWeights((prev) => ({ ...prev, [s.id]: e.target.value }))}
                    className="w-24 rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    aria-label={`Peso destete ${s.tag}`}
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
