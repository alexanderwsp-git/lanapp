"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { EmptyState } from "@/components/ui/empty-state"
import { Field, TextInput } from "@/components/ui/form-fields"
import { StatusBadge } from "@/components/ui/status-badge"
import { fetchRecentWeanings, type ApiRecentWeaningRecord } from "@/lib/api/weaning"
import {
  displayKgValue,
  formatAgeDays,
  formatDailyGain,
  formatDisplayDate,
  shiftDateIso,
} from "@/lib/format"
import { labelCategory } from "@/lib/labels/sheep"
import { CheckCircleIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline"

const WINDOW_DAYS = 10

const today = () => new Date().toISOString().split("T")[0]

function defaultRange() {
  const to = today()
  return { from: shiftDateIso(to, -WINDOW_DAYS), to }
}

type WeaningRecentPanelProps = {
  refreshKey?: number
}

export function WeaningRecentPanel({ refreshKey = 0 }: WeaningRecentPanelProps) {
  const initial = defaultRange()
  const [fromDate, setFromDate] = useState(initial.from)
  const [toDate, setToDate] = useState(initial.to)
  const [referenceDate, setReferenceDate] = useState(today())
  const [rows, setRows] = useState<ApiRecentWeaningRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const data = await fetchRecentWeanings({ fromDate, toDate })
      setRows(data)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "No se pudieron cargar los destetes")
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [fromDate, toDate])

  useEffect(() => {
    load()
  }, [load, refreshKey])

  function applyLastDays(days: number) {
    const to = today()
    setFromDate(shiftDateIso(to, -days))
    setToDate(to)
  }

  function applyAroundReference() {
    if (!referenceDate) return
    setFromDate(shiftDateIso(referenceDate, -WINDOW_DAYS))
    setToDate(shiftDateIso(referenceDate, WINDOW_DAYS))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <p className="text-sm font-medium text-gray-900">Buscar por fecha</p>
        <p className="mt-0.5 text-xs text-gray-500">
          Por defecto: últimos {WINDOW_DAYS} días. También puedes centrar ±{WINDOW_DAYS} días en una fecha.
        </p>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <Field label="Desde" htmlFor="recent-from">
            <TextInput
              id="recent-from"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </Field>
          <Field label="Hasta" htmlFor="recent-to">
            <TextInput
              id="recent-to"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </Field>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            <MagnifyingGlassIcon className="h-4 w-4" aria-hidden="true" />
            Buscar
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => applyLastDays(WINDOW_DAYS)}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Últimos {WINDOW_DAYS} días
          </button>
          <button
            type="button"
            onClick={() => applyLastDays(30)}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Últimos 30 días
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-gray-200 pt-4">
          <Field label={`±${WINDOW_DAYS} días desde`} htmlFor="recent-ref">
            <TextInput
              id="recent-ref"
              type="date"
              value={referenceDate}
              onChange={(e) => setReferenceDate(e.target.value)}
            />
          </Field>
          <button
            type="button"
            onClick={applyAroundReference}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Aplicar rango
          </button>
        </div>
      </div>

      {loadError && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
          <button type="button" onClick={load} className="ml-2 font-semibold underline">
            Reintentar
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-lg bg-white shadow">
        {loading ? (
          <p className="p-8 text-center text-sm text-gray-500">Cargando destetes…</p>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={CheckCircleIcon}
            title="Sin destetes en este rango"
            description="Prueba ampliar las fechas o elegir otra fecha de referencia."
          />
        ) : (
          <div className="overflow-x-auto">
            <p className="border-b border-gray-100 px-4 py-2 text-xs text-gray-500">
              {rows.length} destete(s) entre {formatDisplayDate(fromDate)} y {formatDisplayDate(toDate)}
            </p>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    "Arete",
                    "Nombre",
                    "F. destete",
                    "Peso (kg)",
                    "Ganancia (g/día)",
                    "Categoría",
                    "F. nacimiento",
                    "Edad al destete",
                    "Lote",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium">
                      <Link href={`/sheep/${r.sheepId}`} className="text-indigo-600 hover:text-indigo-500">
                        {r.tag}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{r.name || "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                      {formatDisplayDate(r.weaningDate)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                      {displayKgValue(r.weaningWeight)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                      {formatDailyGain(r.dailyGain)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <StatusBadge color="indigo">{labelCategory(r.category)}</StatusBadge>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                      {formatDisplayDate(r.birthDate)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                      {formatAgeDays(r.birthDate, new Date(r.weaningDate))}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{r.lotId || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
