"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { StatCard } from "@/components/ui/stat-card"
import { EmptyState } from "@/components/ui/empty-state"
import { DataTable } from "@/components/ui/data-table"
import { StatusBadge } from "@/components/ui/status-badge"
import { Drawer } from "@/components/ui/drawer"
import { Field, TextInput } from "@/components/ui/form-fields"
import { WeaningRecentPanel } from "@/components/weaning-recent-panel"
import { fetchWeaningAlerts, bulkRecordWeaning } from "@/lib/api/weaning"
import type { ApiSheep, BulkResult } from "@/lib/api/types"
import { labelCategory } from "@/lib/labels/sheep"
import { displayKgValue, formatDisplayDate, formatAgeDays, toKg } from "@/lib/format"
import { AcademicCapIcon, BellAlertIcon, CheckCircleIcon, ScaleIcon } from "@heroicons/react/24/outline"

const WEANING_THRESHOLD = 70

const TABS = [
  { id: "pendientes", label: "Pendientes" },
  { id: "recientes", label: "Destetados recientes" },
] as const

const today = () => new Date().toISOString().split("T")[0]

export default function WeaningPage() {
  const [view, setView] = useState<(typeof TABS)[number]["id"]>("pendientes")
  const [recentRefreshKey, setRecentRefreshKey] = useState(0)
  const [rows, setRows] = useState<ApiSheep[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [weaningDate, setWeaningDate] = useState(today())
  const [lotId, setLotId] = useState("")
  const [notas, setNotas] = useState("")
  const [weights, setWeights] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [result, setResult] = useState<BulkResult | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const alerts = await fetchWeaningAlerts(WEANING_THRESHOLD)
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

  const avgWeight = useMemo(() => {
    if (rows.length === 0) return "0"
    const total = rows.reduce((acc, r) => acc + (toKg(r.latestWeight) ?? toKg(r.weight) ?? 0), 0)
    return (total / rows.length).toFixed(1)
  }, [rows])

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
    setNotas("")
    setWeights(
      Object.fromEntries(
        targetIds.map((id) => {
          const sheep = sheepById.get(id)
          const kg = toKg(sheep?.latestWeight) ?? toKg(sheep?.weight)
          return [id, kg != null ? String(kg) : ""]
        }),
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
      weaningWeight: Number.parseFloat(weights[s.id]),
    }))

    const invalid = records.find(
      (r) => !Number.isFinite(r.weaningWeight) || r.weaningWeight <= 0,
    )
    if (invalid) {
      setFormError("Todos los pesos de destete deben ser mayores a 0 (decimales permitidos, ej. 12.3)")
      return
    }

    setSaving(true)
    try {
      const res = await bulkRecordWeaning({
        weaningDate,
        lotId: lotId.trim() || undefined,
        notes: notas.trim() || undefined,
        records,
      })
      setResult(res)
      const succeededIds = new Set(res.succeeded.map((r) => r.sheepId))
      setRows((prev) => prev.filter((s) => !succeededIds.has(s.id)))
      setSelected(new Set())
      if (res.succeeded.length > 0) {
        setRecentRefreshKey((k) => k + 1)
      }
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
        title="Destete"
        description={
          view === "pendientes"
            ? `Corderos con ${WEANING_THRESHOLD}+ días sin registro de destete`
            : "Historial de destetes por rango de fechas"
        }
        action={
          view === "pendientes" ? (
            <button
              onClick={() => openDrawer()}
              disabled={selected.size === 0}
              className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
            >
                  <AcademicCapIcon className="h-5 w-5" aria-hidden="true" />
                  Destetar seleccionados ({selected.size})
            </button>
          ) : undefined
        }
      />

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6" aria-label="Vistas de destete">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setView(t.id)}
              className={`whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium ${
                view === t.id
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {view === "recientes" ? (
        <div className="mt-6">
          <WeaningRecentPanel refreshKey={recentRefreshKey} />
        </div>
      ) : (
        <>
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
        <StatCard label="Umbral destete" value={`${WEANING_THRESHOLD} días`} icon={CheckCircleIcon} hint="Alertas desde el día oficial de destete" />
      </div>

      {loadError && (
        <div className="mt-6 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
          <button type="button" onClick={load} className="ml-2 font-semibold underline">
            Reintentar
          </button>
        </div>
      )}

      <div className="mt-6">
        <DataTable
          rows={rows}
          rowKey={(s) => s.id}
          loading={loading}
          loadingText="Cargando alertas..."
          rowClassName={(s) => (selected.has(s.id) ? "bg-indigo-50/50" : undefined)}
          selection={{
            selectedKeys: selected,
            onToggleRow: toggleOne,
            onToggleAll: toggleAll,
            allSelected,
            ariaLabel: (s) => `Seleccionar ${s.tag}`,
          }}
          empty={
            <EmptyState
              icon={CheckCircleIcon}
              title="Sin alertas de destete"
              description="No hay corderos pendientes de destete en este momento."
            />
          }
          columns={[
            { key: "tag", header: "Arete", className: "whitespace-nowrap font-medium text-gray-900", cell: (s) => s.tag },
            { key: "name", header: "Nombre", className: "whitespace-nowrap", cell: (s) => s.name || "—" },
            {
              key: "birth",
              header: "F. nacimiento",
              className: "whitespace-nowrap",
              cell: (s) => formatDisplayDate(s.birthDate),
            },
            {
              key: "category",
              header: "Categoría",
              className: "whitespace-nowrap",
              cell: (s) => <StatusBadge color="indigo">{labelCategory(s.category)}</StatusBadge>,
            },
            { key: "age", header: "Edad (días)", className: "whitespace-nowrap", cell: (s) => formatAgeDays(s.birthDate) },
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
                  onClick={() => openDrawer([s.id])}
                  title="Destetar"
                  aria-label="Destetar"
                  className="rounded-md p-1.5 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  <AcademicCapIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              ),
            },
          ]}
        />
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
          <Field label="Notas (opcional)" htmlFor="weaning-notas">
            <TextInput
              id="weaning-notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ej. Destete lote A"
            />
          </Field>
          <div>
            <p className="mb-1.5 text-sm font-medium text-gray-700">Peso de destete por cordero (kg)</p>
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
                    aria-label={`Peso destete ${s.tag}`}
                    required
                  />
                </div>
              ))}
            </div>
          </div>
        </form>
      </Drawer>
        </>
      )}
    </DashboardLayout>
  )
}
