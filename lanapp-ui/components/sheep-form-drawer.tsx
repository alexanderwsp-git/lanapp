"use client"

import { useState } from "react"
import { Drawer } from "@/components/ui/drawer"
import { SheepForm } from "@/components/sheep-form"
import type { ApiSheep } from "@/lib/api/types"

export function SheepFormDrawer({
  open,
  onClose,
  mode,
  initial,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  mode: "new" | "edit"
  initial?: ApiSheep
  onSaved?: (sheepId: string) => void
}) {
  const [saving, setSaving] = useState(false)

  return (
    <Drawer
      open={open}
      onClose={onClose}
      size="lg"
      title={mode === "new" ? "Nueva oveja" : "Editar oveja"}
      description={
        mode === "new"
          ? "Registra un nuevo animal en el rebaño."
          : initial
            ? `Actualiza los datos de ${initial.tag}.`
            : undefined
      }
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="sheep-form"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {saving && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            {mode === "new" ? "Crear oveja" : "Guardar cambios"}
          </button>
        </>
      }
    >
      <SheepForm
        mode={mode}
        initial={initial}
        variant="drawer"
        formId="sheep-form"
        onSavingChange={setSaving}
        onSuccess={(id) => {
          onSaved?.(id)
          onClose()
        }}
      />
    </Drawer>
  )
}
