import type { ReactNode } from "react"

export type Column<T> = {
  key: string
  header: string
  align?: "left" | "right" | "center"
  render?: (row: T) => ReactNode
  className?: string
}

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  loading = false,
  emptyState,
  caption,
}: {
  columns: Column<T>[]
  rows: T[]
  loading?: boolean
  emptyState?: ReactNode
  caption?: string
}) {
  const alignClass = (a?: "left" | "right" | "center") =>
    a === "right" ? "text-right" : a === "center" ? "text-center" : "text-left"

  if (loading) {
    return (
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-3">
          <div className="h-3 w-32 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="divide-y divide-gray-100">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-6 px-6 py-4">
              {columns.map((c) => (
                <div key={c.key} className="h-3 flex-1 animate-pulse rounded bg-gray-100" />
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (rows.length === 0 && emptyState) {
    return <>{emptyState}</>
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead className="bg-gray-50">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  className={`px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 ${alignClass(c.align)}`}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {rows.map((row) => (
              <tr key={row.id} className="transition-colors hover:bg-gray-50">
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={`whitespace-nowrap px-6 py-4 text-sm text-gray-700 ${alignClass(c.align)} ${c.className ?? ""}`}
                  >
                    {c.render ? c.render(row) : ((row as Record<string, unknown>)[c.key] as ReactNode)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
