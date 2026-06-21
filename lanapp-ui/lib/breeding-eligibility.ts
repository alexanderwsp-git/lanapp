import { Gender, SheepCategory, SheepStatus } from "@sheep/domain"
import type { ApiSheep } from "@/lib/api/types"

const EWE_BREEDING_CATEGORIES = new Set<SheepCategory>([
  SheepCategory.BORREGA,
  SheepCategory.OVEJA_VACIA,
])

const RAM_BREEDING_CATEGORIES = new Set<SheepCategory>([SheepCategory.REPRODUCTOR])

export function eweBreedingEligibility(sheep: ApiSheep): string | null {
  if (sheep.gender !== Gender.FEMALE) return "No es hembra"
  if (sheep.status !== SheepStatus.ACTIVE) return "No está activa"
  if (sheep.isPregnant) return "Preñada — esperar parto"
  const cat = sheep.category as SheepCategory
  if (cat === SheepCategory.OVEJA_LACTANCIA) {
    return "En lactancia — destetar antes de montar"
  }
  if (cat === SheepCategory.OVEJA_PRENADA || cat === SheepCategory.BORREGA_PRENADA) {
    return "Preñada — esperar parto"
  }
  if (!EWE_BREEDING_CATEGORIES.has(cat)) {
    return "Categoría no apta para monta"
  }
  return null
}

export function ramBreedingEligibility(sheep: ApiSheep): string | null {
  if (sheep.gender !== Gender.MALE) return "No es macho"
  if (sheep.status !== SheepStatus.ACTIVE) return "No está activo"
  if (!RAM_BREEDING_CATEGORIES.has(sheep.category as SheepCategory)) {
    return "Categoría no apta (se requiere reproductor)"
  }
  return null
}

export function isEweBreedingEligible(sheep: ApiSheep): boolean {
  return eweBreedingEligibility(sheep) === null
}

export function isRamBreedingEligible(sheep: ApiSheep): boolean {
  return ramBreedingEligibility(sheep) === null
}
