import type { ApiSheep } from "@/lib/api/types"
import type { ApiWeight } from "@/lib/api/weight"
import { faker } from "../faker"
import { addDays, calcDailyGain } from "../utils"

export function buildWeightHistoryForSheep(sheep: ApiSheep, rowCount: number): ApiWeight[] {
  if (rowCount <= 0) return []

  const records: ApiWeight[] = []
  let weight = typeof sheep.weight === "number" ? sheep.weight : 25
  const birthDay = sheep.birthDate.slice(0, 10)
  let date = addDays(birthDay, faker.number.int({ min: 30, max: 90 }))

  for (let i = 0; i < rowCount; i++) {
    if (i > 0) {
      date = addDays(date, faker.number.int({ min: 14, max: 45 }))
      weight = Math.round((weight + faker.number.float({ min: 1, max: 6, fractionDigits: 1 })) * 10) / 10
    }
    const previous = records[records.length - 1]
    const dailyGain = previous
      ? calcDailyGain(weight, date, previous.weight, previous.measurementDate.slice(0, 10))
      : null

    records.push({
      id: faker.string.uuid(),
      sheepId: sheep.id,
      weight,
      measurementDate: `${date}T00:00:00.000Z`,
      dailyGain,
      notes: faker.datatype.boolean({ probability: 0.15 }) ? faker.lorem.sentence() : null,
    })
  }

  return records.sort((a, b) => a.measurementDate.localeCompare(b.measurementDate))
}

export function buildWeightsForSheepList(sheep: ApiSheep[], rowsPerSheep: number): ApiWeight[] {
  return sheep.flatMap((s) => buildWeightHistoryForSheep(s, rowsPerSheep))
}
