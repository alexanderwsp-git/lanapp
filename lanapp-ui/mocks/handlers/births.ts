import { Gender, SheepCategory } from "@sheep/domain"
import { getMockStore } from "../store"
import { matingActions } from "@/lib/mating-actions"
import type { ApiPendingDelivery } from "@/lib/api/births"
import type { ApiSheep } from "@/lib/api/types"

function isPregnantEwe(s: ApiSheep): boolean {
  return (
    s.gender === Gender.FEMALE &&
    (s.isPregnant ||
      s.category === SheepCategory.OVEJA_PRENADA ||
      s.category === SheepCategory.BORREGA_PRENADA)
  )
}

export async function fetchPendingDeliveries(): Promise<ApiPendingDelivery[]> {
  const store = getMockStore()
  const pregnant = store.sheep.filter(isPregnantEwe)
  const loaded: ApiPendingDelivery[] = []

  for (const sheep of pregnant) {
    const matings = store.matings.filter(
      (m) => m.femaleId === sheep.id || m.maleId === sheep.id,
    )
    for (const mating of matings.sort((a, b) => b.matingDate.localeCompare(a.matingDate))) {
      if (mating.femaleId !== sheep.id) continue
      const checks = store.pregnancyChecks
        .filter((c) => c.matingId === mating.id)
        .sort((a, b) => b.checkDate.localeCompare(a.checkDate))
      if (matingActions(checks).canDeliver) {
        const male = store.sheep.find((s) => s.id === mating.maleId)
        loaded.push({
          sheep,
          mating: {
            ...mating,
            male: male
              ? { id: male.id, tag: male.tag, name: male.name, birthDate: male.birthDate }
              : null,
          },
          checks,
        })
        break
      }
    }
  }

  return loaded
}
