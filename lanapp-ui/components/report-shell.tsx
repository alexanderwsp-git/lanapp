"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { EmptyState } from "@/components/ui/empty-state"
import { StatusBadge } from "@/components/ui/status-badge"
import { DataTable } from "@/components/ui/data-table"
import { fetchReport, type ReportType } from "@/lib/api/reports"
import { statusColor } from "@/mocks/labels"
import { ArrowDownTrayIcon, DocumentChartBarIcon } from "@heroicons/react/24/outline"

const badgeKeys = new Set(["resultado", "alerta"])

export function ReportShell({ reportType, description }: { reportType: ReportType; description?: string }) {
  const [cfg, setCfg] = useState<Awaited<ReturnType<typeof fetchReport>> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
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

  if (loading) {
    return (
      <DashboardLayout>
        <p className="text-sm text-gray-500">Cargando reporte…</p>
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
        title={cfg.title}
        description={description ?? `${cfg.total} registros en total`}
        action={
          <button className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            <ArrowDownTrayIcon className="h-5 w-5" aria-hidden="true" />
            Exportar
          </button>
        }
      />

      <DataTable<{ row: (typeof cfg.rows)[number]; i: number }>
        rows={cfg.rows.map((row, i) => ({ row, i }))}
        rowKey={({ i }) => String(i)}
        empty={
          <EmptyState icon={DocumentChartBarIcon} title="Sin datos" description="No hay registros para este reporte." />
        }
        columns={cfg.columns.map((c, j) => ({
          key: c.key,
          header: c.label,
          className: "whitespace-nowrap",
          cell: ({ row }) => {
            const value = row[c.key]
            return badgeKeys.has(c.key) ? (
              <StatusBadge color={statusColor[String(value)] ?? "gray"}>{value}</StatusBadge>
            ) : (
              <span className={j === 0 ? "font-medium text-gray-900" : "text-gray-700"}>{value}</span>
            )
          },
        }))}
      />
    </DashboardLayout>
  )
}
