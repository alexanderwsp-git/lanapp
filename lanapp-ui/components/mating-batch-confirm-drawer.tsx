"use client"

import { useEffect, useMemo, useState } from "react"
import { Drawer } from "@/components/ui/drawer"
import { Field, TextInput } from "@/components/ui/form-fields"
import { bulkConfirmBreedingCycles, type ApiBreedingCycle } from "@/lib/api/breeding-cycle"
import type { ApiSheep, BulkResult } from "@/lib/api/types"
import { formatDisplayDate } from "@/lib/format"

const today = () => new Date().toISOString().split("T")[0]

type MatingBatchConfirmDrawerProps = {
  open: boolean
  onClose: () => void
  cycles: ApiBreedingCycle[]
  eweById: Map<string, ApiSheep>
  initialCycleFilter?: string
  initialSelectedIds?: string[]
  onSaved: () => void | Promise<void>
}

function sheepLabel(s: { tag: string; name?: string | null }) {
  return `${s.tag}${s.name ? ` ${s.name}` : ""}`
}

export function MatingBatchConfirmDrawer({
  open,
  onClose,
  cycles,
  eweById,
  initialCycleFilter = "",
  initialSelectedIds = [],
  onSaved,
}: MatingBatchConfirmDrawerProps) {
  const [cycleFilter, setCycleFilter] = useState("")
  const [matingDate, setMatingDate] = useState(today())
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<BulkResult | null>(null)

  const pending = useMemo(
    () => cycles.filter((c) => !c.matingId && c.ramId),
    [cycles],
  )

  const cycleNames = useMemo(
    () => Array.from(new Set(pending.map((c) => c.cycleName))).sort(),
    [pending],
  )

  const visible = useMemo(() => {
    if (!cycleFilter) return pending
    return pending.filter((c) => c.cycleName === cycleFilter)
  }, [pending, cycleFilter])

  const allSelected = visible.length > 0 && visible.every((c) => selected.has(c.id))

  useEffect(() => {
    if (!open) return
    setCycleFilter(initialCycleFilter)
    setMatingDate(today())
    setSelected(new Set(initialSelectedIds))
    setError(null)
    setResult(null)
  }, [open, initialCycleFilter, initialSelectedIds])

  useEffect(() => {
    if (!open) return
    setSelected((prev) => {
      const next = new Set<string>()
      for (const c of visible) {
        if (prev.has(c.id)) next.add(c.id)
      }
      return next
    })
  }, [open, cycleFilter, visible])

  function toggleAll() {
    setSelected((prev) => {
      if (visible.every((c) => prev.has(c.id))) {
        const next = new Set(prev)
        visible.forEach((c) => next.delete(c.id))
        return next
      }
      const next = new Set(prev)
      visible.forEach((c) => next.add(c.id))
      return next
    })
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setResult(null)
    if (!matingDate) {
      setError("Indica la fecha de monta")
      return
    }
    const ids = Array.from(selected)
    if (ids.length === 0) {
      setError("Selecciona al menos una oveja")
      return
    }
    setSaving(true)
    try {
      const res = await bulkConfirmBreedingCycles({ ids, matingDate })
      setResult(res)
      if (res.failed.length === 0) {
        await onSaved()
        onClose()
      } else {
        const failedIds = new Set(res.failed.map((f) => {
          const cycle = cycles.find((c) => c.eweId === f.sheepId)
          return cycle?.id ?? f.sheepId
        }))
        setSelected(failedIds)
        await onSaved()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron confirmar las montas")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Confirmar montas"
      description={`${selected.size} ciclo(s) seleccionado(s)`}
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
            form="batch-confirm-mating-form"
            disabled={saving || selected.size === 0}
            className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {saving && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            Confirmar ({selected.size})
          </button>
        </>
      }
    >
      <form id="batch-confirm-mating-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        {result && result.failed.length > 0 && (
          <div className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
            <p className="font-medium">
              {result.succeeded.length} confirmada(s), {result.failed.length} con error
            </p>
            <ul className="mt-1 list-disc pl-5">
              {result.failed.map((f) => (
                <li key={f.sheepId}>
                  {sheepLabel(eweById.get(f.sheepId) ?? { tag: f.sheepId })}: {f.error}
                </li>
              ))}
            </ul>
          </div>
        )}

        <Field label="Ciclo" htmlFor="confirm-cycle-filter">
          <select
            id="confirm-cycle-filter"
            value={cycleFilter}
            onChange={(e) => setCycleFilter(e.target.value)}
            className="block w-full rounded-md border-0 py-2 pl-3 pr-10 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
          >
            <option value="">Todos los ciclos pendientes</option>
            {cycleNames.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Fecha de monta" required htmlFor="batch-mating-date">
          <TextInput
            id="batch-mating-date"
            type="date"
            value={matingDate}
            onChange={(e) => setMatingDate(e.target.value)}
            required
          />
        </Field>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">Ovejas</p>
            <button
              type="button"
              onClick={toggleAll}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-500"
            >
              {allSelected ? "Quitar todas" : "Seleccionar todas"}
            </button>
          </div>
          <div className="max-h-72 divide-y divide-gray-100 overflow-y-auto rounded-md border border-gray-200">
            {visible.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-gray-500">
                Sin montas pendientes de confirmar
              </p>
            ) : (
              visible.map((c) => {
                const ewe = eweById.get(c.eweId) ?? c.ewe
                return (
                  <label
                    key={c.id}
                    className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(c.id)}
                      onChange={() => toggleOne(c.id)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-gray-900">
                        {ewe ? sheepLabel(ewe) : c.eweId}
                      </span>
                      <span className="block truncate text-xs text-gray-500">
                        {c.cycleName} · planificada {formatDisplayDate(c.matingDate)}
                      </span>
                    </span>
                  </label>
                )
              })
            )}
          </div>
        </div>
      </form>
    </Drawer>
  )
}
