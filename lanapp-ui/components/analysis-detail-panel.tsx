"use client"

import type { ReactNode } from "react"
import { MedicineStatus } from "@sheep/domain"
import { StatusBadge } from "@/components/ui/status-badge"
import { AnalysisStatus, AnalysisType, type ApiAnalysis } from "@/lib/analysis/types"
import type { ApiMedicineApplication } from "@/lib/api/types"
import {
  analysisRecommendation,
  famachaColor,
  labelAnalysisStatus,
  labelAnalysisType,
} from "@/lib/labels/analysis"
import { labelMedicineStatus, labelMedicineType, medicineStatusColor } from "@/lib/labels/medicine"
import { formatDisplayDate } from "@/lib/format"

type AnalysisDetailPanelProps = {
  record: ApiAnalysis
  linkedMedicine?: ApiMedicineApplication | null
}

function DetailField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">{children}</dd>
    </div>
  )
}

function NoteBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
      <p className="mt-1.5 text-sm whitespace-pre-line text-gray-700">{body}</p>
    </div>
  )
}

export function AnalysisDetailPanel({ record, linkedMedicine }: AnalysisDetailPanelProps) {
  const isFamacha = record.analysisType?.type === AnalysisType.FAMACHA
  const isCompleted = record.status === AnalysisStatus.COMPLETED
  const recommendation = isCompleted ? analysisRecommendation(record) : null

  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <DetailField label="Tipo">
          {record.analysisType?.name ?? labelAnalysisType(record.analysisType?.type ?? "—")}
        </DetailField>
        <DetailField label="Estado">
          <StatusBadge color={record.status === AnalysisStatus.COMPLETED ? "green" : "blue"}>
            {labelAnalysisStatus(record.status)}
          </StatusBadge>
        </DetailField>
        <DetailField label="Fecha programada">{formatDisplayDate(record.scheduledDate)}</DetailField>
        {record.completedDate && (
          <DetailField label="Fecha realizada">{formatDisplayDate(record.completedDate)}</DetailField>
        )}
        {isCompleted && (
          <DetailField label="Resultado">
            {isFamacha && record.famachaScore != null ? (
              <StatusBadge color={famachaColor(record.famachaScore)}>
                FAMACHA {record.famachaScore}
              </StatusBadge>
            ) : record.resultValue ? (
              record.resultValue
            ) : (
              "—"
            )}
          </DetailField>
        )}
        {record.diagnosis && (
          <DetailField label="Diagnóstico">{record.diagnosis}</DetailField>
        )}
        {record.analysisType?.defaultUnit && isCompleted && !isFamacha && (
          <DetailField label="Unidad">{record.analysisType.defaultUnit}</DetailField>
        )}
      </dl>

      {record.analysisType?.description && (
        <p className="text-sm text-gray-600">{record.analysisType.description}</p>
      )}

      {recommendation?.needsTreatment && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {recommendation.message}
        </div>
      )}

      {record.notes?.trim() && <NoteBlock title="Notas" body={record.notes.trim()} />}

      {linkedMedicine && (
        <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 px-3.5 py-2.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
            Medicamento vinculado
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-900">
            <span className="font-medium">{linkedMedicine.medicine?.name ?? "Medicamento"}</span>
            {linkedMedicine.medicine?.type && (
              <span className="text-gray-500">
                · {labelMedicineType(linkedMedicine.medicine.type)}
              </span>
            )}
            <StatusBadge color={medicineStatusColor[linkedMedicine.status] ?? "gray"}>
              {labelMedicineStatus(linkedMedicine.status)}
            </StatusBadge>
            <span className="text-gray-500">
              · {formatDisplayDate(linkedMedicine.applicationDate)}
            </span>
          </div>
          {linkedMedicine.notes?.trim() && (
            <p className="mt-2 text-sm text-gray-600">{linkedMedicine.notes.trim()}</p>
          )}
          {linkedMedicine.status === MedicineStatus.SCHEDULED && (
            <p className="mt-1 text-xs text-indigo-700">Pendiente de aplicar en la pestaña Medicina.</p>
          )}
        </div>
      )}

      {record.status === AnalysisStatus.SCHEDULED && (
        <p className="text-sm text-gray-500">
          Análisis programado — usa el botón de diagnóstico para registrar el resultado.
        </p>
      )}
    </div>
  )
}
