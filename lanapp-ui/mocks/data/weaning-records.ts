import type { ApiWeaningRecord, ApiRecentWeaningRecord } from "@/lib/api/weaning"
import { Gender, SheepCategory } from "@sheep/domain"
import { IDS } from "../ids"

export const seedWeaningRecords: ApiWeaningRecord[] = [
  {
    id: "r1000001-0000-4000-8000-000000000001",
    sheepId: IDS.sheep.blanca,
    weaningDate: "2026-04-01T00:00:00.000Z",
    weaningWeight: 24.5,
    dailyGain: 72,
    lotId: "Lote-1",
    notes: "Destete normal",
  },
]

export const seedRecentWeanings: ApiRecentWeaningRecord[] = [
  {
    id: "r1000001-0000-4000-8000-000000000001",
    sheepId: IDS.sheep.blanca,
    weaningDate: "2026-04-01T00:00:00.000Z",
    weaningWeight: 24.5,
    dailyGain: 72,
    lotId: "Lote-1",
    tag: "SA-001",
    name: "Blanca",
    category: SheepCategory.CORDERA_DESTETADA,
    birthDate: "2026-01-15T00:00:00.000Z",
    gender: Gender.FEMALE,
  },
]
