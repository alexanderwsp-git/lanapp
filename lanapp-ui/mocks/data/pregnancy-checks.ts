import { DiagnosisType, PregnancyCheckKind } from "@sheep/domain"
import type { ApiPregnancyCheck } from "@/lib/api/pregnancy-check"
import { IDS } from "../ids"

export const seedPregnancyChecks: ApiPregnancyCheck[] = [
  {
    id: "p1000001-0000-4000-8000-000000000001",
    matingId: IDS.matings.m1,
    checkDate: "2026-04-14T00:00:00.000Z",
    isPregnant: true,
    checkType: DiagnosisType.ECO,
    kind: PregnancyCheckKind.DIAGNOSIS,
    notes: "ECO positivo",
  },
  {
    id: "p1000001-0000-4000-8000-000000000002",
    matingId: IDS.matings.m2,
    checkDate: "2026-03-12T00:00:00.000Z",
    isPregnant: false,
    checkType: DiagnosisType.ECO,
    kind: PregnancyCheckKind.DIAGNOSIS,
    notes: "Vacía — aplicar Vitasel",
  },
]
