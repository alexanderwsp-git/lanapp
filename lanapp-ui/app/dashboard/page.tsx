"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { BreedingCycleStatus } from "@sheep/domain"
import { DashboardLayout } from "@/components/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { StatCard } from "@/components/ui/stat-card"
import { StatusBadge } from "@/components/ui/status-badge"
import { fetchBreedingCycles } from "@/lib/api/breeding-cycle"
import { fetchDashboardSummary } from "@/lib/api/reports"
import { fetchWeaningAlerts } from "@/lib/api/weaning"
import { formatAgeDays, formatDisplayDate, formatLastWeight } from "@/lib/format"
import { labelBreedingResult, breedingResultBadgeColor } from "@/lib/labels/breeding"
import {
  Squares2X2Icon,
  HeartIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
  ArrowRightIcon,
  BellAlertIcon,
} from "@heroicons/react/24/outline"

export default function DashboardPage() {
  const [total, setTotal] = useState(0)
  const [prenadas, setPrenadas] = useState(0)
  const [maltonas, setMaltonas] = useState(0)
  const [weaningAlerts, setWeaningAlerts] = useState<Awaited<ReturnType<typeof fetchWeaningAlerts>>>([])
  const [pendingCycles, setPendingCycles] = useState<Awaited<ReturnType<typeof fetchBreedingCycles>>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.allSettled([
      fetchDashboardSummary(),
      fetchWeaningAlerts(70),
      fetchBreedingCycles({ limit: 100 }),
    ]).then(([summaryResult, alertsResult, cyclesResult]) => {
      if (cancelled) return
      if (summaryResult.status === "fulfilled") {
        setTotal(summaryResult.value.totalSheep)
        setPrenadas(summaryResult.value.pregnantCount)
        setMaltonas(summaryResult.value.maltonasCount)
      }
      if (alertsResult.status === "fulfilled") {
        setWeaningAlerts(alertsResult.value)
      } else {
        setWeaningAlerts([])
      }
      if (cyclesResult.status === "fulfilled") {
        setPendingCycles(
          cyclesResult.value.filter(
            (c) => c.status === BreedingCycleStatus.ACTIVE && !c.result && !c.diagnosisDate,
          ),
        )
      } else {
        setPendingCycles([])
      }
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  function cycleEweLabel(cycle: (typeof pendingCycles)[number]): string {
    const ewe = cycle.ewe
    if (!ewe) return cycle.eweId
    return ewe.name ? `${ewe.tag} · ${ewe.name}` : ewe.tag
  }

  function cycleRamLabel(cycle: (typeof pendingCycles)[number]): string {
    if (!cycle.ramId) return "Sin asignar"
    const ram = cycle.ram
    if (!ram) return cycle.ramId
    return ram.name ? `${ram.tag} · ${ram.name}` : ram.tag
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Dashboard"
        description="Resumen general de Granja San Alfonso"
        action={
          <Link
            href="/sheep"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            Ver ovejas
          </Link>
        }
      />

      {loading ? (
        <p className="text-sm text-gray-500">Cargando resumen…</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total ovejas" value={total} icon={Squares2X2Icon} hint="Rebaño activo" />
            <StatCard label="Preñadas" value={prenadas} icon={HeartIcon} hint="En gestación" />
            <StatCard label="Maltonas" value={maltonas} icon={SparklesIcon} hint="Destetadas" />
            <StatCard
              label="Alertas destete"
              value={weaningAlerts.length}
              icon={ExclamationTriangleIcon}
              hint="Listas para destetar"
            />
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="rounded-lg bg-white p-6 shadow lg:col-span-2">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-900">Ciclos pendientes de diagnóstico</h2>
                <Link
                  href="/planner"
                  className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Ver planificador
                  <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
              {pendingCycles.length === 0 ? (
                <p className="mt-4 text-sm text-gray-500">Sin ciclos pendientes de ECO.</p>
              ) : (
                <ul className="mt-4 flex flex-col divide-y divide-gray-100">
                  {pendingCycles.slice(0, 8).map((b) => (
                    <li key={b.id} className="flex items-center gap-4 py-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
                        <CalendarDaysIcon className="h-5 w-5 text-indigo-600" aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">{cycleEweLabel(b)}</p>
                        <p className="truncate text-xs text-gray-500">Reproductor: {cycleRamLabel(b)} · {b.cycleName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-700">{b.matingDate?.slice(0, 10)}</p>
                        <StatusBadge color={breedingResultBadgeColor(b.result)}>
                          {labelBreedingResult(b.result)}
                        </StatusBadge>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-lg bg-white p-6 shadow">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-900">Alertas de destete</h2>
                <Link href="/weaning" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                  Ver
                </Link>
              </div>
              {weaningAlerts.length === 0 ? (
                <p className="mt-4 text-sm text-gray-500">Sin alertas de destete.</p>
              ) : (
                <ul className="mt-4 flex flex-col gap-3">
                  {weaningAlerts.slice(0, 6).map((w) => (
                    <li key={w.id} className="flex items-center gap-3 rounded-md bg-yellow-50 p-3">
                      <BellAlertIcon className="h-5 w-5 shrink-0 text-yellow-600" aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {w.tag} {w.name ? `· ${w.name}` : ""}
                        </p>
                        <p className="text-xs text-gray-600">
                          {formatDisplayDate(w.birthDate)} · {formatAgeDays(w.birthDate)} · {formatLastWeight(w)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  )
}
