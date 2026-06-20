"use client"

import { useCallback, useEffect, useState } from "react"
import { StatusBadge } from "@/components/ui/status-badge"
import { DataTable } from "@/components/ui/data-table"
import { AnalysisDiagnosisDrawer } from "@/components/analysis-diagnosis-drawer"
import { isAnalysisDue, todayInput } from "@/lib/analysis/due"
import { fetchAnalysesBySheep, fetchAnalysisTypes } from "@/lib/api/analysis"
import { fetchMedicines } from "@/lib/api/medicine"
import type { ApiMedicine, ApiSheep } from "@/lib/api/types"
import { analysisEligibility } from "@/lib/sheep-action-eligibility"
import { AnalysisStatus, AnalysisType, type ApiAnalysis, type ApiAnalysisType } from "@/lib/analysis/types"
import {
  IconAdd,
  IconAnalysis,
  IconDiagnosis,
  IconDue,
  IconEdit,
} from "@/lib/icons/analysis-medicine"
import {
  analysisStatusColor,
  famachaColor,
  labelAnalysisStatus,
  labelAnalysisType,
} from "@/lib/labels/analysis"
import { formatDisplayDate, toDateInputValue } from "@/lib/format"
import { MdOutlineAnalytics } from "react-icons/md"

function resultCell(a: ApiAnalysis) {
  if (a.status === AnalysisStatus.SCHEDULED) {
    return <span className="text-gray-400">Pendiente</span>
  }
  if (a.analysisType?.type === AnalysisType.FAMACHA && a.famachaScore != null) {
    return <StatusBadge color={famachaColor(a.famachaScore)}>{`FAMACHA ${a.famachaScore}`}</StatusBadge>
  }
  if (a.resultValue) return <span className="text-gray-900">{a.resultValue}</span>
  return <span className="text-gray-400">—</span>
}

function sortAnalyses(list: ApiAnalysis[]): ApiAnalysis[] {
  return [...list].sort((a, b) => {
    const aPending = a.status === AnalysisStatus.SCHEDULED ? 0 : 1
    const bPending = b.status === AnalysisStatus.SCHEDULED ? 0 : 1
    if (aPending !== bPending) return aPending - bPending
    const ad = a.completedDate ?? a.scheduledDate
    const bd = b.completedDate ?? b.scheduledDate
    return new Date(bd).getTime() - new Date(ad).getTime()
  })
}

export function SheepAnalysisTab({
  sheep,
  onUpdated,
}: {
  sheep: ApiSheep
  onUpdated?: () => void | Promise<void>
}) {
  const sheepId = sheep.id
  const sheepLabel = sheep.name ? `${sheep.tag} · ${sheep.name}` : sheep.tag

  const [records, setRecords] = useState<ApiAnalysis[]>([])
  const [types, setTypes] = useState<ApiAnalysisType[]>([])
  const [meds, setMeds] = useState<ApiMedicine[]>([])
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState<string | null>(null)

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [diagnoseTarget, setDiagnoseTarget] = useState<ApiAnalysis | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [list, typePage, medPage] = await Promise.all([
        fetchAnalysesBySheep(sheepId),
        fetchAnalysisTypes(),
        fetchMedicines(1, 100),
      ])
      setRecords(sortAnalyses(list))
      setTypes(typePage.items)
      setMeds(medPage.items)
    } catch {
      setRecords([])
      setTypes([])
      setMeds([])
    } finally {
      setLoading(false)
    }
  }, [sheepId])

  useEffect(() => {
    load()
  }, [load])

  const pending = records.filter((r) => r.status === AnalysisStatus.SCHEDULED).length
  const registerBlockReason = analysisEligibility(sheep)

  function openNewAnalysis() {
    if (registerBlockReason) return
    setDiagnoseTarget(null)
    setDrawerOpen(true)
  }

  function openExistingRecord(record: ApiAnalysis) {
    setDiagnoseTarget(record)
    setDrawerOpen(true)
  }

  async function handleSaved(message: string) {
    setSuccess(message)
    await load()
    await onUpdated?.()
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900">
          <IconAnalysis className="h-5 w-5 text-gray-400" aria-hidden="true" />
          Análisis y diagnósticos
        </h3>
        <button
          type="button"
          onClick={openNewAnalysis}
          disabled={!!registerBlockReason}
          title={registerBlockReason ?? undefined}
          className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <IconAnalysis className="h-4 w-4" aria-hidden="true" />
          Registrar análisis
        </button>
      </div>
      <p className="mt-1 text-sm text-gray-500">
        FAMACHA, coprológicos y otros estudios de salud (no es el diagnóstico de preñez ECO).{" "}
        {pending > 0 ? `${pending} programado(s).` : ""}
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
          rows={records}
          rowKey={(a) => a.id}
          loading={loading}
          loadingText="Cargando análisis…"
          empty={<p className="text-sm text-gray-500">Sin análisis registrados.</p>}
          columns={[
            {
              key: "date",
              header: "Fecha",
              className: "whitespace-nowrap",
              cell: (a) => {
                const date = a.completedDate ?? a.scheduledDate
                const due = isAnalysisDue(a)
                const upcoming =
                  a.status === AnalysisStatus.SCHEDULED &&
                  toDateInputValue(a.scheduledDate) > todayInput()
                return (
                  <>
                    <div className="font-medium text-gray-900">{formatDisplayDate(date)}</div>
                    {a.status === AnalysisStatus.SCHEDULED && (
                      <div className="mt-1 text-xs text-gray-400">Programado</div>
                    )}
                    {due && (
                      <div className="mt-1">
                        <StatusBadge color="yellow" icon={IconDue}>
                          Vence hoy
                        </StatusBadge>
                      </div>
                    )}
                    {upcoming && (
                      <div className="mt-1 text-xs text-gray-400">Próximo</div>
                    )}
                  </>
                )
              },
            },
            {
              key: "type",
              header: "Tipo",
              className: "whitespace-nowrap",
              cell: (a) => labelAnalysisType(a.analysisType?.type ?? "—"),
            },
            { key: "result", header: "Resultado", className: "whitespace-nowrap", cell: resultCell },
            { key: "diagnosis", header: "Diagnóstico", cell: (a) => a.diagnosis || "—" },
            { key: "notes", header: "Notas", cell: (a) => a.notes || "—" },
            {
              key: "status",
              header: "Estado",
              className: "whitespace-nowrap",
              cell: (a) => (
                <StatusBadge color={analysisStatusColor[a.status] ?? "gray"}>
                  {labelAnalysisStatus(a.status)}
                </StatusBadge>
              ),
            },
            {
              key: "actions",
              header: "",
              align: "right",
              className: "whitespace-nowrap",
              cell: (a) => (
                <div className="flex items-center justify-end gap-1">
                  {a.status === AnalysisStatus.SCHEDULED && (
                    <button
                      type="button"
                      onClick={() => openExistingRecord(a)}
                      className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-indigo-600"
                      title="Agregar diagnóstico"
                      aria-label="Agregar diagnóstico"
                    >
                      <IconDiagnosis className="h-5 w-5" aria-hidden="true" />
                    </button>
                  )}
                  {a.status === AnalysisStatus.COMPLETED && (
                    <button
                      type="button"
                      onClick={() => openExistingRecord(a)}
                      className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-indigo-600"
                      title="Actualizar diagnóstico"
                      aria-label="Actualizar diagnóstico"
                    >
                      <IconDiagnosis className="h-5 w-5" aria-hidden="true" />
                    </button>
                  )}
                </div>
              ),
            },
          ]}
        />
      </div>

      <AnalysisDiagnosisDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        record={diagnoseTarget}
        sheepId={sheepId}
        types={types}
        sheepLabel={sheepLabel}
        meds={meds}
        onSaved={handleSaved}
      />
    </div>
  )
}
