"use client"

import { type ComponentType, type SVGProps, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { EmptyState } from "@/components/ui/empty-state"
import { StatCard } from "@/components/ui/stat-card"
import { StatusBadge } from "@/components/ui/status-badge"
import { DataTable } from "@/components/ui/data-table"
import { fetchReport, type ReportType, type ReportConfig } from "@/lib/api/reports"
import { statusColor } from "@/mocks/labels"
import { formatDisplayDate } from "@/lib/format"
import {
  ArrowDownTrayIcon,
  ArrowTrendingUpIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  ClockIcon,
  DocumentChartBarIcon,
  HeartIcon,
  MagnifyingGlassIcon,
  ScaleIcon,
  Squares2X2Icon,
  UsersIcon,
} from "@heroicons/react/24/outline"

const badgeKeys = new Set(["resultado", "alerta"])
const dateKeys = new Set([
  "fecha",
  "fechaMonta",
  "fechaParto",
  "fechaChequeo",
  "ultimaMonta",
  "ultimoParto",
])

type ReportRow = ReportConfig["rows"][number]
type StatItem = {
  label: string
  value: string | number
  icon: ComponentType<SVGProps<SVGSVGElement>>
  hint?: string
}
type ReportMeta = {
  icon: ComponentType<SVGProps<SVGSVGElement>>
  stats: (rows: ReportRow[], total: number) => StatItem[]
}

/** Numeric values of a column, ignoring non-numeric entries. */
function nums(rows: ReportRow[], key: string): number[] {
  return rows.map((r) => Number(r[key])).filter((n) => Number.isFinite(n))
}
/** Rounded average of a numeric column (1 decimal). */
function avg(rows: ReportRow[], key: string): number {
  const a = nums(rows, key)
  if (!a.length) return 0
  return Math.round((a.reduce((s, n) => s + n, 0) / a.length) * 10) / 10
}
function countWhere(rows: ReportRow[], fn: (r: ReportRow) => boolean): number {
  return rows.filter(fn).length
}
/** Earliest ISO date string in a column (ISO sorts lexically). */
function earliest(rows: ReportRow[], key: string): string | null {
  const values = rows.map((r) => String(r[key])).filter(Boolean).sort()
  return values[0] ?? null
}

const reportMeta: Record<ReportType, ReportMeta> = {
  maltonas: {
    icon: ArrowTrendingUpIcon,
    stats: (rows, total) => {
      const hembras = countWhere(rows, (r) => String(r.sexo).toLowerCase() === "hembra")
      const pct = rows.length ? Math.round((hembras / rows.length) * 100) : 0
      return [
        { label: "Total maltonas", value: total, icon: Squares2X2Icon, hint: "En etapa de crecimiento" },
        { label: "Peso promedio", value: `${avg(rows, "peso")} kg`, icon: ScaleIcon, hint: "De los corderos en muestra" },
        { label: "Edad promedio", value: `${avg(rows, "edadDias")} días`, icon: ClockIcon, hint: "Desde el nacimiento" },
        { label: "Proporción hembras", value: `${pct}%`, icon: UsersIcon, hint: "Del grupo evaluado" },
      ]
    },
  },
  prenadas: {
    icon: HeartIcon,
    stats: (rows, total) => {
      const next = earliest(rows, "fechaParto")
      const maxDias = nums(rows, "dias").reduce((m, n) => Math.max(m, n), 0)
      return [
        { label: "Total preñadas", value: total, icon: HeartIcon, hint: "Ovejas en gestación" },
        { label: "Gestación promedio", value: `${avg(rows, "dias")} días`, icon: ClockIcon, hint: "Avance medio del grupo" },
        { label: "Próximo parto", value: next ? formatDisplayDate(next) : "—", icon: CalendarDaysIcon, hint: "Fecha estimada más cercana" },
        { label: "Más avanzada", value: `${maxDias} días`, icon: ArrowTrendingUpIcon, hint: "Mayor gestación registrada" },
      ]
    },
  },
  montas: {
    icon: CalendarDaysIcon,
    stats: (rows, total) => {
      const prenadas = countWhere(rows, (r) => String(r.resultado) === "Preñada")
      const pendientes = countWhere(rows, (r) => String(r.resultado) === "Pendiente")
      const decided = countWhere(rows, (r) => String(r.resultado) !== "Pendiente")
      const tasa = decided ? Math.round((prenadas / decided) * 100) : 0
      return [
        { label: "Total montas", value: total, icon: CalendarDaysIcon, hint: "Registradas en el periodo" },
        { label: "Preñadas", value: prenadas, icon: HeartIcon, hint: "Confirmadas en la muestra" },
        { label: "Pendientes", value: pendientes, icon: ClockIcon, hint: "Sin diagnóstico" },
        { label: "Tasa de preñez", value: `${tasa}%`, icon: ChartBarIcon, hint: "De las montas diagnosticadas" },
      ]
    },
  },
  reproductores: {
    icon: UsersIcon,
    stats: (rows) => {
      const totalHembras = nums(rows, "hembras").reduce((s, n) => s + n, 0)
      const totalMontas = nums(rows, "montas").reduce((s, n) => s + n, 0)
      const totalPrenadas = nums(rows, "prenadas").reduce((s, n) => s + n, 0)
      const tasa = totalMontas ? Math.round((totalPrenadas / totalMontas) * 100) : 0
      return [
        { label: "Reproductores activos", value: rows.length, icon: UsersIcon, hint: "Con montas registradas" },
        { label: "Hembras cubiertas", value: totalHembras, icon: HeartIcon, hint: "Total de hembras montadas" },
        { label: "Montas totales", value: totalMontas, icon: CalendarDaysIcon, hint: "En el periodo" },
        { label: "Tasa de preñez", value: `${tasa}%`, icon: ChartBarIcon, hint: "Promedio del plantel" },
      ]
    },
  },
  madres: {
    icon: HeartIcon,
    stats: (rows) => {
      const totalCrias = nums(rows, "crias").reduce((s, n) => s + n, 0)
      const totalPartos = nums(rows, "partos").reduce((s, n) => s + n, 0)
      const totalMontas = nums(rows, "montas").reduce((s, n) => s + n, 0)
      const prenadas = rows.reduce((s, r) => {
        const tasa = Number(String(r.tasa).replace("%", ""))
        const montas = Number(r.montas)
        return s + (Number.isFinite(tasa) && Number.isFinite(montas) ? (tasa / 100) * montas : 0)
      }, 0)
      const tasaProm = totalMontas ? Math.round((prenadas / totalMontas) * 100) : 0
      return [
        { label: "Madres activas", value: rows.length, icon: UsersIcon, hint: "Con partos registrados" },
        { label: "Crías totales", value: totalCrias, icon: HeartIcon, hint: "Producidas por el grupo" },
        { label: "Partos totales", value: totalPartos, icon: CalendarDaysIcon, hint: "Acumulados" },
        { label: "Tasa de preñez", value: `${tasaProm}%`, icon: ChartBarIcon, hint: "Promedio del grupo" },
      ]
    },
  },
}

export function ReportShell({ reportType, description }: { reportType: ReportType; description?: string }) {
  const [cfg, setCfg] = useState<ReportConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    setQuery("")
    fetchReport(reportType)
      .then((data) => {
        if (!cancelled) setCfg(data)
      })
      .catch((err) => {
        if (!cancelled) {
          setCfg(null)
          setError(err instanceof Error ? err.message : "No se pudo cargar el reporte")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [reportType])

  const meta = reportMeta[reportType]

  const filteredRows = useMemo(() => {
    if (!cfg) return []
    const q = query.trim().toLowerCase()
    if (!q) return cfg.rows
    return cfg.rows.filter((row) => Object.values(row).some((v) => String(v).toLowerCase().includes(q)))
  }, [cfg, query])

  const stats = useMemo(() => (cfg ? meta.stats(cfg.rows, cfg.total) : []), [cfg, meta])

  if (loading) {
    return (
      <DashboardLayout>
        <ReportSkeleton />
      </DashboardLayout>
    )
  }

  if (error || !cfg) {
    return (
      <DashboardLayout>
        <EmptyState icon={DocumentChartBarIcon} title="Error" description={error ?? "Reporte no disponible"} />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <PageHeader
        icon={meta.icon}
        title={cfg.title}
        description={description ?? `${cfg.total} registros en total`}
        action={
          <button className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            <ArrowDownTrayIcon className="h-5 w-5" aria-hidden="true" />
            Exportar
          </button>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} hint={s.hint} />
        ))}
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <MagnifyingGlassIcon
              className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filtrar registros…"
              aria-label="Filtrar registros del reporte"
              className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <p className="text-sm text-gray-500">
            {query.trim()
              ? `${filteredRows.length} de ${cfg.rows.length} registros`
              : `${cfg.rows.length} registros en la muestra`}
          </p>
        </div>

        <DataTable<{ row: ReportRow; i: number }>
          bare
          rows={filteredRows.map((row, i) => ({ row, i }))}
          rowKey={({ i }) => String(i)}
          empty={
            query.trim() ? (
              <EmptyState
                icon={MagnifyingGlassIcon}
                title="Sin coincidencias"
                description={`Ningún registro coincide con "${query.trim()}".`}
              />
            ) : (
              <EmptyState
                icon={DocumentChartBarIcon}
                title="Sin datos"
                description="No hay registros para este reporte."
              />
            )
          }
          columns={cfg.columns.map((c, j) => ({
            key: c.key,
            header: c.label,
            className: "whitespace-nowrap",
            cell: ({ row }) => {
              const value = row[c.key]
              if (badgeKeys.has(c.key)) {
                return <StatusBadge color={statusColor[String(value)] ?? "gray"}>{value}</StatusBadge>
              }
              const display = dateKeys.has(c.key) && value ? formatDisplayDate(String(value)) : value
              const sheepId = row.id ? String(row.id) : null
              if (j === 0 && sheepId) {
                return (
                  <Link
                    href={`/sheep/${sheepId}`}
                    className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline"
                  >
                    {display}
                  </Link>
                )
              }
              return (
                <span className={j === 0 ? "font-medium text-gray-900" : "text-gray-700"}>{display}</span>
              )
            },
          }))}
        />
      </div>
    </DashboardLayout>
  )
}

function ReportSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-6 flex items-center gap-4">
        <div className="h-11 w-11 rounded-lg bg-gray-200" />
        <div className="space-y-2">
          <div className="h-6 w-48 rounded bg-gray-200" />
          <div className="h-4 w-64 rounded bg-gray-100" />
        </div>
      </div>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-lg bg-white p-6 shadow">
            <div className="h-4 w-24 rounded bg-gray-200" />
            <div className="mt-3 h-8 w-16 rounded bg-gray-200" />
          </div>
        ))}
      </div>
      <div className="h-64 rounded-lg bg-white shadow" />
    </div>
  )
}
