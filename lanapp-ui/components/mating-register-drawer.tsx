"use client"

import { useEffect, useMemo, useState } from "react"
import { expectedBirthFromMating } from "@sheep/domain"
import { Drawer } from "@/components/ui/drawer"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import { Field, TextInput, Textarea } from "@/components/ui/form-fields"
import { SwitchField } from "@/components/ui/switch"
import type { ApiBreedingCycle } from "@/lib/api/breeding-cycle"
import { useReproductionParameters } from "@/lib/hooks/use-reproduction-parameters"
import {
  defaultNextMatingDate,
  emptyMatingForm,
  matingFormFromPlannedCycle,
  saveMatingForm,
  type MatingFormState,
} from "@/lib/mating/application-form"

type MatingRegisterDrawerProps = {
  open: boolean
  onClose: () => void
  sheepId: string
  sheepLabel: string
  isFemale: boolean
  partnerLabel: string
  partnerOptions: ComboboxOption[]
  plannedCycle?: ApiBreedingCycle | null
  onSaved: (message: string) => void | Promise<void>
}

function Separator() {
  return <hr className="border-gray-200" />
}

function drawerMeta(scheduleOnly: boolean, confirmingPlanned: boolean) {
  if (scheduleOnly) return { title: "Programar monta", submit: "Programar" }
  if (confirmingPlanned) return { title: "Confirmar monta", submit: "Confirmar monta" }
  return { title: "Registrar monta", submit: "Confirmar monta" }
}

export function MatingRegisterDrawer({
  open,
  onClose,
  sheepId,
  sheepLabel,
  isFemale,
  partnerLabel,
  partnerOptions,
  plannedCycle = null,
  onSaved,
}: MatingRegisterDrawerProps) {
  const { params: reproParams } = useReproductionParameters()
  const [form, setForm] = useState<MatingFormState>(emptyMatingForm())
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const confirmingPlanned = !!plannedCycle

  useEffect(() => {
    if (!open) return
    if (plannedCycle) {
      setForm(matingFormFromPlannedCycle(plannedCycle))
    } else {
      setForm(emptyMatingForm())
    }
    setError(null)
  }, [open, plannedCycle])

  const expectedBirth = useMemo(
    () =>
      form.matingDate && !form.scheduleOnly
        ? expectedBirthFromMating(form.matingDate, reproParams)
        : "",
    [form.matingDate, form.scheduleOnly, reproParams],
  )

  const partnerRequired = !(form.scheduleOnly && isFemale)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      if (!form.scheduleOnly && form.scheduleNext && !form.nextScheduledDate) {
        throw new Error("Indica la fecha de la próxima monta")
      }
      if (form.scheduleOnly && !form.cycleName.trim()) {
        throw new Error("Indica el nombre del ciclo")
      }
      if (partnerRequired && !form.partnerId) {
        throw new Error(isFemale ? "Selecciona un reproductor" : "Selecciona una oveja")
      }
      const { successMessage } = await saveMatingForm({
        sheepId,
        isFemale,
        form,
        sheepLabel,
        plannedCycleId: plannedCycle?.id,
        reproParams,
      })
      await onSaved(successMessage)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la monta")
    } finally {
      setSaving(false)
    }
  }

  const { title, submit } = drawerMeta(form.scheduleOnly, confirmingPlanned)

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={title}
      description={sheepLabel}
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
            form="mating-register-form"
            disabled={saving || (partnerRequired && !form.partnerId)}
            className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {saving && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            {submit}
          </button>
        </>
      }
    >
      <form id="mating-register-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        {confirmingPlanned ? (
          <p className="rounded-md bg-indigo-50 px-3 py-2 text-sm text-indigo-800">
            Monta programada ({plannedCycle?.cycleName}). Confirma que ocurrió en campo o ajusta
            fecha y notas.
          </p>
        ) : (
          <SwitchField
            label="Programar para después"
            description="Sin registrar monta ahora — queda pendiente en la tabla"
            checked={form.scheduleOnly}
            onChange={(checked) =>
              setForm((prev) => ({
                ...prev,
                scheduleOnly: checked,
                scheduleNext: checked ? false : prev.scheduleNext,
              }))
            }
            aria-label="Programar para después"
          />
        )}

        <Field
          label={partnerLabel}
          htmlFor="mating-partner"
          required={partnerRequired}
        >
          <Combobox
            id="mating-partner"
            options={partnerOptions}
            value={form.partnerId}
            onChange={(partnerId) => setForm((prev) => ({ ...prev, partnerId }))}
            placeholder={`Seleccionar ${partnerLabel.toLowerCase()}`}
            searchPlaceholder="Buscar por arete o nombre…"
            emptyMessage={`Sin ${partnerLabel.toLowerCase()}es aptos`}
          />
        </Field>

        {(form.scheduleOnly || confirmingPlanned) && (
          <Field label="Ciclo" required={form.scheduleOnly} htmlFor="mating-cycle">
            <TextInput
              id="mating-cycle"
              value={form.cycleName}
              onChange={(e) => setForm((prev) => ({ ...prev, cycleName: e.target.value }))}
              placeholder="Ej. 2026-A"
              readOnly={confirmingPlanned}
              required={form.scheduleOnly}
            />
          </Field>
        )}

        {confirmingPlanned && (
          <Field label="Fecha planificada" htmlFor="mating-planned-date">
            <TextInput
              id="mating-planned-date"
              type="date"
              value={form.plannedDate}
              readOnly
            />
          </Field>
        )}

        <Field
          label={form.scheduleOnly ? "Fecha programada" : "Fecha de monta"}
          htmlFor="mating-date"
          required
        >
          <TextInput
            id="mating-date"
            type="date"
            value={form.matingDate}
            onChange={(e) => setForm((prev) => ({ ...prev, matingDate: e.target.value }))}
            required
          />
          {expectedBirth && (
            <p className="mt-1 text-xs text-gray-500">
              Parto esperado (~{reproParams.gestationDays} días): {expectedBirth}
            </p>
          )}
        </Field>

        <Field label="Notas" htmlFor="mating-notes">
          <Textarea
            id="mating-notes"
            rows={2}
            value={form.notes}
            onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
            placeholder="Opcional"
          />
        </Field>

        {!form.scheduleOnly && (
          <>
            <Separator />

            <SwitchField
              label="Programar próxima monta"
              description="Crea otra monta programada después de esta"
              checked={form.scheduleNext}
              onChange={(checked) => {
                setForm((prev) => ({
                  ...prev,
                  scheduleNext: checked,
                  nextScheduledDate:
                    checked && !prev.nextScheduledDate
                      ? defaultNextMatingDate(prev.matingDate, reproParams)
                      : prev.nextScheduledDate,
                }))
              }}
              aria-label="Programar próxima monta"
            />

            {form.scheduleNext && (
              <>
                <Field label="Fecha próxima monta" required htmlFor="mating-next">
                  <TextInput
                    id="mating-next"
                    type="date"
                    value={form.nextScheduledDate}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, nextScheduledDate: e.target.value }))
                    }
                    required
                  />
                </Field>
                <Field label="Notas (próxima monta)" htmlFor="mating-next-notes">
                  <Textarea
                    id="mating-next-notes"
                    rows={2}
                    value={form.nextNotes}
                    onChange={(e) => setForm((prev) => ({ ...prev, nextNotes: e.target.value }))}
                    placeholder="Opcional — recordatorio para la siguiente monta"
                  />
                </Field>
              </>
            )}
          </>
        )}
      </form>
    </Drawer>
  )
}
