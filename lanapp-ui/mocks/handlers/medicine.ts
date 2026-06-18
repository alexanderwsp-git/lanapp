import { MedicineStatus } from "@sheep/domain"
import type {
  MedicineApplicationCreate,
  MedicineApplicationUpdate,
  MedicineCreate,
  MedicineUpdate,
} from "@sheep/domain"
import type { BulkMedicineSchedulePayload } from "@/lib/api/medicine"
import type { ApiMedicine, ApiMedicineApplication, BulkResult, Paginated } from "@/lib/api/types"
import {
  enrichMedicineApplication,
  enrichSheepList,
  findSheep,
  getMockStore,
  notFound,
} from "../store"
import { newId, paginate } from "../utils"

function enrichApps(apps: ApiMedicineApplication[]): ApiMedicineApplication[] {
  return apps.map(enrichMedicineApplication)
}

export async function fetchMedicines(page = 1, limit = 100): Promise<Paginated<ApiMedicine>> {
  return paginate(getMockStore().medicines, page, limit)
}

export async function fetchMedicineById(id: string): Promise<ApiMedicine> {
  const medicine = getMockStore().medicines.find((m) => m.id === id)
  if (!medicine) throw notFound("Medicamento", id)
  return { ...medicine }
}

export async function createMedicine(payload: MedicineCreate): Promise<ApiMedicine> {
  const medicine: ApiMedicine = { id: newId(), ...payload }
  getMockStore().medicines.push(medicine)
  return medicine
}

export async function updateMedicine(id: string, payload: MedicineUpdate): Promise<ApiMedicine> {
  const store = getMockStore()
  const idx = store.medicines.findIndex((m) => m.id === id)
  if (idx === -1) throw notFound("Medicamento", id)
  store.medicines[idx] = { ...store.medicines[idx], ...payload }
  return store.medicines[idx]
}

export async function deleteMedicine(id: string): Promise<void> {
  const store = getMockStore()
  const idx = store.medicines.findIndex((m) => m.id === id)
  if (idx === -1) throw notFound("Medicamento", id)
  store.medicines.splice(idx, 1)
}

export async function fetchMedicineApplications(
  page = 1,
  limit = 100,
): Promise<Paginated<ApiMedicineApplication>> {
  return paginate(enrichApps(getMockStore().medicineApplications), page, limit)
}

export async function fetchMedicineApplicationsBySheep(
  sheepId: string,
): Promise<ApiMedicineApplication[]> {
  const apps = getMockStore().medicineApplications.filter((a) => a.sheepId === sheepId)
  return enrichApps(apps)
}

export async function createMedicineApplication(
  payload: MedicineApplicationCreate,
): Promise<ApiMedicineApplication> {
  const app: ApiMedicineApplication = {
    id: newId(),
    medicineId: payload.medicineId,
    sheepId: payload.sheepId,
    applicationDate: new Date(payload.applicationDate).toISOString(),
    status: payload.status ?? MedicineStatus.SCHEDULED,
    notes: payload.notes,
  }
  getMockStore().medicineApplications.push(app)
  return enrichMedicineApplication(app)
}

export async function updateMedicineApplication(
  id: string,
  payload: MedicineApplicationUpdate,
): Promise<ApiMedicineApplication> {
  const store = getMockStore()
  const idx = store.medicineApplications.findIndex((a) => a.id === id)
  if (idx === -1) throw notFound("Aplicación", id)
  const current = store.medicineApplications[idx]
  const applicationDate =
    payload.applicationDate != null
      ? new Date(payload.applicationDate).toISOString()
      : current.applicationDate
  store.medicineApplications[idx] = {
    ...current,
    status: payload.status ?? current.status,
    notes: payload.notes ?? current.notes,
    applicationDate,
  }
  return enrichMedicineApplication(store.medicineApplications[idx])
}

export async function fetchPendingMedicineApplications(): Promise<ApiMedicineApplication[]> {
  const today = new Date().toISOString().slice(0, 10)
  const apps = getMockStore().medicineApplications.filter(
    (a) =>
      a.status === MedicineStatus.SCHEDULED && a.applicationDate.slice(0, 10) <= today,
  )
  return enrichApps(apps)
}

export async function deleteMedicineApplication(id: string): Promise<void> {
  const store = getMockStore()
  const idx = store.medicineApplications.findIndex((a) => a.id === id)
  if (idx === -1) throw notFound("Aplicación", id)
  store.medicineApplications.splice(idx, 1)
}

export async function bulkScheduleMedicineApplications(
  payload: BulkMedicineSchedulePayload,
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
    const app = await createMedicineApplication({
      medicineId: payload.medicineId,
      sheepId,
      applicationDate: new Date(payload.applicationDate),
      status: MedicineStatus.SCHEDULED,
      notes: payload.notes,
    })
    result.succeeded.push({ sheepId, recordId: app.id })
  }
  return result
}
