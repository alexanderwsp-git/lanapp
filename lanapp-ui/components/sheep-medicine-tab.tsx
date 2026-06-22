"use client"

import { useCallback, useEffect, useState } from "react"
import { StatusBadge } from "@/components/ui/status-badge"
import { DataTable } from "@/components/ui/data-table"
import { MedicineApplyDrawer } from "@/components/medicine-apply-drawer"
import { MedicineScheduleDrawer } from "@/components/medicine-schedule-drawer"
import { SheepMedicineSummary } from "@/components/sheep-medicine-summary"
import { fetchMedicines } from "@/lib/api/medicine"
import type { ApiMedicine, ApiMedicineApplication, ApiSheep } from "@/lib/api/types"
import { medicineEligibility } from "@/lib/sheep-action-eligibility"
import { IconApplyMedicine, IconMedicine } from "@/lib/icons/analysis-medicine"
import { labelMedicineStatus, labelMedicineType, medicineStatusColor } from "@/lib/labels/medicine"
import { MedicineStatus } from "@sheep/domain"
import { formatDisplayDate, formatMedicineNotes } from "@/lib/format"

const isScheduled = (status: string) =>
  status === MedicineStatus.SCHEDULED || String(status).toLowerCase() === "scheduled"

export function SheepMedicineTab({
  sheep,
  applications,
  onUpdated,
}: {
  sheep: ApiSheep
  applications: ApiMedicineApplication[]
  onUpdated?: () => void | Promise<void>
}) {
  const sheepId = sheep.id
  const sheepLabel = sheep.name ? `${sheep.tag} · ${sheep.name}` : sheep.tag

  const [medicines, setMedicines] = useState<ApiMedicine[]>([])
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [applyTarget, setApplyTarget] = useState<ApiMedicineApplication | null>(null)

  const loadCatalog = useCallback(async () => {
    setCatalogLoading(true)
    setCatalogError(null)
    try {
      const result = await fetchMedicines(1, 100)
      setMedicines(result.items)
    } catch (err) {
      setMedicines([])
      setCatalogError(err instanceof Error ? err.message : "No se pudo cargar el catálogo")
    } finally {
      setCatalogLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadCatalog()
  }, [loadCatalog])

  const pending = applications.filter((a) => isScheduled(a.status)).length
  const registerBlockReason =
    medicineEligibility(sheep) ??
    (medicines.length === 0 && !catalogLoading ? "No hay medicamentos en el catálogo" : null)

  async function handleSaved(message: string) {
    setSuccess(message)
    await onUpdated?.()
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg bg-white p-6 shadow">
        <SheepMedicineSummary sheepId={sheepId} applications={applications} embedded />
      </div>
      <div className="rounded-lg bg-white p-6 shadow">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900">
          <IconMedicine className="h-5 w-5 text-gray-400" aria-hidden="true" />
          Medicina
        </h3>
        <button
          type="button"
          onClick={() => {
            if (registerBlockReason) return
            setScheduleOpen(true)
          }}
          disabled={!!registerBlockReason}
          title={registerBlockReason ?? undefined}
          className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <IconApplyMedicine className="h-4 w-4" aria-hidden="true" />
          Nueva aplicación
        </button>
      </div>
      <p className="mt-1 text-sm text-gray-500">
        Aplicaciones de fármacos y vacunas registradas para esta oveja.{" "}
        {pending > 0 ? `${pending} programada(s).` : ""}
      </p>

      {catalogError && (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {catalogError}
        </div>
      )}

      {!catalogLoading && !catalogError && medicines.length === 0 && (
        <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          No hay medicamentos en el catálogo.{" "}
          <a href="/medicines" className="font-medium text-indigo-600 hover:text-indigo-500">
            Ir a Medicamentos
          </a>
        </div>
      )}

      {success && (
        <div className="mt-3 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          {success}
        </div>
      )}

      <div className="mt-4">
        <DataTable
          bare
          hideFooter
          rows={applications}
          rowKey={(a) => a.id}
          loading={false}
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
              cell: (a) => formatMedicineNotes(a.notes),
            },
            {
              key: "actions",
              header: "",
              align: "right",
              className: "whitespace-nowrap",
              cell: (a) =>
                isScheduled(a.status) ? (
                  <button
                    type="button"
                    onClick={() => setApplyTarget(a)}
                    className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-indigo-600"
                    title="Registrar aplicación"
                    aria-label="Registrar aplicación"
                  >
                    <IconApplyMedicine className="h-5 w-5" aria-hidden="true" />
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
        onSaved={handleSaved}
      />

      <MedicineApplyDrawer
        open={!!applyTarget}
        onClose={() => setApplyTarget(null)}
        application={applyTarget}
        medicineName={applyTarget?.medicine?.name ?? "Medicamento"}
        sheepLabel={sheepLabel}
        onSaved={() => handleSaved("Aplicación registrada.")}
      />
      </div>
    </div>
  )
}
