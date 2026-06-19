import type { ApiSheep } from "@/lib/api/types"
import { AnalysisStatus, type ApiAnalysis } from "@/lib/analysis/types"
import { famachaDiagnosis } from "@/lib/labels/analysis"
import { faker } from "../faker"
import { IDS } from "../ids"
import { addDays } from "../utils"

export function buildAnalysesForSheep(sheep: ApiSheep, count = 1): ApiAnalysis[] {
  const records: ApiAnalysis[] = []
  let date = addDays(new Date().toISOString().slice(0, 10), -faker.number.int({ min: 10, max: 120 }))

  for (let i = 0; i < count; i++) {
    const score = faker.number.int({ min: 1, max: 5 })
    records.push({
      id: faker.string.uuid(),
      analysisTypeId: IDS.analysisTypes.famacha,
      sheepId: sheep.id,
      scheduledDate: `${date}T00:00:00.000Z`,
      completedDate: `${date}T00:00:00.000Z`,
      status: AnalysisStatus.COMPLETED,
      resultValue: String(score),
      famachaScore: score,
      diagnosis: famachaDiagnosis(score),
      notes: faker.datatype.boolean({ probability: 0.25 }) ? faker.lorem.sentence() : null,
    })
    date = addDays(date, faker.number.int({ min: 20, max: 40 }))
  }

  return records.sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate))
}

export function buildAnalysesForSheepList(sheep: ApiSheep[], probability = 0.35): ApiAnalysis[] {
  return sheep.flatMap((s) =>
    faker.datatype.boolean({ probability })
      ? buildAnalysesForSheep(s, faker.number.int({ min: 1, max: 2 }))
      : [],
  )
}
