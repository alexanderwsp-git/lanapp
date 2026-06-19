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

type BadgeColor = "indigo" | "green" | "yellow" | "red" | "gray" | "blue" | "pink"

// Color del badge de categoría, agrupado por etapa de vida / estado reproductivo.
const categoryColors: Record<SheepCategory, BadgeColor> = {
  [SheepCategory.CORDERO]: "blue",
  [SheepCategory.CORDERA]: "blue",
  [SheepCategory.CORDERO_DESTETADO]: "indigo",
  [SheepCategory.CORDERA_DESTETADA]: "indigo",
  [SheepCategory.BORREGO]: "indigo",
  [SheepCategory.BORREGA]: "indigo",
  [SheepCategory.REPRODUCTOR]: "green",
  [SheepCategory.BORREGA_PRENADA]: "pink",
  [SheepCategory.OVEJA_PRENADA]: "pink",
  [SheepCategory.OVEJA_LACTANCIA]: "pink",
  [SheepCategory.OVEJA_VACIA]: "yellow",
  [SheepCategory.FAENADO]: "gray",
  [SheepCategory.FAENADA]: "gray",
  [SheepCategory.VENTA]: "gray",
}

export function categoryColor(category: SheepCategory | string): BadgeColor {
  return categoryColors[category as SheepCategory] ?? "gray"
}

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
