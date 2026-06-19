"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ClipboardDocumentCheckIcon, ArrowRightCircleIcon } from "@heroicons/react/24/outline"
import { StatusBadge } from "@/components/ui/status-badge"
import { DataTable } from "@/components/ui/data-table"
import { fetchAnalysesBySheep } from "@/lib/api/analysis"
import { AnalysisStatus, AnalysisType, type ApiAnalysis } from "@/lib/analysis/types"
import {
  analysisStatusColor,
  famachaColor,
  labelAnalysisStatus,
  labelAnalysisType,
} from "@/lib/labels/analysis"
import { formatDisplayDate } from "@/lib/format"

/** Resultado mostrado en la tabla, con badge especial para FAMACHA. */
function resultCell(a: ApiAnalysis) {
  if (a.analysisType?.type === AnalysisType.FAMACHA && a.famachaScore != null) {
    return <StatusBadge color={famachaColor(a.famachaScore)}>{`FAMACHA ${a.famachaScore}`}</StatusBadge>
  }
  if (a.resultValue) return <span className="text-gray-900">{a.resultValue}</span>
  return <span className="text-gray-400">—</span>
}

export function SheepAnalysisTab({ sheepId }: { sheepId: string }) {
  const [records, setRecords] = useState<ApiAnalysis[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchAnalysesBySheep(sheepId)
      .then((list) => {
        if (cancelled) return
        const sorted = [...list].sort((a, b) => {
          const ad = a.completedDate ?? a.scheduledDate
          const bd = b.completedDate ?? b.scheduledDate
          return new Date(bd).getTime() - new Date(ad).getTime()
        })
        setRecords(sorted)
      })
      .catch(() => {
        if (!cancelled) setRecords([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [sheepId])

  const pending = records.filter((r) => r.status === AnalysisStatus.SCHEDULED).length

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900">
          <ClipboardDocumentCheckIcon className="h-5 w-5 text-gray-400" />
          Análisis y diagnósticos
        </h3>
        <Link
          href={`/analysis?scheduleSheep=${sheepId}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          Programar análisis
          <ArrowRightCircleIcon className="h-4 w-4" />
        </Link>
      </div>
      <p className="mt-1 text-sm text-gray-500">
        FAMACHA, coprológicos y otros estudios. {pending > 0 ? `${pending} programado(s).` : ""}
      </p>
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
              className: "whitespace-nowrap text-gray-900",
              cell: (a) => formatDisplayDate(a.completedDate ?? a.scheduledDate),
            },
            {
              key: "type",
              header: "Tipo",
              className: "whitespace-nowrap",
              cell: (a) => labelAnalysisType(a.analysisType?.type ?? "—"),
            },
            { key: "result", header: "Resultado", className: "whitespace-nowrap", cell: resultCell },
            { key: "diagnosis", header: "Diagnóstico", cell: (a) => a.diagnosis || "—" },
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
          ]}
        />
      </div>
    </div>
  )
}
