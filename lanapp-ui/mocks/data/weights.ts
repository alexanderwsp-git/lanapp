import type { ApiWeight } from "@/lib/api/weight"
import { IDS } from "../ids"

export const seedWeights: ApiWeight[] = [
  {
    id: "w1000001-0000-4000-8000-000000000001",
    sheepId: IDS.sheep.blanca,
    weight: 22.0,
    measurementDate: "2026-02-01T00:00:00.000Z",
    dailyGain: null,
  },
  {
    id: "w1000001-0000-4000-8000-000000000002",
    sheepId: IDS.sheep.blanca,
    weight: 26.0,
    measurementDate: "2026-05-01T00:00:00.000Z",
    dailyGain: 44,
  },
  {
    id: "w1000001-0000-4000-8000-000000000003",
    sheepId: IDS.sheep.blanca,
    weight: 28.5,
    measurementDate: "2026-06-01T00:00:00.000Z",
    dailyGain: 83,
  },
  {
    id: "w1000001-0000-4000-8000-000000000004",
    sheepId: IDS.sheep.luna,
    weight: 50.0,
    measurementDate: "2026-05-15T00:00:00.000Z",
    dailyGain: null,
  },
  {
    id: "w1000001-0000-4000-8000-000000000005",
    sheepId: IDS.sheep.luna,
    weight: 52.0,
    measurementDate: "2026-06-01T00:00:00.000Z",
    dailyGain: 65,
  },
]
