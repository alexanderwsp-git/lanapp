import { MatingStatus } from "@sheep/domain"
import type { ApiMating } from "@/lib/api/mating"
import { IDS } from "../ids"
import { addDays } from "../utils"

export const seedMatings: ApiMating[] = [
  {
    id: IDS.matings.m1,
    maleId: IDS.sheep.toro,
    femaleId: IDS.sheep.luna,
    matingDate: "2026-03-15T00:00:00.000Z",
    expectedBirthDate: addDays("2026-03-15", 147),
    status: MatingStatus.EFFECTIVE,
    notes: "Preñez confirmada por ECO.",
  },
  {
    id: IDS.matings.m2,
    maleId: IDS.sheep.negro,
    femaleId: IDS.sheep.blanca,
    matingDate: "2026-02-10T00:00:00.000Z",
    status: MatingStatus.INEFFECTIVE,
    notes: "Repetir con Vitasel.",
  },
  {
    id: IDS.matings.m3,
    maleId: IDS.sheep.toro,
    femaleId: IDS.sheep.estrella,
    matingDate: "2026-03-16T00:00:00.000Z",
    expectedBirthDate: addDays("2026-03-16", 147),
    status: MatingStatus.PENDING,
  },
]
