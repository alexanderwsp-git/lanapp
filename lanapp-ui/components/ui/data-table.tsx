"use client"

import { type ReactNode, useEffect, useMemo, useState, Fragment } from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid"
import { cn } from "@/lib/utils"

export type ColumnAlign = "left" | "right" | "center"

export interface Column<T> {
  /** Stable identifier for the column. */
  key: string
  /** Header label (rendered uppercased by default styling). */
  header: ReactNode
  /** Cell renderer. */
  cell: (row: T) => ReactNode
  align?: ColumnAlign
  /** Extra classes for the <td>. */
  className?: string
  /** Extra classes for the <th>. */
  headerClassName?: string
}

export interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  /** Loading state — shows a centered message. */
  loading?: boolean
  loadingText?: string
  /** Element to show when there are no rows (typically <EmptyState />). */
  empty?: ReactNode
  /** Rows per page. Defaults to 25. Pass 0 to disable pagination. */
  pageSize?: number
  /** Extra classes per row. */
  rowClassName?: (row: T) => string | undefined
  /** Row click handler — makes rows interactive. */
  onRowClick?: (row: T) => void
  /** Optional checkbox selection column. */
  selection?: {
    selectedKeys: Set<string>
    onToggleRow: (key: string) => void
    onToggleAll: () => void
    allSelected: boolean
    ariaLabel?: (row: T) => string
  }
  /** Optional expandable row content. */
  expand?: {
    isExpanded: (row: T) => boolean
    render: (row: T) => ReactNode
  }
  /** Label for the footer count. Defaults to "{shown} mostradas · {total} en total". */
  countLabel?: (shown: number, total: number) => ReactNode
  /** Hide the footer entirely. */
  hideFooter?: boolean
  /** Render without the outer card wrapper (for tables embedded inside an existing card). */
  bare?: boolean
}

const alignClass: Record<ColumnAlign, string> = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading,
  loadingText = "Cargando…",
  empty,
  pageSize = 25,
  rowClassName,
  onRowClick,
  selection,
  expand,
  countLabel,
  hideFooter,
  bare,
}: DataTableProps<T>) {
  const paginated = pageSize > 0
  const [page, setPage] = useState(0)
  const total = rows.length
  const pageCount = paginated ? Math.max(1, Math.ceil(total / pageSize)) : 1

  // Keep the page in range when the underlying rows change (filters, deletes).
  useEffect(() => {
    if (page > pageCount - 1) setPage(pageCount - 1)
  }, [page, pageCount])

  const visibleRows = useMemo(() => {
    if (!paginated) return rows
    const start = page * pageSize
    return rows.slice(start, start + pageSize)
  }, [rows, page, pageSize, paginated])

  const colCount = columns.length + (selection ? 1 : 0)

  return (
    <div className={bare ? "overflow-x-auto" : "overflow-hidden rounded-lg bg-white shadow"}>
      {loading ? (
        <p className="p-8 text-center text-sm text-gray-500">{loadingText}</p>
      ) : total === 0 ? (
        (empty ?? <p className="p-8 text-center text-sm text-gray-500">Sin registros.</p>)
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  {selection && (
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selection.allSelected}
                        onChange={selection.onToggleAll}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                        aria-label="Seleccionar todos"
                      />
                    </th>
                  )}
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      scope="col"
                      className={cn(
                        "px-4 py-3 text-sm font-semibold text-gray-900",
                        alignClass[col.align ?? "left"],
                        col.headerClassName,
                      )}
                    >
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visibleRows.map((row) => {
                  const key = rowKey(row)
                  const expanded = expand?.isExpanded(row) ?? false
                  return (
                    <Fragment key={key}>
                      <tr
                        className={cn(
                          onRowClick && "cursor-pointer",
                          "hover:bg-gray-50",
                          rowClassName?.(row),
                        )}
                        onClick={onRowClick ? () => onRowClick(row) : undefined}
                      >
                        {selection && (
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selection.selectedKeys.has(key)}
                              onChange={() => selection.onToggleRow(key)}
                              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                              aria-label={selection.ariaLabel?.(row) ?? "Seleccionar fila"}
                            />
                          </td>
                        )}
                        {columns.map((col) => (
                          <td
                            key={col.key}
                            className={cn(
                              "px-4 py-3 text-sm text-gray-700",
                              alignClass[col.align ?? "left"],
                              col.className,
                            )}
                          >
                            {col.cell(row)}
                          </td>
                        ))}
                      </tr>
                      {expand && expanded && (
                        <tr>
                          <td colSpan={colCount} className="border-t border-gray-100 bg-gray-50/60 px-4 py-4 pb-6">
                            {expand.render(row)}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>

          {!hideFooter && (
            <div className="flex items-center justify-between gap-4 border-t border-gray-100 px-4 py-3 text-sm text-gray-500">
              <span>
                {countLabel
                  ? countLabel(visibleRows.length, total)
                  : `${visibleRows.length} mostradas · ${total} en total`}
              </span>
              {paginated && pageCount > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">
                    Página {page + 1} de {pageCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="rounded-md border border-gray-300 p-1.5 text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Página anterior"
                  >
                    <ChevronLeftIcon className="size-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                    disabled={page >= pageCount - 1}
                    className="rounded-md border border-gray-300 p-1.5 text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Página siguiente"
                  >
                    <ChevronRightIcon className="size-4" aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
