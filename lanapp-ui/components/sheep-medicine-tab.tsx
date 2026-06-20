"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { BeakerIcon, CheckCircleIcon, PlusIcon } from "@heroicons/react/24/outline"
import { MedicineStatus } from "@sheep/domain"
import { StatusBadge } from "@/components/ui/status-badge"
import { DataTable } from "@/components/ui/data-table"
import { MedicineApplyDrawer } from "@/components/medicine-apply-drawer"
import { MedicineScheduleDrawer } from "@/components/medicine-schedule-drawer"
import {
  fetchMedicineApplicationsBySheep,
  fetchMedicines,
} from "@/lib/api/medicine"
import type { ApiMedicine, ApiMedicineApplication, ApiSheep } from "@/lib/api/types"
import { labelMedicineStatus, labelMedicineType, medicineStatusColor } from "@/lib/labels/medicine"
import { formatDisplayDate } from "@/lib/format"

const isScheduled = (status: string) =>
  status === MedicineStatus.SCHEDULED || String(status).toLowerCase() === "scheduled"

export function SheepMedicineTab({
  sheep,
  onUpdated,
}: {
  sheep: ApiSheep
  onUpdated?: () => void | Promise<void>
}) {
  const sheepId = sheep.id
  const sheepLabel = sheep.name ? `${sheep.tag} · ${sheep.name}` : sheep.tag

  const [apps, setApps] = useState<ApiMedicineApplication[]>([])
  const [medicines, setMedicines] = useState<ApiMedicine[]>([])
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState<string | null>(null)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [applyTarget, setApplyTarget] = useState<ApiMedicineApplication | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [list, medPage] = await Promise.all([
        fetchMedicineApplicationsBySheep(sheepId),
        fetchMedicines(1, 100),
      ])
      const sorted = [...list].sort(
        (a, b) => new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime(),
      )
      setApps(sorted)
      setMedicines(medPage.items)
    } catch {
      setApps([])
      setMedicines([])
    } finally {
      setLoading(false)
    }
  }, [sheepId])

  useEffect(() => {
    load()
  }, [load])

  const pending = apps.filter((a) => isScheduled(a.status)).length

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900">
          <BeakerIcon className="h-5 w-5 text-gray-400" />
          Medicina
        </h3>
        <button
          type="button"
          onClick={() => setScheduleOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          <PlusIcon className="h-4 w-4" />
          Nueva aplicación
        </button>
      </div>
      <p className="mt-1 text-sm text-gray-500">
        Aplicaciones de fármacos y vacunas registradas para esta oveja.{" "}
        {pending > 0 ? `${pending} programada(s).` : ""}
      </p>

      {success && (
        <div className="mt-3 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          {success}
        </div>
      )}

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
            {
              key: "notes",
              header: "Notas",
              cell: (a) => (
                <span className="flex flex-col gap-0.5">
                  {a.notes ? <span>{a.notes}</span> : <span>—</span>}
                  {a.analysisId ? (
                    <Link
                      href="/analysis"
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      Desde análisis
                    </Link>
                  ) : null}
                </span>
              ),
            },
            {
              key: "actions",
              header: "Acciones",
              align: "right",
              cell: (a) =>
                isScheduled(a.status) ? (
                  <button
                    type="button"
                    onClick={() => setApplyTarget(a)}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
                  >
                    <CheckCircleIcon className="h-4 w-4" />
                    Registrar aplicación
                  </button>
                ) : (
                  <span className="text-xs text-gray-400">—</span>
                ),
            },
          ]}
        />
      </div>

      <MedicineScheduleDrawer
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        sheepId={sheepId}
        sheepLabel={sheepLabel}
        medicines={medicines}
        onSaved={async (message) => {
          setSuccess(message)
          await load()
          await onUpdated?.()
        }}
      />

      <MedicineApplyDrawer
        open={!!applyTarget}
        onClose={() => setApplyTarget(null)}
        application={applyTarget}
        medicineName={applyTarget?.medicine?.name ?? "Medicamento"}
        sheepLabel={sheepLabel}
        onSaved={async () => {
          setSuccess("Aplicación registrada.")
          await load()
          await onUpdated?.()
        }}
      />
    </div>
  )
}
