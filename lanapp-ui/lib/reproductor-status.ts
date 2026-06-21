import { Gender, SheepCategory, TWELVE_MONTHS_DAYS } from "@sheep/domain"
import type { ApiSheep } from "@/lib/api/types"
import { ageInDays } from "@/lib/format"

export type ReproductorStatus = {
  label: string
  hint: string
  badgeColor: "green" | "indigo" | "yellow" | "gray"
  eligibleForBreedingCycle: boolean
}

export function reproductorStatus(sheep: ApiSheep): ReproductorStatus | null {
  if (sheep.gender !== Gender.MALE) return null

  const flagged = sheep.isBreedingRam === true
  const days = ageInDays(sheep.birthDate)
  const isCategory = sheep.category === SheepCategory.REPRODUCTOR
  const ageOk = days >= TWELVE_MONTHS_DAYS

  if (isCategory) {
    return {
      label: "Sí",
      hint: "Aparece en Montas → Agregar al ciclo.",
      badgeColor: "green",
      eligibleForBreedingCycle: true,
    }
  }

  if (flagged && ageOk) {
    return {
      label: "Marcado",
      hint: "Flag activo y edad ≥12 meses. Recarga esta página para sincronizar la categoría a Reproductor.",
      badgeColor: "yellow",
      eligibleForBreedingCycle: false,
    }
  }

  if (flagged) {
    const remaining = TWELVE_MONTHS_DAYS - days
    return {
      label: "Preseleccionado",
      hint: `Marcado para monta. Será reproductor a los 12 meses (faltan ${remaining} d).`,
      badgeColor: "indigo",
      eligibleForBreedingCycle: false,
    }
  }

  return {
    label: "No",
    hint: "Activa el interruptor «Marcar como reproductor» en el detalle de la oveja.",
    badgeColor: "gray",
    eligibleForBreedingCycle: false,
  }
}
