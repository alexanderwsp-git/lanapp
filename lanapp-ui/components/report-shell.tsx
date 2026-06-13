import { DashboardLayout } from "@/components/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { EmptyState } from "@/components/ui/empty-state"
import { StatusBadge } from "@/components/ui/status-badge"
import { reportConfig, statusColor, type ReportType } from "@/lib/mock-data"
import { ArrowDownTrayIcon, DocumentChartBarIcon } from "@heroicons/react/24/outline"

// Columns whose values should render as colored badges.
const badgeKeys = new Set(["resultado", "alerta"])

export function ReportShell({ reportType, description }: { reportType: ReportType; description?: string }) {
  const cfg = reportConfig[reportType]

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

      <div className="overflow-hidden rounded-lg bg-white shadow">
        {cfg.rows.length === 0 ? (
          <EmptyState icon={DocumentChartBarIcon} title="Sin datos" description="No hay registros para este reporte." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {cfg.columns.map((c) => (
                    <th key={c.key} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cfg.rows.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    {cfg.columns.map((c, j) => {
                      const value = row[c.key]
                      return (
                        <td key={c.key} className="whitespace-nowrap px-4 py-3 text-sm">
                          {badgeKeys.has(c.key) ? (
                            <StatusBadge color={statusColor[String(value)] ?? "gray"}>{value}</StatusBadge>
                          ) : (
                            <span className={j === 0 ? "font-medium text-gray-900" : "text-gray-700"}>{value}</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
