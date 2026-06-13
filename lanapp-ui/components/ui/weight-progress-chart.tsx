"use client"

import { useMemo } from "react"

export type WeightChartPoint = {
  date: string
  weight: number
  label?: string
}

type WeightProgressChartProps = {
  points: WeightChartPoint[]
  height?: number
  className?: string
}

function parseDate(value: string) {
  return new Date(`${value.split("T")[0]}T12:00:00`)
}

function formatAxisDate(value: string) {
  return parseDate(value).toLocaleDateString("es-EC", { day: "numeric", month: "short" })
}

export function WeightProgressChart({ points, height = 220, className = "" }: WeightProgressChartProps) {
  const sorted = useMemo(
    () => [...points].sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime()),
    [points]
  )

  const layout = useMemo(() => {
    if (sorted.length === 0) return null

    const pad = { top: 16, right: 16, bottom: 36, left: 44 }
    const width = 560
    const innerW = width - pad.left - pad.right
    const innerH = height - pad.top - pad.bottom

    const weights = sorted.map((p) => p.weight)
    const minW = Math.min(...weights)
    const maxW = Math.max(...weights)
    const span = maxW - minW || 1
    const yMin = minW - span * 0.12
    const yMax = maxW + span * 0.12

    const xAt = (i: number) =>
      sorted.length === 1 ? pad.left + innerW / 2 : pad.left + (i / (sorted.length - 1)) * innerW

    const yAt = (w: number) => pad.top + innerH - ((w - yMin) / (yMax - yMin)) * innerH

    const coords = sorted.map((p, i) => ({ ...p, x: xAt(i), y: yAt(p.weight) }))
    const linePath =
      coords.length > 1
        ? coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(" ")
        : ""

    const yTicks = [yMin, yMin + (yMax - yMin) / 2, yMax]

    return { width, pad, innerH, coords, linePath, yTicks, yAt, yMin, yMax }
  }, [sorted, height])

  if (!layout || sorted.length === 0) {
    return (
      <div className={`flex items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 p-8 text-sm text-gray-500 ${className}`}>
        Registra al menos un pesaje para ver el gráfico de progreso.
      </div>
    )
  }

  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  const totalDelta = last.weight - first.weight
  const daysSpan =
    sorted.length > 1
      ? Math.round(
          (parseDate(last.date).getTime() - parseDate(first.date).getTime()) / (1000 * 60 * 60 * 24)
        )
      : 0

  return (
    <div className={`rounded-lg border border-gray-100 bg-white p-4 ${className}`}>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold text-gray-900">Progreso de peso</h4>
          <p className="text-xs text-gray-500">Evolución entre pesajes periódicos (kg)</p>
        </div>
        {sorted.length > 1 && (
          <dl className="flex gap-4 text-xs">
            <div>
              <dt className="text-gray-400">Variación</dt>
              <dd className={`font-semibold ${totalDelta >= 0 ? "text-green-600" : "text-red-600"}`}>
                {totalDelta >= 0 ? "+" : ""}
                {totalDelta.toFixed(1)} kg
              </dd>
            </div>
            <div>
              <dt className="text-gray-400">Período</dt>
              <dd className="font-semibold text-gray-700">{daysSpan} días</dd>
            </div>
          </dl>
        )}
      </div>

      <svg
        viewBox={`0 0 ${layout.width} ${height}`}
        className="w-full text-gray-500"
        role="img"
        aria-label="Gráfico de progreso de peso"
      >
        {layout.yTicks.map((tick) => (
          <g key={tick}>
            <line
              x1={layout.pad.left}
              x2={layout.width - layout.pad.right}
              y1={layout.yAt(tick)}
              y2={layout.yAt(tick)}
              stroke="currentColor"
              strokeOpacity={0.12}
            />
            <text
              x={layout.pad.left - 8}
              y={layout.yAt(tick)}
              textAnchor="end"
              dominantBaseline="middle"
              className="fill-gray-400 text-[10px]"
            >
              {tick.toFixed(1)}
            </text>
          </g>
        ))}

        {layout.linePath && (
          <path
            d={layout.linePath}
            fill="none"
            stroke="#4f46e5"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {layout.coords.map((c) => (
          <g key={`${c.date}-${c.weight}`}>
            <circle cx={c.x} cy={c.y} r={5} fill="#4f46e5" stroke="#fff" strokeWidth={2} />
            <text x={c.x} y={height - 10} textAnchor="middle" className="fill-gray-500 text-[10px]">
              {formatAxisDate(c.date)}
            </text>
            <text x={c.x} y={c.y - 10} textAnchor="middle" className="fill-gray-800 text-[10px] font-semibold">
              {c.weight} kg
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}
