import {
  BirthType,
  Gender,
  RecordType,
  SheepBreed,
  SheepCategory,
  SheepStatus,
} from "@sheep/domain"
import type { ApiSheep } from "@/lib/api/types"
import { faker } from "../faker"
import { addDays, daysBetween } from "../utils"

const BREEDS = Object.values(SheepBreed)
const RECORD_TYPES = Object.values(RecordType)

function categoryFor(gender: Gender, ageDays: number): SheepCategory {
  if (gender === Gender.MALE) {
    if (ageDays < 70) return SheepCategory.CORDERO
    if (ageDays < 365) {
      return faker.helpers.arrayElement([
        SheepCategory.CORDERO_DESTETADO,
        SheepCategory.BORREGO,
      ])
    }
    return faker.helpers.arrayElement([SheepCategory.BORREGO, SheepCategory.REPRODUCTOR])
  }
  if (ageDays < 70) return SheepCategory.CORDERA
  if (ageDays < 365) {
    return faker.helpers.arrayElement([
      SheepCategory.CORDERA_DESTETADA,
      SheepCategory.BORREGA,
    ])
  }
  return faker.helpers.arrayElement([
    SheepCategory.BORREGA,
    SheepCategory.OVEJA_VACIA,
  ])
}

function weightForCategory(category: SheepCategory): number {
  const label = String(category)
  if (label.includes("CORDER")) {
    return faker.number.float({ min: 14, max: 28, fractionDigits: 1 })
  }
  if (label.includes("BORREG") || label.includes("BORREGA")) {
    return faker.number.float({ min: 32, max: 52, fractionDigits: 1 })
  }
  if (category === SheepCategory.REPRODUCTOR) {
    return faker.number.float({ min: 55, max: 75, fractionDigits: 1 })
  }
  return faker.number.float({ min: 28, max: 55, fractionDigits: 1 })
}

export type BuildSheepOptions = {
  reservedTags: Set<string>
  locationIds: string[]
}

export function buildSheep(
  overrides: Partial<ApiSheep> = {},
  options: BuildSheepOptions,
): ApiSheep {
  const gender = overrides.gender ?? faker.helpers.enumValue(Gender)
  const birthDate = overrides.birthDate
    ? new Date(overrides.birthDate)
    : faker.date.past({ years: faker.number.int({ min: 1, max: 4 }) })
  const birthIso = birthDate.toISOString()
  const ageDays = daysBetween(birthIso.slice(0, 10), new Date().toISOString().slice(0, 10))
  const category = overrides.category ?? categoryFor(gender, ageDays)

  let tag = overrides.tag
  if (!tag) {
    do {
      tag = `SA-${faker.number.int({ min: 200, max: 999 })}`
    } while (options.reservedTags.has(tag))
    options.reservedTags.add(tag)
  }

  const status =
    overrides.status ??
    (faker.number.float({ min: 0, max: 1 }) < 0.08
      ? SheepStatus.QUARANTINE
      : SheepStatus.ACTIVE)

  const quarantineEndDate =
    status === SheepStatus.QUARANTINE
      ? `${addDays(new Date().toISOString().slice(0, 10), faker.number.int({ min: 7, max: 30 }))}T00:00:00.000Z`
      : overrides.quarantineEndDate

  return {
    id: overrides.id ?? faker.string.uuid(),
    tag,
    name: overrides.name ?? faker.person.firstName(),
    breed: overrides.breed ?? faker.helpers.arrayElement(BREEDS),
    gender,
    birthDate: birthIso,
    birthType: overrides.birthType ?? BirthType.SINGLE,
    weight: overrides.weight ?? weightForCategory(category),
    status,
    category,
    recordType: overrides.recordType ?? faker.helpers.arrayElement(RECORD_TYPES),
    currentLocationId:
      overrides.currentLocationId ??
      (options.locationIds.length > 0 ? faker.helpers.arrayElement(options.locationIds) : undefined),
    isPregnant: overrides.isPregnant ?? false,
    isBreedingRam: overrides.isBreedingRam ?? category === SheepCategory.REPRODUCTOR,
    quarantineEndDate,
    notes: overrides.notes ?? (faker.datatype.boolean({ probability: 0.2 }) ? faker.lorem.sentence() : ""),
  }
}

export function buildExtraSheep(count: number, locationIds: string[], reservedTags: Set<string>): ApiSheep[] {
  const sheep: ApiSheep[] = []
  for (let i = 0; i < count; i++) {
    sheep.push(buildSheep({}, { reservedTags, locationIds }))
  }
  return sheep
}
