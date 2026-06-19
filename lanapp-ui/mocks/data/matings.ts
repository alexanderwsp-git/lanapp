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
  {
    id: IDS.matings.m4,
    maleId: IDS.sheep.negro,
    femaleId: IDS.sheep.luna,
    matingDate: "2025-09-02T00:00:00.000Z",
    expectedBirthDate: addDays("2025-09-02", 147),
    status: MatingStatus.EFFECTIVE,
    notes: "Ciclo anterior — parto sin complicaciones.",
  },
  {
    id: IDS.matings.m5,
    maleId: IDS.sheep.toro,
    femaleId: IDS.sheep.rosa,
    matingDate: "2026-01-20T00:00:00.000Z",
    expectedBirthDate: addDays("2026-01-20", 147),
    status: MatingStatus.EFFECTIVE,
    notes: "Requirió segundo chequeo para confirmar.",
  },
]
