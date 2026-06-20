import { MedicineStatus } from "@sheep/domain"
import type { ApiMedicineApplication } from "./types"
import * as mock from "@/mocks/handlers/medicine"
import * as real from "./real/medicine"
import { resolveApi } from "./resolve"
import { toDateInputValue } from "../format"

export type { BulkMedicineSchedulePayload } from "./real/medicine"

const api = resolveApi(real, mock)

export const {
  fetchMedicines,
  fetchMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  fetchMedicineApplications,
  fetchMedicineApplicationsBySheep,
  createMedicineApplication,
  updateMedicineApplication,
  fetchPendingMedicineApplications,
  deleteMedicineApplication,
  bulkScheduleMedicineApplications,
} = api

export async function updateMedicineApplicationStatus(
  id: string,
  status: MedicineStatus,
): Promise<ApiMedicineApplication> {
  return api.updateMedicineApplication(id, { status })
}

export async function markApplicationApplied(
  app: ApiMedicineApplication,
  opts: {
    appliedDate?: string
    nextScheduledDate?: string
    notes?: string
    nextNotes?: string
  } = {},
): Promise<void> {
  await api.updateMedicineApplication(app.id, {
    status: MedicineStatus.APPLIED,
    applicationDate: new Date(opts.appliedDate ?? toDateInputValue(app.applicationDate)),
    notes: opts.notes?.trim() || app.notes || undefined,
  })
  if (opts.nextScheduledDate) {
    await api.createMedicineApplication({
      medicineId: app.medicineId,
      sheepId: app.sheepId,
      applicationDate: new Date(opts.nextScheduledDate),
      status: MedicineStatus.SCHEDULED,
      notes: opts.nextNotes?.trim() || undefined,
    })
  }
}
