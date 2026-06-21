"use client"

import { useCallback, useEffect, useState } from "react"
import type { ReproductionParameters } from "@sheep/domain"
import { DEFAULT_REPRODUCTION_PARAMETERS } from "@sheep/domain"
import { fetchFarmParameters, updateFarmParameters } from "@/lib/api/farm-parameters"
import { useAuth } from "@/lib/auth/use-auth"
import { Field, TextInput } from "@/components/ui/form-fields"
import { InformationCircleIcon } from "@heroicons/react/24/outline"

const FIELD_HINTS: {
  key: keyof ReproductionParameters
  label: string
  hint: string
  tooltip: string
}[] = [
  {
    key: "gestationDays",
    label: "Gestación (días)",
    hint: "Duración de la gestación; define la fecha estimada de parto.",
    tooltip: "Valor típico: 147 días. Se usa para calcular el parto estimado tras una monta efectiva.",
  },
  {
    key: "ecoCheckMinDays",
    label: "ECO mínimo (días post-monta)",
    hint: "Primer día recomendado para ultrasonido post-monta.",
    tooltip: "Ventana inferior de la pestaña Montas. Por defecto 30 días después de la monta.",
  },
  {
    key: "ecoCheckMaxDays",
    label: "ECO máximo (días post-monta)",
    hint: "Último día recomendado para ultrasonido post-monta.",
    tooltip: "Debe ser ≥ ECO mínimo. Por defecto 45 días. Fuera de la ventana se muestra aviso suave.",
  },
  {
    key: "heatCycleDays",
    label: "Ciclo de celo (días)",
    hint: "Espera sugerida antes de un nuevo remate tras diagnóstico Vacía.",
    tooltip: "Referencia operativa para reprogramar montas. Por defecto 15 días.",
  },
  {
    key: "weaningDays",
    label: "Destete (días)",
    hint: "Edad desde el nacimiento para alertas de destete.",
    tooltip: "Los corderos sin destete registrado aparecen en Destete al superar este umbral. Por defecto 70 días.",
  },
]

function FieldHint({ hint, tooltip, id }: { hint: string; tooltip: string; id: string }) {
  return (
    <div className="mt-1 flex items-start gap-1.5">
      <p className="text-xs text-gray-500">{hint}</p>
      <button
        type="button"
        className="shrink-0 text-gray-400 hover:text-gray-600"
        title={tooltip}
        aria-label={tooltip}
        aria-describedby={id}
      >
        <InformationCircleIcon className="h-4 w-4" aria-hidden="true" />
      </button>
      <span id={id} className="sr-only">
        {tooltip}
      </span>
    </div>
  )
}

export function ReproductionParametersForm() {
  const { isAdmin } = useAuth()
  const [form, setForm] = useState<ReproductionParameters>(DEFAULT_REPRODUCTION_PARAMETERS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetchFarmParameters()
      .then(setForm)
      .catch((err) => setError(err instanceof Error ? err.message : "Error al cargar"))
      .finally(() => setLoading(false))
  }, [])

  const setNum = useCallback((key: keyof ReproductionParameters, value: string) => {
    const n = parseInt(value, 10)
    if (!Number.isNaN(n)) setForm((prev) => ({ ...prev, [key]: n }))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!isAdmin) return
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const updated = await updateFarmParameters(form)
      setForm(updated)
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron guardar los parámetros")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-500">Cargando parámetros de reproducción…</p>
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-4">
      <p className="text-sm text-gray-500">
        Ventana ECO recomendada, gestación y ciclos de celo. Usados en la pestaña Montas y alertas.
      </p>
      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {saved && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">Parámetros guardados.</p>
      )}
      {!isAdmin && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Solo un administrador puede modificar estos parámetros. Puedes consultarlos aquí.
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FIELD_HINTS.map(({ key, label, hint, tooltip }) => (
          <div key={key}>
            <Field label={label} htmlFor={key} required>
              <TextInput
                id={key}
                type="number"
                min={key === "gestationDays" ? 100 : key === "weaningDays" ? 40 : 1}
                max={
                  key === "gestationDays"
                    ? 180
                    : key === "ecoCheckMinDays"
                      ? 90
                      : key === "ecoCheckMaxDays"
                        ? 120
                        : key === "weaningDays"
                          ? 120
                          : 60
                }
                value={form[key]}
                onChange={(e) => setNum(key, e.target.value)}
                required
                disabled={!isAdmin}
              />
            </Field>
            <FieldHint hint={hint} tooltip={tooltip} id={`${key}-tooltip`} />
          </div>
        ))}
      </div>
      <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center sm:justify-end">
        {!isAdmin && (
          <p className="text-xs text-gray-500 sm:mr-auto">
            Contacta al administrador de la granja para solicitar cambios.
          </p>
        )}
        <button
          type="submit"
          disabled={saving || !isAdmin}
          title={!isAdmin ? "Solo administradores pueden guardar" : undefined}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Guardando…" : "Guardar reproducción"}
        </button>
      </div>
    </form>
  )
}
