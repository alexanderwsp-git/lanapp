import type { ApiBreedingCycle } from "@/lib/api/breeding-cycle"
import type { ApiHealthCheck } from "@/lib/api/health-check"
import type { ApiMating } from "@/lib/api/mating"
import type { ApiPregnancyCheck } from "@/lib/api/pregnancy-check"
import type { ApiWeight } from "@/lib/api/weight"
import type { ApiWeaningRecord } from "@/lib/api/weaning"
import type { ApiReproductionParameters } from "@/lib/api/farm-parameters"
import type {
  ApiLocation,
  ApiMedicine,
  ApiMedicineApplication,
  ApiSheep,
} from "@/lib/api/types"
import { generateMockStore } from "./generate"

export type MockStore = {
  sheep: ApiSheep[]
  locations: ApiLocation[]
  medicines: ApiMedicine[]
  medicineApplications: ApiMedicineApplication[]
  weights: ApiWeight[]
  healthChecks: ApiHealthCheck[]
  matings: ApiMating[]
  pregnancyChecks: ApiPregnancyCheck[]
  breedingCycles: ApiBreedingCycle[]
  weaningRecords: ApiWeaningRecord[]
  farmParameters: ApiReproductionParameters
}

let store: MockStore | null = null

function createStore(): MockStore {
  return generateMockStore()
}

export function getMockStore(): MockStore {
  if (!store) store = createStore()
  return store
}

export function resetMockStore(): void {
  store = null
}

export function findSheep(id: string): ApiSheep | undefined {
  return getMockStore().sheep.find((s) => s.id === id)
}

export function findLocation(id: string): ApiLocation | undefined {
  return getMockStore().locations.find((l) => l.id === id)
}

export function enrichSheep(sheep: ApiSheep): ApiSheep {
  const location = sheep.currentLocationId
    ? findLocation(sheep.currentLocationId)
    : undefined
  const weights = getMockStore()
    .weights.filter((w) => w.sheepId === sheep.id)
    .sort((a, b) => b.measurementDate.localeCompare(a.measurementDate))
  const latest = weights[0]
  return {
    ...sheep,
    currentLocation: location ? { id: location.id, name: location.name } : null,
    latestWeight: latest?.weight ?? null,
    latestWeightDate: latest?.measurementDate ?? null,
  }
}

export function enrichSheepList(items: ApiSheep[]): ApiSheep[] {
  return items.map(enrichSheep)
}

export function sheepRef(
  id: string,
): Pick<ApiSheep, "id" | "tag" | "name" | "birthDate"> | null {
  const s = findSheep(id)
  if (!s) return null
  return { id: s.id, tag: s.tag, name: s.name, birthDate: s.birthDate }
}

export function enrichMating(mating: ApiMating): ApiMating {
  return {
    ...mating,
    male: sheepRef(mating.maleId),
    female: sheepRef(mating.femaleId),
  }
}

export function enrichBreedingCycle(cycle: ApiBreedingCycle): ApiBreedingCycle {
  const ewe = findSheep(cycle.eweId)
  const ram = cycle.ramId ? findSheep(cycle.ramId) : undefined
  return {
    ...cycle,
    ewe: ewe
      ? { id: ewe.id, tag: ewe.tag, name: ewe.name, currentLocationId: ewe.currentLocationId }
      : null,
    ram: ram ? { id: ram.id, tag: ram.tag, name: ram.name } : null,
  }
}

export function enrichMedicineApplication(app: ApiMedicineApplication): ApiMedicineApplication {
  const medicine = getMockStore().medicines.find((m) => m.id === app.medicineId)
  return {
    ...app,
    medicine: medicine ?? null,
    sheep: sheepRef(app.sheepId),
  }
}

export function notFound(entity: string, id: string): Error {
  return new Error(`${entity} no encontrado: ${id}`)
}
