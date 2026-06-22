import { Gender, SheepCategory, SheepStatus } from "@sheep/domain"
import type { ApiSheep } from "@/lib/api/types"

const MOTHER_CATEGORIES = new Set<SheepCategory>([
  SheepCategory.BORREGA,
  SheepCategory.BORREGA_PRENADA,
  SheepCategory.OVEJA_PRENADA,
  SheepCategory.OVEJA_LACTANCIA,
  SheepCategory.OVEJA_VACIA,
])

const FATHER_CATEGORIES = new Set<SheepCategory>([
  SheepCategory.BORREGO,
  SheepCategory.REPRODUCTOR,
])

type ParentCandidateOptions = {
  childBirthDate: string
  excludeId?: string
  /** Keep an existing link visible in edit mode even if no longer eligible. */
  allowId?: string
}

function bornBeforeChild(sheep: ApiSheep, childBirthDate: string): boolean {
  if (!childBirthDate) return true
  return sheep.birthDate.slice(0, 10) < childBirthDate
}

export function isMotherParentCandidate(
  sheep: ApiSheep,
  { childBirthDate, excludeId, allowId }: ParentCandidateOptions,
): boolean {
  if (sheep.id === excludeId) return false
  if (allowId && sheep.id === allowId) return true
  if (sheep.gender !== Gender.FEMALE) return false
  if (sheep.status !== SheepStatus.ACTIVE) return false
  if (!MOTHER_CATEGORIES.has(sheep.category as SheepCategory)) return false
  return bornBeforeChild(sheep, childBirthDate)
}

export function isFatherParentCandidate(
  sheep: ApiSheep,
  { childBirthDate, excludeId, allowId }: ParentCandidateOptions,
): boolean {
  if (sheep.id === excludeId) return false
  if (allowId && sheep.id === allowId) return true
  if (sheep.gender !== Gender.MALE) return false
  if (sheep.status !== SheepStatus.ACTIVE) return false
  if (!FATHER_CATEGORIES.has(sheep.category as SheepCategory)) return false
  return bornBeforeChild(sheep, childBirthDate)
}
