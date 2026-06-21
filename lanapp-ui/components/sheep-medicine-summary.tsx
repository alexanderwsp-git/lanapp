"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { MedicineStatus } from "@sheep/domain"
import { StatCard } from "@/components/ui/stat-card"
import { fetchMedicineApplicationsBySheep } from "@/lib/api/medicine"
import type { ApiMedicineApplication } from "@/lib/api/types"
import { labelMedicineType } from "@/lib/labels/medicine"
import { formatDisplayDate } from "@/lib/format"
import { IconMedicine } from "@/lib/icons/analysis-medicine"
import { BeakerIcon, ClockIcon } from "@heroicons/react/24/outline"

const isScheduled = (status: string) =>
  status === MedicineStatus.SCHEDULED || String(status).toLowerCase() === "scheduled"

export function SheepMedicineSummary({
  sheepId,
  onViewTab,
  embedded = false,
}: {
  sheepId: string
  onViewTab?: () => void
  embedded?: boolean
}) {
  const [apps, setApps] = useState<ApiMedicineApplication[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const list = await fetchMedicineApplicationsBySheep(sheepId)
      setApps(
        [...list].sort(
          (a, b) => new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime(),
        ),
      )
    } catch {
      setApps([])
    } finally {
      setLoading(false)
    }
  }, [sheepId])

  useEffect(() => {
    load()
  }, [load])

  const pending = useMemo(() => apps.filter((a) => isScheduled(a.status)).length, [apps])
  const lastApplied = useMemo(
    () => apps.find((a) => !isScheduled(a.status) && a.status !== MedicineStatus.CANCELLED),
    [apps],
  )

  if (loading) {
    return <p className="text-sm text-gray-500">Cargando resumen de medicina…</p>
  }

  return (
    <div className="flex flex-col gap-3">
      {!embedded && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <IconMedicine className="h-5 w-5 text-gray-400" aria-hidden="true" />
            Medicina
          </h3>
          {onViewTab ? (
            <button
              type="button"
              onClick={onViewTab}
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-500"
            >
              Ver pestaña Medicina
            </button>
          ) : (
            <Link
              href={`/sheep/${sheepId}?tab=medicina`}
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-500"
            >
              Ver pestaña Medicina
            </Link>
          )}
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          label="Programadas"
          value={pending}
          icon={ClockIcon}
          hint={pending > 0 ? "Pendientes de aplicar" : "Sin dosis programadas"}
        />
        <StatCard
          label="Última aplicada"
          value={
            lastApplied
              ? `${lastApplied.medicine?.name ?? "Medicamento"} · ${formatDisplayDate(lastApplied.applicationDate)}`
              : "—"
          }
          icon={BeakerIcon}
          hint={
            lastApplied?.medicine?.type
              ? labelMedicineType(lastApplied.medicine.type)
              : "Sin aplicaciones registradas"
          }
        />
      </div>
    </div>
  )
}
