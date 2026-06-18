import {
  BreedingCycleStatus,
  BreedingResult,
  DiagnosisType,
} from "@sheep/domain"
import * as mock from "@/mocks/handlers/breeding-weaning"
import * as real from "./real/breeding-cycle"
import { resolveApi } from "./resolve"

export type ApiBreedingCycle = {
  id: string
  eweId: string
  ramId?: string | null
  matingId?: string | null
  cycleName: string
  matingDate: string
  diagnosisType?: DiagnosisType | null
  diagnosisDate?: string | null
  result?: BreedingResult | null
  status: BreedingCycleStatus
  vitaselApplied: boolean
  expectedBirthDate?: string | null
  actualBirthDate?: string | null
  notes?: string | null
  ewe?: { id: string; tag: string; name?: string | null; currentLocationId?: string | null } | null
  ram?: { id: string; tag: string; name?: string | null } | null
}

export type BulkBreedingCycleSchedulePayload = {
  cycleName: string
  ramId?: string
  matingDate: string
  vitaselApplied?: boolean
  notes?: string
  eweIds: string[]
}

export type BreedingCycleCreatePayload = {
  eweId: string
  cycleName: string
  ramId?: string
  matingDate: string
  vitaselApplied?: boolean
  notes?: string
}

export type BreedingDiagnosisPayload = {
  diagnosisType: DiagnosisType
  diagnosisDate: string
  result: BreedingResult
  vitaselApplied?: boolean
  notes?: string
  nextCheckDate?: string
}

export const {
  fetchBreedingCyclesByEwe,
  fetchBreedingCycles,
  confirmBreedingCycleMating,
  createBreedingCycle,
  bulkScheduleBreedingCycles,
  recordBreedingDiagnosis,
  cancelBreedingCycle,
} = resolveApi(real, mock)
