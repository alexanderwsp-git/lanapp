"use client"

import { Gender } from "@sheep/domain"
import { StatusBadge } from "@/components/ui/status-badge"
import type { ApiSheep } from "@/lib/api/types"
import { eweBreedingEligibility } from "@/lib/breeding-eligibility"
import { categoryColor, labelCategory } from "@/lib/labels/sheep"

type SheepCategoryCellProps = {
  sheep: ApiSheep
  /** Show why a ewe is not eligible for mating (hembras only). */
  showBreedingHint?: boolean
  compact?: boolean
}

export function SheepCategoryCell({
  sheep,
  showBreedingHint = false,
  compact = false,
}: SheepCategoryCellProps) {
  const breedingBlock =
    showBreedingHint && sheep.gender === Gender.FEMALE
      ? eweBreedingEligibility(sheep)
      : null

  return (
    <div className={compact ? "flex flex-col gap-0.5" : "flex flex-col gap-1"}>
      <StatusBadge color={categoryColor(sheep.category)}>
        {labelCategory(sheep.category)}
      </StatusBadge>
      {breedingBlock && (
        <span className="text-xs text-amber-700">{breedingBlock}</span>
      )}
    </div>
  )
}
