import {
  Gender,
  RecordType,
  SheepBreed,
  SheepCategory,
  SheepStatus,
} from "@sheep/domain"

const categoryLabels: Record<SheepCategory, string> = {
  [SheepCategory.CORDERO]: "Cordero",
  [SheepCategory.CORDERO_DESTETADO]: "Cordero destetado (maltón)",
  [SheepCategory.BORREGO]: "Borrego",
  [SheepCategory.REPRODUCTOR]: "Reproductor",
  [SheepCategory.FAENADO]: "Faenado",
  [SheepCategory.CORDERA]: "Cordera",
  [SheepCategory.CORDERA_DESTETADA]: "Cordera destetada (maltona)",
  [SheepCategory.BORREGA]: "Borrega",
  [SheepCategory.BORREGA_PRENADA]: "Borrega preñada",
  [SheepCategory.OVEJA_PRENADA]: "Oveja preñada",
  [SheepCategory.OVEJA_LACTANCIA]: "Oveja lactancia",
  [SheepCategory.OVEJA_VACIA]: "Oveja vacía",
  [SheepCategory.FAENADA]: "Faenada",
  [SheepCategory.VENTA]: "Venta",
}

const statusLabels: Record<SheepStatus, string> = {
  [SheepStatus.ACTIVE]: "Activo",
  [SheepStatus.INACTIVE]: "Inactivo",
  [SheepStatus.SOLD]: "Vendido",
  [SheepStatus.DECEASED]: "Fallecido",
  [SheepStatus.QUARANTINE]: "Cuarentena",
}

const genderLabels: Record<Gender, string> = {
  [Gender.MALE]: "Macho",
  [Gender.FEMALE]: "Hembra",
}

const recordTypeLabels: Record<RecordType, string> = {
  [RecordType.BORN]: "Nacido en granja",
  [RecordType.PURCHASED]: "Comprado",
  [RecordType.DONATED]: "Donado",
  [RecordType.TRANSFERRED]: "Transferido",
}

export function labelCategory(category: SheepCategory | string): string {
  return categoryLabels[category as SheepCategory] ?? String(category)
}

export function labelStatus(status: SheepStatus | string): string {
  return statusLabels[status as SheepStatus] ?? String(status)
}

export function labelGender(gender: Gender | string): string {
  return genderLabels[gender as Gender] ?? String(gender)
}

export function labelRecordType(recordType: RecordType | string): string {
  return recordTypeLabels[recordType as RecordType] ?? String(recordType)
}

export const breedOptions = Object.values(SheepBreed)
export const genderOptions = Object.values(Gender)
export const recordTypeOptions = Object.values(RecordType)
export const statusOptions = Object.values(SheepStatus)

export const statusColor: Record<string, "green" | "gray" | "blue" | "yellow" | "red"> = {
  Activo: "green",
  Inactivo: "gray",
  Vendido: "blue",
  Fallecido: "gray",
  Cuarentena: "yellow",
  [SheepStatus.ACTIVE]: "green",
  [SheepStatus.INACTIVE]: "gray",
  [SheepStatus.SOLD]: "blue",
  [SheepStatus.DECEASED]: "gray",
  [SheepStatus.QUARANTINE]: "yellow",
}
