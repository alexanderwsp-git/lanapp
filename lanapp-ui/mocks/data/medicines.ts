import { MedicineType } from "@sheep/domain"
import type { ApiMedicine, ApiMedicineApplication } from "@/lib/api/types"
import { MedicineStatus } from "@sheep/domain"
import { IDS } from "../ids"

const today = () => new Date().toISOString().slice(0, 10)

export const seedMedicines: ApiMedicine[] = [
  {
    id: IDS.medicines.ivermectina,
    type: MedicineType.DEWORMER,
    name: "Ivermectina",
    dosage: "1ml/50kg",
    description: "Antiparasitario de amplio espectro.",
  },
  {
    id: IDS.medicines.albendazol,
    type: MedicineType.DEWORMER,
    name: "Albendazol",
    dosage: "1 comprimido/40kg",
    description: "Desparasitante oral — segundo producto para el selector.",
  },
  {
    id: IDS.medicines.complejoB,
    type: MedicineType.VITAMIN,
    name: "Complejo B",
    dosage: "5ml",
    description: "Suplemento vitamínico.",
  },
  {
    id: IDS.medicines.clostridial,
    type: MedicineType.VACCINE,
    name: "Clostridial",
    dosage: "2ml",
    description: "Vacuna contra enfermedades clostridiales.",
  },
]

export const seedMedicineApplications: ApiMedicineApplication[] = [
  {
    id: "01200001-0000-4000-8000-000000000001",
    medicineId: IDS.medicines.ivermectina,
    sheepId: IDS.sheep.blanca,
    analysisId: "01100001-0000-4000-8000-000000000001",
    applicationDate: `${today()}T00:00:00.000Z`,
    status: MedicineStatus.SCHEDULED,
    notes: "Desde análisis: FAMACHA — Anemia — desparasitar",
  },
  {
    id: "01200001-0000-4000-8000-000000000002",
    medicineId: IDS.medicines.complejoB,
    sheepId: IDS.sheep.negro,
    applicationDate: "2026-06-05T00:00:00.000Z",
    status: MedicineStatus.APPLIED,
    notes: "Aplicado en potrero.",
  },
  {
    id: "f1000001-0000-4000-8000-000000000002",
    medicineId: IDS.medicines.clostridial,
    sheepId: IDS.sheep.luna,
    applicationDate: "2026-05-28T00:00:00.000Z",
    status: MedicineStatus.MISSED,
    notes: "No se encontró en potrero.",
  },
]
