"use client"

import { useEffect, useMemo, useRef, useState, type RefObject } from "react"
import { Gender, MatingStatus } from "@sheep/domain"
import { SparklesIcon } from "@heroicons/react/24/outline"
import { fetchMatingsBySheep, type ApiMating } from "@/lib/api/mating"
import type { ApiSheep } from "@/lib/api/types"
import { formatDisplayDate } from "@/lib/format"

type Metric = {
  label: string
  value: string | number
  hint?: string
}

/**
 * Panel de efectividad reproductiva para el detalle de una oveja.
 * - Macho: hembras montadas, montas efectivas, % efectividad, crías.
 * - Hembra: reproductores, montas efectivas (preñeces), % efectividad, crías.
 */
export function SheepReproStats({
  sheep,
  offspring,
  loadWhenVisible = false,
  visibleRef,
  forceLoad = false,
}: {
  sheep: ApiSheep
  offspring: ApiSheep[]
  loadWhenVisible?: boolean
  visibleRef?: RefObject<HTMLElement | null>
  forceLoad?: boolean
}) {
  const [matings, setMatings] = useState<ApiMating[]>([])
  const [loading, setLoading] = useState(!loadWhenVisible && !forceLoad)
  const [shouldLoad, setShouldLoad] = useState(!loadWhenVisible || forceLoad)
  const fallbackRef = useRef<HTMLDivElement>(null)
  const observeRef = visibleRef ?? fallbackRef

  const isMale = sheep.gender === Gender.MALE

  useEffect(() => {
    if (!loadWhenVisible || forceLoad) return

    const el = observeRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true)
          observer.disconnect()
        }
      },
      { rootMargin: "120px" },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [loadWhenVisible, forceLoad, observeRef])

  useEffect(() => {
    if (!shouldLoad) return

    let cancelled = false
    setLoading(true)
    fetchMatingsBySheep(sheep.id)
      .then((m) => {
        if (!cancelled) setMatings(m)
      })
      .catch(() => {
        if (!cancelled) setMatings([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [sheep.id, shouldLoad])

  const stats = useMemo(() => {
    const total = matings.length
    const effective = matings.filter((m) => m.status === MatingStatus.EFFECTIVE).length
    const ineffective = matings.filter((m) => m.status === MatingStatus.INEFFECTIVE).length
    const pending = matings.filter((m) => m.status === MatingStatus.PENDING).length
    const resolved = effective + ineffective
    const rate = resolved > 0 ? Math.round((effective / resolved) * 100) : 0
    const partners = new Set(matings.map((m) => (isMale ? m.femaleId : m.maleId)))
    const lastDate = matings
      .map((m) => m.matingDate)
      .sort()
      .at(-1)
    return { total, effective, ineffective, pending, resolved, rate, partners: partners.size, lastDate }
  }, [matings, isMale])

  const metrics: Metric[] = isMale
    ? [
        { label: "Hembras montadas", value: stats.partners, hint: "Distintas hembras" },
        { label: "Montas totales", value: stats.total, hint: `${stats.pending} pendientes` },
        { label: "Montas efectivas", value: stats.effective, hint: `de ${stats.resolved} diagnosticadas` },
        { label: "Crías registradas", value: offspring.length, hint: "En el rebaño" },
      ]
    : [
        { label: "Reproductores", value: stats.partners, hint: "Distintos machos" },
        { label: "Montas totales", value: stats.total, hint: `${stats.pending} pendientes` },
        { label: "Preñeces logradas", value: stats.effective, hint: `de ${stats.resolved} diagnosticadas` },
        { label: "Crías registradas", value: offspring.length, hint: "En el rebaño" },
      ]

  const content = (() => {
    if (loadWhenVisible && !shouldLoad) {
      return null
    }

    if (loading) {
      return (
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="h-5 w-48 animate-pulse rounded bg-gray-200" />
          <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-md bg-gray-100" />
            ))}
          </div>
        </div>
      )
    }

    if (stats.total === 0) {
      return (
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <SparklesIcon className="h-5 w-5 text-gray-400" />
            Efectividad reproductiva
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Sin montas registradas todavía. Las métricas aparecerán cuando se registren montas en la pestaña Montas.
          </p>
        </div>
      )
    }

    return (
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <SparklesIcon className="h-5 w-5 text-gray-400" />
            Efectividad reproductiva
          </h3>
          {stats.lastDate && (
            <span className="text-xs text-gray-500">Última monta: {formatDisplayDate(stats.lastDate)}</span>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {metrics.map((m) => (
            <div key={m.label} className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{m.label}</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{m.value}</p>
              {m.hint && <p className="mt-0.5 text-xs text-gray-500">{m.hint}</p>}
            </div>
          ))}
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700">Tasa de efectividad</span>
            <span className="font-semibold text-gray-900">{stats.rate}%</span>
          </div>
          <div
            className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-gray-200"
            role="progressbar"
            aria-valuenow={stats.rate}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className={`h-full rounded-full ${
                stats.rate >= 70 ? "bg-green-500" : stats.rate >= 40 ? "bg-amber-500" : "bg-red-500"
              }`}
              style={{ width: `${stats.rate}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-gray-500">
            {stats.resolved > 0
              ? `${stats.effective} efectivas y ${stats.ineffective} inefectivas de ${stats.resolved} montas diagnosticadas.`
              : "Aún no hay montas diagnosticadas para calcular la tasa."}
          </p>
        </div>
      </div>
    )
  })()

  if (visibleRef) {
    return content
  }

  return <div ref={fallbackRef}>{content}</div>
}
