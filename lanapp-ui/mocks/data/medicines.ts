import { MedicineType } from "@sheep/domain"
import type { ApiMedicine, ApiMedicineApplication } from "@/lib/api/types"
import { MedicineStatus } from "@sheep/domain"
import { IDS } from "../ids"

export const seedMedicines: ApiMedicine[] = [
  {
    id: IDS.medicines.ivermectina,
    type: MedicineType.DEWORMER,
    name: "Ivermectina",
    dosage: "1ml/50kg",
    description: "Antiparasitario de amplio espectro.",
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
    id: "f1000001-0000-4000-8000-000000000001",
    medicineId: IDS.medicines.ivermectina,
    sheepId: IDS.sheep.blanca,
    applicationDate: "2026-06-10T00:00:00.000Z",
    status: MedicineStatus.SCHEDULED,
    notes: "",
  },
  {
    id: "f1000001-0000-4000-8000-000000000002",
    medicineId: IDS.medicines.complejoB,
    sheepId: IDS.sheep.negro,
    applicationDate: "2026-06-05T00:00:00.000Z",
    status: MedicineStatus.APPLIED,
    notes: "Aplicado en potrero.",
  },
  {
    id: "f1000001-0000-4000-8000-000000000003",
    medicineId: IDS.medicines.clostridial,
    sheepId: IDS.sheep.luna,
    applicationDate: "2026-05-28T00:00:00.000Z",
    status: MedicineStatus.MISSED,
    notes: "No se encontró en potrero.",
  },
]
