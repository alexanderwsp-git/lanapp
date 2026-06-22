import { lanapp, type FetchOptions } from "../client"
import type { Paginated, BulkResult } from "../types"
import type {
  AnalysisCreate,
  AnalysisTypeCreate,
  AnalysisTypeUpdate,
  AnalysisUpdate,
  ApiAnalysis,
  ApiAnalysisType,
  BulkAnalysisSchedulePayload,
} from "@/lib/analysis/types"

export async function fetchAnalysisTypes(page = 1, limit = 100): Promise<Paginated<ApiAnalysisType>> {
  const res = await lanapp.get<Paginated<ApiAnalysisType>>(`analysis-type?page=${page}&limit=${limit}`)
  return res.data
}

export async function createAnalysisType(payload: AnalysisTypeCreate): Promise<ApiAnalysisType> {
  const res = await lanapp.post<ApiAnalysisType>("analysis-type", payload)
  return res.data
}

export async function updateAnalysisType(
  id: string,
  payload: AnalysisTypeUpdate,
): Promise<ApiAnalysisType> {
  const res = await lanapp.put<ApiAnalysisType>(`analysis-type/${id}`, payload)
  return res.data
}

export async function deleteAnalysisType(id: string): Promise<void> {
  await lanapp.delete<null>(`analysis-type/${id}`)
}

export async function fetchAnalyses(page = 1, limit = 100): Promise<Paginated<ApiAnalysis>> {
  const res = await lanapp.get<Paginated<ApiAnalysis>>(`analysis?page=${page}&limit=${limit}`)
  return res.data
}

export async function fetchAnalysesBySheep(
  sheepId: string,
  options?: FetchOptions,
): Promise<ApiAnalysis[]> {
  const res = await lanapp.get<ApiAnalysis[]>(`analysis/sheep/${sheepId}`, options)
  return res.data
}

export async function createAnalysis(payload: AnalysisCreate): Promise<ApiAnalysis> {
  const res = await lanapp.post<ApiAnalysis>("analysis", payload)
  return res.data
}

export async function updateAnalysis(id: string, payload: AnalysisUpdate): Promise<ApiAnalysis> {
  const res = await lanapp.put<ApiAnalysis>(`analysis/${id}`, payload)
  return res.data
}

export async function deleteAnalysis(id: string): Promise<void> {
  await lanapp.delete<null>(`analysis/${id}`)
}

export async function fetchPendingAnalyses(): Promise<ApiAnalysis[]> {
  const res = await lanapp.get<ApiAnalysis[]>("analysis/pending")
  return res.data
}

export async function bulkScheduleAnalyses(
  payload: BulkAnalysisSchedulePayload,
): Promise<BulkResult> {
  const res = await lanapp.post<BulkResult>("analysis/bulk/schedule", payload)
  return res.data
}
