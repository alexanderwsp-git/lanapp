import {
  DiagnosisType,
  PregnancyCheckKind,
  MatingStatus,
} from "@sheep/domain"
import type {
  ApiPregnancyCheck,
  DeliveryPayload,
  PregnancyCheckCreatePayload,
} from "@/lib/api/pregnancy-check"
import { findSheep, getMockStore, notFound } from "../store"
import { newId } from "../utils"

export async function fetchPregnancyChecksByMating(matingId: string): Promise<ApiPregnancyCheck[]> {
  return getMockStore()
    .pregnancyChecks.filter((c) => c.matingId === matingId)
    .sort((a, b) => b.checkDate.localeCompare(a.checkDate))
}

export async function recordPregnancyCheck(
  payload: PregnancyCheckCreatePayload,
): Promise<ApiPregnancyCheck> {
  const store = getMockStore()
  const check: ApiPregnancyCheck = {
    id: newId(),
    matingId: payload.matingId,
    checkDate: new Date(payload.checkDate).toISOString(),
    isPregnant: payload.isPregnant,
    checkType: payload.checkType ?? DiagnosisType.ECO,
    kind: PregnancyCheckKind.DIAGNOSIS,
    notes: payload.notes,
    nextCheckDate: payload.nextCheckDate
      ? new Date(payload.nextCheckDate).toISOString()
      : null,
  }
  store.pregnancyChecks.push(check)

  const mating = store.matings.find((m) => m.id === payload.matingId)
  if (mating) {
    mating.status = payload.isPregnant ? MatingStatus.EFFECTIVE : MatingStatus.INEFFECTIVE
    const ewe = findSheep(mating.femaleId)
    if (ewe) {
      ewe.isPregnant = payload.isPregnant
      if (payload.isPregnant) ewe.pregnancyConfirmedAt = check.checkDate
    }
  }

  return check
}

export async function recordDelivery(
  matingId: string,
  payload: DeliveryPayload,
): Promise<ApiPregnancyCheck> {
  const store = getMockStore()
  const mating = store.matings.find((m) => m.id === matingId)
  if (!mating) throw notFound("Monta", matingId)

  const check: ApiPregnancyCheck = {
    id: newId(),
    matingId,
    checkDate: new Date(payload.deliveryDate).toISOString(),
    isPregnant: false,
    kind: PregnancyCheckKind.DELIVERY,
    notes: payload.notes,
  }
  store.pregnancyChecks.push(check)

  const ewe = findSheep(mating.femaleId)
  if (ewe) {
    ewe.isPregnant = false
    ewe.deliveryDate = check.checkDate
  }

  return check
}
