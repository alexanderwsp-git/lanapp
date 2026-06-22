import type {
  MedicineApplicationCreate,
  MedicineApplicationUpdate,
  MedicineCreate,
  MedicineUpdate,
} from "@sheep/domain"
import { lanapp, type FetchOptions } from "../client"
import type { ApiMedicine, ApiMedicineApplication, BulkResult, Paginated } from "../types"

export type BulkMedicineSchedulePayload = {
  medicineId: string
  applicationDate: string
  notes?: string
  sheepIds?: string[]
  filters?: {
    gender?: string
    status?: string
    category?: string
    locationId?: string
  }
}

export async function fetchMedicines(page = 1, limit = 100): Promise<Paginated<ApiMedicine>> {
  const res = await lanapp.get<Paginated<ApiMedicine>>(`medicine?page=${page}&limit=${limit}`)
  return res.data
}

export async function fetchMedicineById(id: string): Promise<ApiMedicine> {
  const res = await lanapp.get<ApiMedicine>(`medicine/${id}`)
  return res.data
}

export async function createMedicine(payload: MedicineCreate): Promise<ApiMedicine> {
  const res = await lanapp.post<ApiMedicine>("medicine", payload)
  return res.data
}

export async function updateMedicine(id: string, payload: MedicineUpdate): Promise<ApiMedicine> {
  const res = await lanapp.put<ApiMedicine>(`medicine/${id}`, payload)
  return res.data
}

export async function deleteMedicine(id: string): Promise<void> {
  await lanapp.delete<null>(`medicine/${id}`)
}

export async function fetchMedicineApplications(
  page = 1,
  limit = 100,
): Promise<Paginated<ApiMedicineApplication>> {
  const res = await lanapp.get<Paginated<ApiMedicineApplication>>(
    `medicine-application?page=${page}&limit=${limit}`,
  )
  return res.data
}

export async function fetchMedicineApplicationsBySheep(
  sheepId: string,
  options?: FetchOptions,
): Promise<ApiMedicineApplication[]> {
  const id = sheepId?.trim()
  if (!id) throw new Error("Falta identificador de oveja")
  const qs = new URLSearchParams({ sheepId: id, limit: "500" })
  const res = await lanapp.get<ApiMedicineApplication[]>(`medicine-application?${qs.toString()}`, options)
  return res.data
}

export async function createMedicineApplication(
  payload: MedicineApplicationCreate,
): Promise<ApiMedicineApplication> {
  const res = await lanapp.post<ApiMedicineApplication>("medicine-application", payload)
  return res.data
}

export async function updateMedicineApplication(
  id: string,
  payload: MedicineApplicationUpdate,
): Promise<ApiMedicineApplication> {
  const res = await lanapp.put<ApiMedicineApplication>(`medicine-application/${id}`, payload)
  return res.data
}

export async function fetchPendingMedicineApplications(): Promise<ApiMedicineApplication[]> {
  const res = await lanapp.get<ApiMedicineApplication[]>("medicine-application/pending")
  return res.data
}

export async function deleteMedicineApplication(id: string): Promise<void> {
  await lanapp.delete<null>(`medicine-application/${id}`)
}

export async function bulkScheduleMedicineApplications(
  payload: BulkMedicineSchedulePayload,
): Promise<BulkResult> {
  const res = await lanapp.post<BulkResult>("medicine-application/bulk/schedule", payload)
  return res.data
}
