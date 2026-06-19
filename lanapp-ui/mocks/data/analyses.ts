import { MedicineType } from "@sheep/domain"
import {
  AnalysisStatus,
  AnalysisType,
  type ApiAnalysis,
  type ApiAnalysisType,
} from "@/lib/analysis/types"
import { famachaDiagnosis } from "@/lib/labels/analysis"
import { IDS } from "../ids"

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
  // FAMACHA migrados del antiguo modelo health-check.
  famachaDone("g1000001-0000-4000-8000-000000000001", IDS.sheep.blanca, "2026-06-01T00:00:00.000Z", 2, "Revisar desparasitación"),
  famachaDone("g1000001-0000-4000-8000-000000000002", IDS.sheep.blanca, "2026-05-01T00:00:00.000Z", 4, "Normal"),
  famachaDone("g1000001-0000-4000-8000-000000000003", IDS.sheep.blanca, "2026-04-01T00:00:00.000Z", 5),
  famachaDone("g1000001-0000-4000-8000-000000000004", IDS.sheep.luna, "2026-06-01T00:00:00.000Z", 5, "Sin alerta"),
  famachaDone("g1000001-0000-4000-8000-000000000005", IDS.sheep.negro, "2026-06-01T00:00:00.000Z", 4, "Normal"),
  // Coprológicos realizados.
  {
    id: "g1000001-0000-4000-8000-000000000006",
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
    id: "g1000001-0000-4000-8000-000000000007",
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
  // Programados pendientes (para la pestaña Programados).
  {
    id: "g1000001-0000-4000-8000-000000000008",
    analysisTypeId: IDS.analysisTypes.famacha,
    sheepId: IDS.sheep.estrella,
    scheduledDate: new Date().toISOString(),
    completedDate: null,
    status: AnalysisStatus.SCHEDULED,
    resultValue: null,
    famachaScore: null,
    diagnosis: null,
    notes: "Control mensual",
  },
  {
    id: "g1000001-0000-4000-8000-000000000009",
    analysisTypeId: IDS.analysisTypes.coprological,
    sheepId: IDS.sheep.manchas,
    scheduledDate: new Date(Date.now() + 4 * 86400000).toISOString(),
    completedDate: null,
    status: AnalysisStatus.SCHEDULED,
    resultValue: null,
    famachaScore: null,
    diagnosis: null,
    notes: null,
  },
]
