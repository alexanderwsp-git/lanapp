"use client"

import { useState } from "react"
import { AcademicCapIcon } from "@heroicons/react/24/outline"
import { StatusBadge } from "@/components/ui/status-badge"
import type { ApiWeaningRecord } from "@/lib/api/weaning"
import type { ApiSheep } from "@/lib/api/types"
import {
  showsWeaningAction,
  weanedBadgeLabel,
  weaningEligibility,
} from "@/lib/weaning-eligibility"
import { WeaningRecordDrawer } from "@/components/weaning-record-drawer"

/**
 * Acción de destete en el detalle de la oveja. Si ya está destetada muestra
 * el registro; si no, abre drawer para capturar fecha + peso.
 */
export function SheepWeaningAction({
  sheep,
  weaningRecords,
  weaningLoading,
  onWeaned,
}: {
  sheep: ApiSheep
  weaningRecords: ApiWeaningRecord[]
  weaningLoading: boolean
  onWeaned?: () => void | Promise<void>
}) {
  const sheepId = sheep.id
  const [drawerOpen, setDrawerOpen] = useState(false)

  if (!showsWeaningAction(sheep)) {
    return null
  }

  const record = weaningRecords[0] ?? null
  const blockReason = record ? null : weaningEligibility(sheep)

  if (weaningLoading) {
    return <div className="h-9 w-28 animate-pulse rounded-md bg-gray-200" />
  }

  if (record) {
    return <StatusBadge color="green">{weanedBadgeLabel(sheep)}</StatusBadge>
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (blockReason) return
          setDrawerOpen(true)
        }}
        disabled={!!blockReason}
        title={blockReason ?? undefined}
        className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <AcademicCapIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        Destetar
      </button>

      <WeaningRecordDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sheepId={sheepId}
        sheepLabel={sheep.name ? `${sheep.tag} · ${sheep.name}` : sheep.tag}
        onSaved={async () => {
          await onWeaned?.()
        }}
      />
    </>
  )
}
