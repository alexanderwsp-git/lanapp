import { MedicineType } from "@sheep/domain"
import {
  AnalysisStatus,
  AnalysisType,
  type ApiAnalysis,
  type ApiAnalysisType,
} from "@/lib/analysis/types"
import { famachaDiagnosis } from "@/lib/labels/analysis"
import { IDS } from "../ids"

const today = () => new Date().toISOString().slice(0, 10)
const addDays = (iso: string, days: number) => {
  const d = new Date(`${iso}T00:00:00.000Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export const seedAnalysisTypes: ApiAnalysisType[] = [
  {
    id: IDS.analysisTypes.famacha,
    type: AnalysisType.FAMACHA,
    name: "FAMACHA",
    description: "Evaluación de anemia por color de mucosa ocular (escala 1–5).",
    defaultUnit: "1–5",
    recommendedMedicineType: MedicineType.DEWORMER,
  },
  {
    id: IDS.analysisTypes.coprological,
    type: AnalysisType.COPROLOGICAL,
    name: "Coprológico (parasitario)",
    description: "Conteo de huevos por gramo para detectar carga parasitaria.",
    defaultUnit: "hpg",
    recommendedMedicineType: MedicineType.DEWORMER,
  },
  {
    id: IDS.analysisTypes.bodyCondition,
    type: AnalysisType.BODY_CONDITION,
    name: "Condición corporal",
    description: "Puntaje de condición corporal (escala 1–5).",
    defaultUnit: "1–5",
    recommendedMedicineType: null,
  },
  {
    id: IDS.analysisTypes.blood,
    type: AnalysisType.BLOOD,
    name: "Hemograma",
    description: "Panel sanguíneo básico — tipo custom con tratamiento sugerido.",
    defaultUnit: "g/dL",
    recommendedMedicineType: MedicineType.VITAMIN,
  },
]

/** Helper para un registro FAMACHA realizado, con diagnóstico por convención. */
function famachaDone(
  id: string,
  sheepId: string,
  date: string,
  score: number,
  notes?: string,
): ApiAnalysis {
  return {
    id,
    analysisTypeId: IDS.analysisTypes.famacha,
    sheepId,
    scheduledDate: date,
    completedDate: date,
    status: AnalysisStatus.COMPLETED,
    resultValue: String(score),
    famachaScore: score,
    diagnosis: famachaDiagnosis(score),
    notes: notes ?? null,
  }
}

export const seedAnalyses: ApiAnalysis[] = [
  // FAMACHA — historial (score 2 → recomienda tratamiento; vinculado en medicina)
  famachaDone("01100001-0000-4000-8000-000000000001", IDS.sheep.blanca, "2026-06-01T00:00:00.000Z", 2, "Revisar desparasitación"),
  famachaDone("01100001-0000-4000-8000-000000000002", IDS.sheep.blanca, "2026-05-01T00:00:00.000Z", 4, "Normal"),
  famachaDone("01100001-0000-4000-8000-000000000003", IDS.sheep.blanca, "2026-04-01T00:00:00.000Z", 5),
  famachaDone("01100001-0000-4000-8000-000000000004", IDS.sheep.luna, "2026-06-01T00:00:00.000Z", 5, "Sin alerta"),
  famachaDone("01100001-0000-4000-8000-000000000005", IDS.sheep.negro, "2026-06-01T00:00:00.000Z", 4, "Normal"),
  // Coprológicos realizados
  {
    id: "01100001-0000-4000-8000-000000000006",
    analysisTypeId: IDS.analysisTypes.coprological,
    sheepId: IDS.sheep.blanca,
    scheduledDate: "2026-05-20T00:00:00.000Z",
    completedDate: "2026-05-20T00:00:00.000Z",
    status: AnalysisStatus.COMPLETED,
    resultValue: "650 hpg (Alto)",
    famachaScore: null,
    diagnosis: "Carga parasitaria alta",
    notes: "Se recomienda desparasitar",
  },
  {
    id: "01100001-0000-4000-8000-000000000007",
    analysisTypeId: IDS.analysisTypes.coprological,
    sheepId: IDS.sheep.estrella,
    scheduledDate: "2026-05-18T00:00:00.000Z",
    completedDate: "2026-05-18T00:00:00.000Z",
    status: AnalysisStatus.COMPLETED,
    resultValue: "120 hpg (Bajo)",
    famachaScore: null,
    diagnosis: "Dentro de lo normal",
    notes: null,
  },
  // Programados — resultado individual (Estrella, hoy)
  {
    id: "01100001-0000-4000-8000-000000000008",
    analysisTypeId: IDS.analysisTypes.famacha,
    sheepId: IDS.sheep.estrella,
    scheduledDate: `${today()}T00:00:00.000Z`,
    completedDate: null,
    status: AnalysisStatus.SCHEDULED,
    resultValue: null,
    famachaScore: null,
    diagnosis: null,
    notes: "Control mensual — probar checkbox Programar tratamiento",
  },
  // Programado — coprológico (Manchas)
  {
    id: "01100001-0000-4000-8000-000000000009",
    analysisTypeId: IDS.analysisTypes.coprological,
    sheepId: IDS.sheep.manchas,
    scheduledDate: `${addDays(today(), 4)}T00:00:00.000Z`,
    completedDate: null,
    status: AnalysisStatus.SCHEDULED,
    resultValue: null,
    famachaScore: null,
    diagnosis: null,
    notes: null,
  },
  // Batch FAMACHA — varias ovejas hoy (Registrar resultados)
  {
    id: "01100001-0000-4000-8000-000000000010",
    analysisTypeId: IDS.analysisTypes.famacha,
    sheepId: IDS.sheep.oreja,
    scheduledDate: `${today()}T00:00:00.000Z`,
    completedDate: null,
    status: AnalysisStatus.SCHEDULED,
    resultValue: null,
    famachaScore: null,
    diagnosis: null,
    notes: "Batch FAMACHA — probar score 1–2",
  },
  {
    id: "01100001-0000-4000-8000-000000000011",
    analysisTypeId: IDS.analysisTypes.famacha,
    sheepId: IDS.sheep.pelusa,
    scheduledDate: `${today()}T00:00:00.000Z`,
    completedDate: null,
    status: AnalysisStatus.SCHEDULED,
    resultValue: null,
    famachaScore: null,
    diagnosis: null,
    notes: "Batch FAMACHA — probar score 4–5",
  },
  // Tipo custom con recommendedMedicineType (Rosa)
  {
    id: "01100001-0000-4000-8000-000000000012",
    analysisTypeId: IDS.analysisTypes.blood,
    sheepId: IDS.sheep.rosa,
    scheduledDate: `${today()}T00:00:00.000Z`,
    completedDate: null,
    status: AnalysisStatus.SCHEDULED,
    resultValue: null,
    famachaScore: null,
    diagnosis: null,
    notes: "Hemograma — sugiere vitamina al ingresar resultado",
  },
]
