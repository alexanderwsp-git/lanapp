"use client"

import { useMemo } from "react"
import { ScaleIcon } from "@heroicons/react/24/outline"
import {
  WeightProgressChart,
  type WeightChartPoint,
  computeWeightSummary,
} from "@/components/ui/weight-progress-chart"
import { toDateInputValue } from "@/lib/format"
import type { ApiWeight } from "@/lib/api/weight"

type SheepWeightSummaryProps = {
  records: ApiWeight[]
  loading?: boolean
  maxPoints?: number
  compact?: boolean
}

export function SheepWeightSummary({
  records,
  loading,
  maxPoints = 5,
  compact = false,
}: SheepWeightSummaryProps) {
  const points = useMemo<WeightChartPoint[]>(
    () =>
      [...records]
        .sort(
          (a, b) =>
            new Date(a.measurementDate).getTime() - new Date(b.measurementDate).getTime(),
        )
        .slice(-maxPoints)
        .map((w) => ({
          date: toDateInputValue(w.measurementDate),
          weight: Number(w.weight),
        })),
    [records, maxPoints],
  )

  const summary = useMemo(() => computeWeightSummary(points), [points])

  if (loading) {
    return <div className="h-32 animate-pulse rounded-lg bg-gray-100" />
  }

  if (points.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
        Sin pesajes registrados. El resumen aparecerá cuando haya al menos uno.
      </div>
    )
  }

  const last = points[points.length - 1]

  return (
    <div className="rounded-lg bg-white p-4 shadow">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <ScaleIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            Resumen de peso
          </h3>
          <p className="mt-1 text-xs text-gray-500">
            {compact
              ? `Últimos ${points.length} pesaje(s)`
              : "Evolución reciente entre pesajes periódicos (kg)"}
          </p>
        </div>
        <dl className="flex gap-4 text-xs">
          <div>
            <dt className="text-gray-400">Último peso</dt>
            <dd className="font-semibold text-gray-900">{last.weight} kg</dd>
          </div>
          {summary && points.length > 1 && (
            <>
              <div>
                <dt className="text-gray-400">Variación</dt>
                <dd
                  className={`font-semibold ${summary.totalDelta >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {summary.totalDelta >= 0 ? "+" : ""}
                  {summary.totalDelta.toFixed(1)} kg
                </dd>
              </div>
              <div>
                <dt className="text-gray-400">Período</dt>
                <dd className="font-semibold text-gray-700">{summary.daysSpan} días</dd>
              </div>
            </>
          )}
        </dl>
      </div>

      <WeightProgressChart
        points={points}
        height={compact ? 140 : 220}
        hideHeader
        className="border-0 p-0 shadow-none"
      />
    </div>
  )
}
