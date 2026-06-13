import { MedicineStatus, MedicineType } from "@sheep/domain"

const typeLabels: Record<MedicineType, string> = {
  [MedicineType.VACCINE]: "Vacuna",
  [MedicineType.ANTIBIOTIC]: "Antibiótico",
  [MedicineType.VITAMIN]: "Vitamina",
  [MedicineType.DEWORMER]: "Desparasitante",
  [MedicineType.OTHER]: "Otro",
}

const statusLabels: Record<MedicineStatus, string> = {
  [MedicineStatus.SCHEDULED]: "Programado",
  [MedicineStatus.APPLIED]: "Aplicado",
  [MedicineStatus.CANCELLED]: "Cancelado",
  [MedicineStatus.MISSED]: "Omitido",
}

export function labelMedicineType(type: MedicineType | string): string {
  return typeLabels[type as MedicineType] ?? String(type)
}

export function labelMedicineStatus(status: MedicineStatus | string): string {
  return statusLabels[status as MedicineStatus] ?? String(status)
}

export const medicineTypeOptions = Object.values(MedicineType)
export const medicineStatusOptions = Object.values(MedicineStatus)

export const medicineStatusColor: Record<string, "green" | "gray" | "blue" | "yellow" | "red" | "indigo"> = {
  Programado: "blue",
  Aplicado: "green",
  Cancelado: "gray",
  Omitido: "red",
  [MedicineStatus.SCHEDULED]: "blue",
  [MedicineStatus.APPLIED]: "green",
  [MedicineStatus.CANCELLED]: "gray",
  [MedicineStatus.MISSED]: "red",
}
