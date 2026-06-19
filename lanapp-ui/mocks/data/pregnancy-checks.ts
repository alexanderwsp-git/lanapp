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
  // m1 (Luna, preñada): seguimiento ECO durante la gestación.
  {
    id: "p1000001-0000-4000-8000-000000000003",
    matingId: IDS.matings.m1,
    checkDate: "2026-05-10T00:00:00.000Z",
    isPregnant: true,
    checkType: DiagnosisType.ECO,
    kind: PregnancyCheckKind.DIAGNOSIS,
    notes: "ECO de seguimiento, condición corporal buena. Dos fetos.",
  },
  // m4 (Luna, ciclo anterior): ECO positivo + parto registrado.
  {
    id: "p1000001-0000-4000-8000-000000000004",
    matingId: IDS.matings.m4,
    checkDate: "2025-10-05T00:00:00.000Z",
    isPregnant: true,
    checkType: DiagnosisType.ECO,
    kind: PregnancyCheckKind.DIAGNOSIS,
    notes: "Gestación confirmada al primer chequeo.",
  },
  {
    id: "p1000001-0000-4000-8000-000000000005",
    matingId: IDS.matings.m4,
    checkDate: "2026-01-27T00:00:00.000Z",
    isPregnant: false,
    kind: PregnancyCheckKind.DELIVERY,
    notes: "Parto sin asistencia, dos corderos vivos y sanos. Madre recuperándose bien.",
  },
  // m5 (Rosa): primer chequeo dudoso (revisar) y confirmación posterior.
  {
    id: "p1000001-0000-4000-8000-000000000006",
    matingId: IDS.matings.m5,
    checkDate: "2026-02-15T00:00:00.000Z",
    isPregnant: false,
    checkType: DiagnosisType.ECO,
    kind: PregnancyCheckKind.DIAGNOSIS,
    nextCheckDate: "2026-03-08T00:00:00.000Z",
    notes: "Imagen poco clara, reprogramar ECO en ~3 semanas.",
  },
  {
    id: "p1000001-0000-4000-8000-000000000007",
    matingId: IDS.matings.m5,
    checkDate: "2026-03-09T00:00:00.000Z",
    isPregnant: true,
    checkType: DiagnosisType.ECO,
    kind: PregnancyCheckKind.DIAGNOSIS,
    notes: "Preñez confirmada en segundo chequeo. Un solo feto.",
  },
]
