"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { StatusBadge } from "@/components/ui/status-badge"
import { StatCard } from "@/components/ui/stat-card"
import { isAnalysisDue } from "@/lib/analysis/due"
import { fetchAnalysesBySheep } from "@/lib/api/analysis"
import { AnalysisStatus, AnalysisType, type ApiAnalysis } from "@/lib/analysis/types"
import { famachaColor, labelAnalysisType } from "@/lib/labels/analysis"
import { formatDisplayDate } from "@/lib/format"
import { IconAnalysis, IconDue } from "@/lib/icons/analysis-medicine"
import { ClipboardDocumentCheckIcon } from "@heroicons/react/24/outline"

function lastFamacha(records: ApiAnalysis[]): ApiAnalysis | undefined {
  return records.find(
    (a) =>
      a.status === AnalysisStatus.COMPLETED &&
      a.analysisType?.type === AnalysisType.FAMACHA &&
      a.famachaScore != null,
  )
}

export function SheepAnalysisSummary({
  sheepId,
  onViewTab,
  embedded = false,
}: {
  sheepId: string
  onViewTab?: () => void
  embedded?: boolean
}) {
  const [records, setRecords] = useState<ApiAnalysis[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const list = await fetchAnalysesBySheep(sheepId)
      setRecords(
        [...list].sort((a, b) => {
          const ad = a.completedDate ?? a.scheduledDate
          const bd = b.completedDate ?? b.scheduledDate
          return new Date(bd).getTime() - new Date(ad).getTime()
        }),
      )
    } catch {
      setRecords([])
    } finally {
      setLoading(false)
    }
  }, [sheepId])

  useEffect(() => {
    load()
  }, [load])

  const pending = useMemo(
    () => records.filter((a) => a.status === AnalysisStatus.SCHEDULED),
    [records],
  )
  const dueCount = useMemo(() => pending.filter(isAnalysisDue).length, [pending])
  const famacha = useMemo(() => lastFamacha(records), [records])

  if (loading) {
    return <p className="text-sm text-gray-500">Cargando resumen de análisis…</p>
  }

  return (
    <div className="flex flex-col gap-3">
      {!embedded && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <IconAnalysis className="h-5 w-5 text-gray-400" aria-hidden="true" />
            Análisis
          </h3>
          {onViewTab ? (
            <button
              type="button"
              onClick={onViewTab}
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-500"
            >
              Ver pestaña Análisis
            </button>
          ) : (
            <Link
              href={`/sheep/${sheepId}?tab=analisis`}
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-500"
            >
              Ver pestaña Análisis
            </Link>
          )}
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          label="Programados"
          value={pending.length}
          icon={IconDue}
          hint={dueCount > 0 ? `${dueCount} vencen hoy o antes` : "Sin pendientes urgentes"}
        />
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Último FAMACHA</p>
              {famacha?.famachaScore != null ? (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusBadge color={famachaColor(famacha.famachaScore)}>
                    FAMACHA {famacha.famachaScore}
                  </StatusBadge>
                  <span className="text-sm text-gray-600">
                    {formatDisplayDate(famacha.completedDate ?? famacha.scheduledDate)}
                  </span>
                </div>
              ) : (
                <p className="mt-2 text-3xl font-semibold text-gray-900">—</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                {famacha?.analysisType?.name ?? labelAnalysisType(AnalysisType.FAMACHA)}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
              <ClipboardDocumentCheckIcon className="h-5 w-5 text-indigo-600" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
