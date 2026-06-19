/**
 * Analysis model — re-exports from @sheep/domain for UI compatibility.
 */
import {
  AnalysisKind,
  AnalysisStatus,
  type AnalysisCreate,
  type AnalysisTypeCreate,
  type AnalysisTypeUpdate,
  type AnalysisUpdate,
  type BulkAnalysisSchedule,
} from '@sheep/domain';

export { AnalysisKind, AnalysisKind as AnalysisType, AnalysisStatus };
export type {
  AnalysisCreate,
  AnalysisTypeCreate,
  AnalysisTypeUpdate,
  AnalysisUpdate,
  BulkAnalysisSchedule,
};

/** Catalog entry returned by API. */
export type ApiAnalysisType = {
  id: string
  type: AnalysisKind
  name: string
  description?: string | null
  defaultUnit?: string | null
  recommendedMedicineType?: string | null
}

/** Per-sheep analysis record. */
export type ApiAnalysis = {
  id: string
  analysisTypeId: string
  sheepId: string
  scheduledDate: string
  completedDate?: string | null
  status: AnalysisStatus
  resultValue?: string | null
  famachaScore?: number | null
  diagnosis?: string | null
  notes?: string | null
  analysisType?: ApiAnalysisType | null
  sheep?: { id: string; tag: string; name?: string | null } | null
}

export type BulkAnalysisSchedulePayload = BulkAnalysisSchedule;
