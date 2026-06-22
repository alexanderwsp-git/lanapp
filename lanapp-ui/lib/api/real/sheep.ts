import type { Gender, SheepCreate, SheepStatus, SheepUpdate, SheepCategory } from "@sheep/domain"
import { lanapp, type FetchOptions } from "../client"
import type { ApiSheep, Paginated } from "../types"

export type SheepListParams = {
  page?: number
  limit?: number
  gender?: Gender
  status?: SheepStatus
  category?: SheepCategory
  locationId?: string
}

export type SheepListResult = Paginated<ApiSheep>

export type ApiSheepFamily = {
  mother?: ApiSheep
  father?: ApiSheep
  children: ApiSheep[]
}

export async function fetchSheep(params: SheepListParams = {}): Promise<SheepListResult> {
  const { page = 1, limit = 100, gender, status, category, locationId } = params
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (gender) qs.set("gender", gender)
  if (status) qs.set("status", status)
  if (category) qs.set("category", category)
  if (locationId) qs.set("locationId", locationId)

  const res = await lanapp.get<Paginated<ApiSheep> | ApiSheep[]>(`sheep?${qs.toString()}`)
  const data = res.data

  if (Array.isArray(data)) {
    return {
      items: data,
      total: data.length,
      page: 1,
      limit: data.length,
      totalPages: 1,
    }
  }

  return data
}

export async function fetchSheepById(id: string, options?: FetchOptions): Promise<ApiSheep> {
  const res = await lanapp.get<ApiSheep>(`sheep/${id}`, options)
  return res.data
}

export async function fetchSheepFamily(id: string, options?: FetchOptions): Promise<ApiSheepFamily> {
  const res = await lanapp.get<ApiSheepFamily>(`sheep/${id}/family`, options)
  return {
    mother: res.data.mother,
    father: res.data.father,
    children: res.data.children ?? [],
  }
}

export async function createSheep(payload: SheepCreate): Promise<ApiSheep> {
  const res = await lanapp.post<ApiSheep>("sheep", payload)
  return res.data
}

export async function updateSheep(id: string, payload: SheepUpdate): Promise<ApiSheep> {
  const res = await lanapp.put<ApiSheep>(`sheep/${id}`, payload)
  return res.data
}

export async function updateSheepStatus(id: string, status: SheepStatus): Promise<ApiSheep> {
  const res = await lanapp.patch<ApiSheep>(`sheep/${id}/status`, { status })
  return res.data
}

export async function deleteSheep(id: string): Promise<void> {
  await lanapp.delete<null>(`sheep/${id}`)
}
