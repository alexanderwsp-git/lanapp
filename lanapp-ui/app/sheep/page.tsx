"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import type { Gender, SheepStatus } from "@sheep/domain"
import { DashboardLayout } from "@/components/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { StatusBadge } from "@/components/ui/status-badge"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { EmptyState } from "@/components/ui/empty-state"
import { deleteSheep, fetchSheep } from "@/lib/api/sheep"
import type { ApiSheep } from "@/lib/api/types"
import {
  labelCategory,
  labelGender,
  labelStatus,
  genderOptions,
  statusOptions,
  statusColor,
} from "@/lib/labels/sheep"
import { formatDisplayDate, formatAgeDays, formatLastWeight } from "@/lib/format"
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  EyeIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline"

export default function SheepListPage() {
  const [rows, setRows] = useState<ApiSheep[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [gender, setGender] = useState<Gender | "">("")
  const [status, setStatus] = useState<SheepStatus | "">("")
  const [toDelete, setToDelete] = useState<ApiSheep | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const result = await fetchSheep({
        page: 1,
        limit: 200,
        gender: gender || undefined,
        status: status || undefined,
      })
      setRows(result.items)
      setTotal(result.total)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "No se pudo cargar el inventario")
      setRows([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [gender, status])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return rows
    return rows.filter((s) => {
      const name = (s.name ?? "").toLowerCase()
      return s.tag.toLowerCase().includes(q) || name.includes(q) || s.breed.toLowerCase().includes(q)
    })
  }, [rows, query])

  async function confirmDelete() {
    if (!toDelete) return
    setDeleting(true)
    try {
      await deleteSheep(toDelete.id)
      setToDelete(null)
      await load()
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "No se pudo eliminar")
      setToDelete(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Ovejas"
        description="Inventario del rebaño de Granja San Alfonso"
        action={
          <Link
            href="/sheep/new"
            className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            <PlusIcon className="h-5 w-5" aria-hidden="true" />
            Nueva oveja
          </Link>
        }
      />

      <div className="flex flex-col gap-3 rounded-lg bg-white p-4 shadow sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por arete, nombre o raza"
            className="w-full rounded-md border-0 py-2 pl-10 pr-3 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
          />
        </div>
        <select
          value={gender}
          onChange={(e) => setGender(e.target.value as Gender | "")}
          className="rounded-md border-0 py-2 pl-3 pr-8 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
        >
          <option value="">Todo sexo</option>
          {genderOptions.map((g) => (
            <option key={g} value={g}>
              {labelGender(g)}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as SheepStatus | "")}
          className="rounded-md border-0 py-2 pl-3 pr-8 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
        >
          <option value="">Todo estado</option>
          {statusOptions.map((s) => (
            <option key={s} value={s}>
              {labelStatus(s)}
            </option>
          ))}
        </select>
      </div>

      {loadError && (
        <div className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
          <button type="button" onClick={load} className="ml-2 font-semibold underline">
            Reintentar
          </button>
        </div>
      )}

      <div className="mt-4 overflow-hidden rounded-lg bg-white shadow">
        {loading ? (
          <p className="p-8 text-center text-sm text-gray-500">Cargando inventario...</p>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Squares2X2Icon}
            title="Sin resultados"
            description={
              rows.length === 0
                ? "No hay ovejas registradas. Agrega la primera."
                : "No se encontraron ovejas con los filtros aplicados."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {["Arete", "Nombre", "Sexo", "Raza", "F. nacimiento", "Edad", "Categoría", "Último peso", "Estado", ""].map((h) => (
                    <th
                      key={h}
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filtered.map((s) => {
                  const statusLabel = labelStatus(s.status)
                  return (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-indigo-600">
                        <Link href={`/sheep/${s.id}`}>{s.tag}</Link>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">{s.name ?? "—"}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{labelGender(s.gender)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{s.breed}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                        {formatDisplayDate(s.birthDate)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                        {formatAgeDays(s.birthDate)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{labelCategory(s.category)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{formatLastWeight(s)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm">
                        <StatusBadge color={statusColor[statusLabel] ?? statusColor[s.status] ?? "gray"}>
                          {statusLabel}
                        </StatusBadge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/sheep/${s.id}`}
                            className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                            aria-label={`Ver ${s.tag}`}
                          >
                            <EyeIcon className="h-5 w-5" />
                          </Link>
                          <Link
                            href={`/sheep/${s.id}/edit`}
                            className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-indigo-600"
                            aria-label={`Editar ${s.tag}`}
                          >
                            <PencilSquareIcon className="h-5 w-5" />
                          </Link>
                          <button
                            onClick={() => setToDelete(s)}
                            className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                            aria-label={`Eliminar ${s.tag}`}
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="mt-3 text-sm text-gray-500">
        {filtered.length} mostradas · {total} en total
      </p>

      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar oveja"
        message={`¿Seguro que deseas eliminar a ${toDelete?.tag}${toDelete?.name ? ` (${toDelete.name})` : ""}? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </DashboardLayout>
  )
}
