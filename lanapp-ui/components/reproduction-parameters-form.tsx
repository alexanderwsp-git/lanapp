"use client"

import { useCallback, useEffect, useState } from "react"
import type { ReproductionParameters } from "@sheep/domain"
import { DEFAULT_REPRODUCTION_PARAMETERS } from "@sheep/domain"
import { fetchFarmParameters, updateFarmParameters } from "@/lib/api/farm-parameters"
import { Field, TextInput } from "@/components/ui/form-fields"

export function ReproductionParametersForm() {
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Gestación (días)" htmlFor="gestationDays" required>
          <TextInput
            id="gestationDays"
            type="number"
            min={100}
            max={180}
            value={form.gestationDays}
            onChange={(e) => setNum("gestationDays", e.target.value)}
            required
          />
        </Field>
        <Field label="ECO mínimo (días post-monta)" htmlFor="ecoCheckMinDays" required>
          <TextInput
            id="ecoCheckMinDays"
            type="number"
            min={1}
            max={90}
            value={form.ecoCheckMinDays}
            onChange={(e) => setNum("ecoCheckMinDays", e.target.value)}
            required
          />
        </Field>
        <Field label="ECO máximo (días post-monta)" htmlFor="ecoCheckMaxDays" required>
          <TextInput
            id="ecoCheckMaxDays"
            type="number"
            min={1}
            max={120}
            value={form.ecoCheckMaxDays}
            onChange={(e) => setNum("ecoCheckMaxDays", e.target.value)}
            required
          />
        </Field>
        <Field label="Ciclo de celo (días)" htmlFor="heatCycleDays" required>
          <TextInput
            id="heatCycleDays"
            type="number"
            min={1}
            max={60}
            value={form.heatCycleDays}
            onChange={(e) => setNum("heatCycleDays", e.target.value)}
            required
          />
        </Field>
        <Field label="Destete (días)" htmlFor="weaningDays" required>
          <TextInput
            id="weaningDays"
            type="number"
            min={40}
            max={120}
            value={form.weaningDays}
            onChange={(e) => setNum("weaningDays", e.target.value)}
            required
          />
        </Field>
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
        >
          {saving ? "Guardando…" : "Guardar reproducción"}
        </button>
      </div>
    </form>
  )
}
