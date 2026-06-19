import type { MockStore } from "./store"
import { seedBreedingCycles } from "./data/breeding-cycles"
import { seedFarmParameters } from "./data/farm-parameters"
import { seedAnalyses, seedAnalysisTypes } from "./data/analyses"
import { seedLocations } from "./data/locations"
import { seedMatings } from "./data/matings"
import { seedMedicineApplications, seedMedicines } from "./data/medicines"
import { seedPregnancyChecks } from "./data/pregnancy-checks"
import { seedSheep } from "./data/sheep"
import { seedWeaningRecords } from "./data/weaning-records"
import { seedWeights } from "./data/weights"
import { buildExtraSheep } from "./factories/sheep"
import { buildAnalysesForSheepList } from "./factories/analysis"
import { buildWeightsForSheepList } from "./factories/weight"
import { getMockExtraSheepCount, getMockWeightsPerSheep } from "./mock-config"
import { deepClone } from "./utils"

/**
 * Build the in-memory mock store: hero fixtures + Faker-generated extras.
 * Heroes preserve demo scenarios (planner, weaning alerts, pregnant ewes).
 */
export function generateMockStore(): MockStore {
  const locations = deepClone(seedLocations)
  const locationIds = locations.map((l) => l.id)

  const heroSheep = deepClone(seedSheep)
  const reservedTags = new Set(heroSheep.map((s) => s.tag))

  const extraSheep = buildExtraSheep(getMockExtraSheepCount(), locationIds, reservedTags)
  const sheep = [...heroSheep, ...extraSheep]

  const weights = [
    ...deepClone(seedWeights),
    ...buildWeightsForSheepList(extraSheep, getMockWeightsPerSheep()),
  ]

  const analyses = [
    ...deepClone(seedAnalyses),
    ...buildAnalysesForSheepList(extraSheep),
  ]

  return {
    sheep,
    locations,
    medicines: deepClone(seedMedicines),
    medicineApplications: deepClone(seedMedicineApplications),
    weights,
    analysisTypes: deepClone(seedAnalysisTypes),
    analyses,
    matings: deepClone(seedMatings),
    pregnancyChecks: deepClone(seedPregnancyChecks),
    breedingCycles: deepClone(seedBreedingCycles),
    weaningRecords: deepClone(seedWeaningRecords),
    farmParameters: deepClone(seedFarmParameters),
  }
}
