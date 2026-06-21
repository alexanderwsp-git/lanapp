"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Gender, SheepCategory, SheepStatus, TWELVE_MONTHS_DAYS } from "@sheep/domain"
import { DashboardLayout } from "@/components/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { StatCard } from "@/components/ui/stat-card"
import { EmptyState } from "@/components/ui/empty-state"
import { DataTable } from "@/components/ui/data-table"
import { StatusBadge } from "@/components/ui/status-badge"
import { fetchSheep, updateSheep } from "@/lib/api/sheep"
import type { ApiSheep } from "@/lib/api/types"
import { ageInDays, formatDisplayDate } from "@/lib/format"
import { labelCategory } from "@/lib/labels/sheep"
import { reproductorStatus } from "@/lib/reproductor-status"
import { GiSheep } from "react-icons/gi"
import { CheckCircleIcon, UserGroupIcon } from "@heroicons/react/24/outline"

const CANDIDATE_CATEGORIES = new Set<SheepCategory>([
  SheepCategory.BORREGO,
  SheepCategory.REPRODUCTOR,
  SheepCategory.CORDERO_DESTETADO,
])

function isCandidate(s: ApiSheep): boolean {
  if (s.gender !== Gender.MALE || s.status !== SheepStatus.ACTIVE) return false
  if (ageInDays(s.birthDate) < TWELVE_MONTHS_DAYS) return false
  return CANDIDATE_CATEGORIES.has(s.category as SheepCategory) || s.isBreedingRam === true
}

export default function ReproductorsPage() {
  const [rows, setRows] = useState<ApiSheep[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [resultMsg, setResultMsg] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const res = await fetchSheep({ page: 1, limit: 300, gender: Gender.MALE, status: SheepStatus.ACTIVE })
      setRows(res.items.filter(isCandidate))
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "No se pudieron cargar los machos")
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const marked = useMemo(() => rows.filter((s) => s.isBreedingRam), [rows])
  const unmarked = useMemo(() => rows.filter((s) => !s.isBreedingRam), [rows])
  const allSelected = rows.length > 0 && selected.size === rows.length

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

  async function markSelected() {
    const ids = Array.from(selected).filter((id) => {
      const s = rows.find((r) => r.id === id)
      return s && !s.isBreedingRam
    })
    if (ids.length === 0) return
    setSaving(true)
    setResultMsg(null)
    let ok = 0
    let fail = 0
    for (const id of ids) {
      try {
        await updateSheep(id, { isBreedingRam: true })
        ok++
      } catch {
        fail++
      }
    }
    setResultMsg(
      fail > 0
        ? `${ok} marcado(s), ${fail} con error. Recarga para ver categorías actualizadas.`
        : `${ok} reproductor(es) marcado(s).`,
    )
    setSelected(new Set())
    await load()
    setSaving(false)
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Reproductores"
        description="Machos elegibles (≥12 meses) para marcar como reproductor de monta"
        action={
          <button
            onClick={markSelected}
            disabled={saving || selected.size === 0}
            className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
          >
            <GiSheep className="h-5 w-5" aria-hidden="true" />
            Marcar seleccionados ({selected.size})
          </button>
        }
      />

      {resultMsg && (
        <div className="mb-4 rounded-md bg-green-50 px-4 py-3 text-sm text-green-700">{resultMsg}</div>
      )}

      {loadError && (
        <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
          <button type="button" onClick={load} className="ml-2 font-semibold underline">
            Reintentar
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Candidatos" value={rows.length} icon={UserGroupIcon} hint="Machos ≥12 meses" />
        <StatCard label="Marcados" value={marked.length} icon={CheckCircleIcon} hint="Flag reproductor activo" />
        <StatCard label="Sin marcar" value={unmarked.length} icon={GiSheep} hint="Listos para seleccionar" />
      </div>

      <div className="mt-6">
        <DataTable
          rows={rows}
          rowKey={(s) => s.id}
          loading={loading}
          loadingText="Cargando machos..."
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
              icon={GiSheep}
              title="Sin candidatos"
              description="No hay machos activos con ≥12 meses en categoría borrego o reproductor."
            />
          }
          columns={[
            { key: "tag", header: "Arete", className: "whitespace-nowrap font-medium text-gray-900", cell: (s) => s.tag },
            { key: "name", header: "Nombre", className: "whitespace-nowrap", cell: (s) => s.name || "—" },
            {
              key: "category",
              header: "Categoría",
              className: "whitespace-nowrap",
              cell: (s) => <StatusBadge color="indigo">{labelCategory(s.category)}</StatusBadge>,
            },
            {
              key: "age",
              header: "Edad (días)",
              className: "whitespace-nowrap",
              cell: (s) => ageInDays(s.birthDate),
            },
            {
              key: "status",
              header: "Reproductor",
              className: "whitespace-nowrap",
              cell: (s) => {
                const repro = reproductorStatus(s)
                return repro ? (
                  <StatusBadge color={repro.badgeColor}>{repro.label}</StatusBadge>
                ) : (
                  "—"
                )
              },
            },
            {
              key: "markedAt",
              header: "Marcado el",
              className: "whitespace-nowrap text-gray-600",
              cell: (s) =>
                s.breedingRamMarkedAt ? formatDisplayDate(s.breedingRamMarkedAt) : "—",
            },
          ]}
        />
      </div>
    </DashboardLayout>
  )
}
