import type { ApiHealthCheck } from "@/lib/api/health-check"
import { IDS } from "../ids"

export const seedHealthChecks: ApiHealthCheck[] = [
  {
    id: "h1000001-0000-4000-8000-000000000001",
    sheepId: IDS.sheep.blanca,
    checkDate: "2026-06-01T00:00:00.000Z",
    famachaScore: 2,
    notes: "Revisar desparasitación",
  },
  {
    id: "h1000001-0000-4000-8000-000000000002",
    sheepId: IDS.sheep.blanca,
    checkDate: "2026-05-01T00:00:00.000Z",
    famachaScore: 4,
    notes: "Normal",
  },
  {
    id: "h1000001-0000-4000-8000-000000000003",
    sheepId: IDS.sheep.blanca,
    checkDate: "2026-04-01T00:00:00.000Z",
    famachaScore: 5,
    notes: "",
  },
  {
    id: "h1000001-0000-4000-8000-000000000004",
    sheepId: IDS.sheep.luna,
    checkDate: "2026-06-01T00:00:00.000Z",
    famachaScore: 5,
    notes: "Sin alerta",
  },
  {
    id: "h1000001-0000-4000-8000-000000000005",
    sheepId: IDS.sheep.negro,
    checkDate: "2026-06-01T00:00:00.000Z",
    famachaScore: 4,
    notes: "Normal",
  },
]
