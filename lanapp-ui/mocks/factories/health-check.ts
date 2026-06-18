import type { ApiSheep } from "@/lib/api/types"
import type { ApiHealthCheck } from "@/lib/api/health-check"
import { faker } from "../faker"
import { addDays } from "../utils"

export function buildHealthChecksForSheep(sheep: ApiSheep, count = 1): ApiHealthCheck[] {
  const checks: ApiHealthCheck[] = []
  let date = addDays(new Date().toISOString().slice(0, 10), -faker.number.int({ min: 10, max: 120 }))

  for (let i = 0; i < count; i++) {
    checks.push({
      id: faker.string.uuid(),
      sheepId: sheep.id,
      checkDate: `${date}T00:00:00.000Z`,
      famachaScore: faker.number.int({ min: 1, max: 5 }),
      notes: faker.datatype.boolean({ probability: 0.25 }) ? faker.lorem.sentence() : null,
    })
    date = addDays(date, faker.number.int({ min: 20, max: 40 }))
  }

  return checks.sort((a, b) => b.checkDate.localeCompare(a.checkDate))
}

export function buildHealthChecksForSheepList(
  sheep: ApiSheep[],
  probability = 0.35,
): ApiHealthCheck[] {
  return sheep.flatMap((s) =>
    faker.datatype.boolean({ probability })
      ? buildHealthChecksForSheep(s, faker.number.int({ min: 1, max: 2 }))
      : [],
  )
}
