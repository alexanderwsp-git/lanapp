"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { BeakerIcon, ArrowRightCircleIcon, CheckCircleIcon, ClockIcon } from "@heroicons/react/24/outline"
import { StatusBadge } from "@/components/ui/status-badge"
import { DataTable } from "@/components/ui/data-table"
import { fetchMedicineApplicationsBySheep } from "@/lib/api/medicine"
import { labelMedicineStatus, labelMedicineType, medicineStatusColor } from "@/lib/labels/medicine"
import type { ApiMedicineApplication } from "@/lib/api/types"
import { formatDisplayDate, toDateInputValue } from "@/lib/format"

const today = () => new Date().toISOString().slice(0, 10)

/**
 * Historial y resumen de medicina por oveja. Reemplaza al bloque que vivía
 * dentro de la pestaña General y agrega KPIs de aplicaciones aplicadas /
 * pendientes con un acceso directo a programar.
 */
export function SheepMedicineTab({ sheepId }: { sheepId: string }) {
  const [apps, setApps] = useState<ApiMedicineApplication[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchMedicineApplicationsBySheep(sheepId)
      .then((list) => {
        if (cancelled) return
        const sorted = [...list].sort(
          (a, b) => new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime(),
        )
        setApps(sorted)
      })
      .catch(() => {
        if (!cancelled) setApps([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [sheepId])

  const summary = useMemo(() => {
    const t = today()
    let applied = 0
    let upcoming = 0
    let lastDate: string | null = null
    for (const a of apps) {
      const isApplied = String(a.status).toLowerCase().includes("applied") || a.status === "Applied"
      if (isApplied) {
        applied += 1
        const d = toDateInputValue(a.applicationDate)
        if (!lastDate || d > lastDate) lastDate = d
      } else if (toDateInputValue(a.applicationDate) >= t) {
        upcoming += 1
      }
    }
    return { applied, upcoming, lastDate }
  }, [apps])

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="h-5 w-5 text-green-500" />
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Aplicadas</p>
          </div>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{summary.applied}</p>
          <p className="mt-0.5 text-xs text-gray-500">
            {summary.lastDate ? `Última: ${formatDisplayDate(summary.lastDate)}` : "Sin aplicaciones"}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <ClockIcon className="h-5 w-5 text-blue-500" />
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Programadas</p>
          </div>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{summary.upcoming}</p>
          <p className="mt-0.5 text-xs text-gray-500">Pendientes por aplicar</p>
        </div>
        <div className="flex items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
          <Link
            href={`/medicines?scheduleSheep=${sheepId}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-500"
          >
            <ArrowRightCircleIcon className="h-5 w-5" />
            Programar aplicación
          </Link>
        </div>
      </div>

      <div className="rounded-lg bg-white p-6 shadow">
        <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900">
          <BeakerIcon className="h-5 w-5 text-gray-400" />
          Historial de medicina
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Aplicaciones de fármacos y vacunas registradas para esta oveja.
        </p>
        <div className="mt-4">
          <DataTable
            bare
            hideFooter
            rows={apps}
            rowKey={(a) => a.id}
            loading={loading}
            loadingText="Cargando aplicaciones…"
            empty={<p className="text-sm text-gray-500">Sin aplicaciones registradas.</p>}
            columns={[
              {
                key: "date",
                header: "Fecha",
                className: "whitespace-nowrap text-gray-900",
                cell: (a) => formatDisplayDate(a.applicationDate),
              },
              {
                key: "medicine",
                header: "Medicamento",
                className: "whitespace-nowrap",
                cell: (a) => a.medicine?.name || "—",
              },
              {
                key: "type",
                header: "Tipo",
                className: "whitespace-nowrap",
                cell: (a) => (a.medicine?.type ? labelMedicineType(a.medicine.type) : "—"),
              },
              {
                key: "status",
                header: "Estado",
                className: "whitespace-nowrap",
                cell: (a) => (
                  <StatusBadge color={medicineStatusColor[a.status] ?? "gray"}>
                    {labelMedicineStatus(a.status)}
                  </StatusBadge>
                ),
              },
              { key: "notes", header: "Notas", cell: (a) => a.notes || "—" },
            ]}
          />
        </div>
      </div>
    </div>
  )
}
