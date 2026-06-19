import type { BulkResult, Paginated } from "@/lib/api/types"
import {
  AnalysisStatus,
  type AnalysisCreate,
  type AnalysisTypeCreate,
  type AnalysisTypeUpdate,
  type AnalysisUpdate,
  type ApiAnalysis,
  type ApiAnalysisType,
  type BulkAnalysisSchedulePayload,
} from "@/lib/analysis/types"
import {
  enrichAnalysis,
  enrichSheepList,
  findSheep,
  getMockStore,
  notFound,
} from "../store"
import { newId, paginate } from "../utils"

function enrichList(items: ApiAnalysis[]): ApiAnalysis[] {
  return items.map(enrichAnalysis)
}

export async function fetchAnalysisTypes(page = 1, limit = 100): Promise<Paginated<ApiAnalysisType>> {
  return paginate(getMockStore().analysisTypes, page, limit)
}

export async function createAnalysisType(payload: AnalysisTypeCreate): Promise<ApiAnalysisType> {
  const type: ApiAnalysisType = { id: newId(), ...payload }
  getMockStore().analysisTypes.push(type)
  return type
}

export async function updateAnalysisType(
  id: string,
  payload: AnalysisTypeUpdate,
): Promise<ApiAnalysisType> {
  const store = getMockStore()
  const idx = store.analysisTypes.findIndex((t) => t.id === id)
  if (idx === -1) throw notFound("Tipo de análisis", id)
  store.analysisTypes[idx] = { ...store.analysisTypes[idx], ...payload }
  return store.analysisTypes[idx]
}

export async function deleteAnalysisType(id: string): Promise<void> {
  const store = getMockStore()
  const idx = store.analysisTypes.findIndex((t) => t.id === id)
  if (idx === -1) throw notFound("Tipo de análisis", id)
  store.analysisTypes.splice(idx, 1)
}

export async function fetchAnalyses(page = 1, limit = 100): Promise<Paginated<ApiAnalysis>> {
  return paginate(enrichList(getMockStore().analyses), page, limit)
}

export async function fetchAnalysesBySheep(sheepId: string): Promise<ApiAnalysis[]> {
  const items = getMockStore().analyses.filter((a) => a.sheepId === sheepId)
  return enrichList(items)
}

export async function createAnalysis(payload: AnalysisCreate): Promise<ApiAnalysis> {
  const record: ApiAnalysis = {
    id: newId(),
    analysisTypeId: payload.analysisTypeId,
    sheepId: payload.sheepId,
    scheduledDate: new Date(payload.scheduledDate).toISOString(),
    completedDate: null,
    status: payload.status ?? AnalysisStatus.SCHEDULED,
    resultValue: payload.resultValue ?? null,
    famachaScore: payload.famachaScore ?? null,
    diagnosis: payload.diagnosis ?? null,
    notes: payload.notes ?? null,
  }
  getMockStore().analyses.push(record)
  return enrichAnalysis(record)
}

export async function updateAnalysis(id: string, payload: AnalysisUpdate): Promise<ApiAnalysis> {
  const store = getMockStore()
  const idx = store.analyses.findIndex((a) => a.id === id)
  if (idx === -1) throw notFound("Análisis", id)
  const current = store.analyses[idx]
  store.analyses[idx] = {
    ...current,
    status: payload.status ?? current.status,
    scheduledDate: payload.scheduledDate
      ? new Date(payload.scheduledDate).toISOString()
      : current.scheduledDate,
    completedDate:
      payload.completedDate !== undefined
        ? payload.completedDate
          ? new Date(payload.completedDate).toISOString()
          : null
        : current.completedDate,
    resultValue: payload.resultValue !== undefined ? payload.resultValue : current.resultValue,
    famachaScore: payload.famachaScore !== undefined ? payload.famachaScore : current.famachaScore,
    diagnosis: payload.diagnosis !== undefined ? payload.diagnosis : current.diagnosis,
    notes: payload.notes !== undefined ? payload.notes : current.notes,
  }
  return enrichAnalysis(store.analyses[idx])
}

export async function deleteAnalysis(id: string): Promise<void> {
  const store = getMockStore()
  const idx = store.analyses.findIndex((a) => a.id === id)
  if (idx === -1) throw notFound("Análisis", id)
  store.analyses.splice(idx, 1)
}

export async function fetchPendingAnalyses(): Promise<ApiAnalysis[]> {
  const today = new Date().toISOString().slice(0, 10)
  const items = getMockStore().analyses.filter(
    (a) => a.status === AnalysisStatus.SCHEDULED && a.scheduledDate.slice(0, 10) <= today,
  )
  return enrichList(items)
}

export async function bulkScheduleAnalyses(
  payload: BulkAnalysisSchedulePayload,
): Promise<BulkResult> {
  const store = getMockStore()
  let targets: string[] = []

  if (payload.sheepIds?.length) {
    targets = payload.sheepIds
  } else if (payload.filters) {
    targets = enrichSheepList(store.sheep)
      .filter((s) => {
        const f = payload.filters!
        if (f.gender && s.gender !== f.gender) return false
        if (f.status && s.status !== f.status) return false
        if (f.category && s.category !== f.category) return false
        if (f.locationId && s.currentLocationId !== f.locationId) return false
        return true
      })
      .map((s) => s.id)
  }

  const result: BulkResult = { succeeded: [], failed: [], total: targets.length }
  for (const sheepId of targets) {
    if (!findSheep(sheepId)) {
      result.failed.push({ sheepId, error: "Oveja no encontrada" })
      continue
    }
    const record = await createAnalysis({
      analysisTypeId: payload.analysisTypeId,
      sheepId,
      scheduledDate: payload.scheduledDate,
      status: AnalysisStatus.SCHEDULED,
      notes: payload.notes,
    })
    result.succeeded.push({ sheepId, recordId: record.id })
  }
  return result
}
