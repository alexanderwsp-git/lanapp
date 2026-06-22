import { Gender, SheepCategory, WEANING_DAYS } from "@sheep/domain"
import type { ApiSheep } from "@/lib/api/types"
import { activeSheepEligibility } from "@/lib/sheep-action-eligibility"

const LAMB_CATEGORIES = new Set<SheepCategory>([
  SheepCategory.CORDERO,
  SheepCategory.CORDERA,
])

const WEANING_UI_CATEGORIES = new Set<SheepCategory>([
  SheepCategory.CORDERO,
  SheepCategory.CORDERA,
  SheepCategory.CORDERO_DESTETADO,
  SheepCategory.CORDERA_DESTETADA,
])

function ageDays(sheep: ApiSheep): number {
  return (Date.now() - new Date(sheep.birthDate).getTime()) / (1000 * 60 * 60 * 24)
}

/** Destete en cabecera del detalle: solo corderos, corderas y maltones. */
export function showsWeaningAction(sheep: ApiSheep): boolean {
  return WEANING_UI_CATEGORIES.has(sheep.category as SheepCategory)
}

export function weanedBadgeLabel(sheep: ApiSheep): string {
  return sheep.gender === Gender.MALE ? "Destetado" : "Destetada"
}

export function weaningEligibility(
  sheep: ApiSheep,
  minDays = WEANING_DAYS,
): string | null {
  const activeError = activeSheepEligibility(sheep)
  if (activeError) return activeError

  if (!LAMB_CATEGORIES.has(sheep.category as SheepCategory)) {
    return "Solo corderos y corderas pueden destetarse"
  }

  if (ageDays(sheep) < minDays) {
    return `Debe tener al menos ${minDays} días de edad`
  }

  return null
}

export function isWeaningEligible(sheep: ApiSheep, minDays = WEANING_DAYS): boolean {
  return weaningEligibility(sheep, minDays) === null
}
