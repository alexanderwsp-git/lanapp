"use client"

import { useEffect, useMemo, useState } from "react"
import { DiagnosisType } from "@sheep/domain"
import { Drawer } from "@/components/ui/drawer"
import { Field, Select, TextInput, Textarea } from "@/components/ui/form-fields"
import { SwitchField } from "@/components/ui/switch"
import { DiagnosisHistoryTable } from "@/components/diagnosis-history-table"
import type { ApiBreedingCycle } from "@/lib/api/breeding-cycle"
import { fetchPregnancyChecksByMating, type ApiPregnancyCheck } from "@/lib/api/pregnancy-check"
import type { ApiMating } from "@/lib/api/mating"
import {
  breedingResultToUiOptions,
  diagnosisTypesForForms,
  labelDiagnosisType,
} from "@/lib/labels/breeding"
import { formatDisplayDate, toDateInputValue } from "@/lib/format"
import { useReproductionParameters } from "@/lib/hooks/use-reproduction-parameters"
import { diagnoseOptionsForPhase, isPostPregnancyFollowUp, matingActions } from "@/lib/mating-actions"
import {
  defaultRemateDate,
  diagnosisFormFromCycle,
  diagnosisFormFromMating,
  ecoOutsideWindow,
  emptyDiagnosisForm,
  saveCycleDiagnosis,
  saveMatingDiagnosis,
  type DiagnosisFormState,
  type EcoResult,
} from "@/lib/mating/diagnosis-form"
import { suggestedEcoWindow } from "@sheep/domain"

type MatingTarget = {
  kind: "mating"
  mating: ApiMating & { checks: ApiPregnancyCheck[] }
  partnerLabel: string
  sheepId: string
  isFemale: boolean
}

type CycleTarget = {
  kind: "cycle"
  cycle: ApiBreedingCycle
  eweLabel: string
}

export type BreedingDiagnosisTarget = MatingTarget | CycleTarget

type BreedingDiagnosisDrawerProps = {
  open: boolean
  onClose: () => void
  target: BreedingDiagnosisTarget | null
  onSaved: () => void | Promise<void>
}

export function BreedingDiagnosisDrawer({
  open,
  onClose,
  target,
  onSaved,
}: BreedingDiagnosisDrawerProps) {
  const { params: reproParams } = useReproductionParameters()
  const [form, setForm] = useState<DiagnosisFormState>(emptyDiagnosisForm())
  const [diagHistory, setDiagHistory] = useState<ApiPregnancyCheck[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isMating = target?.kind === "mating"
  const mating = isMating ? target.mating : null
  const cycle = target?.kind === "cycle" ? target.cycle : null
  const hasMating = isMating ? true : !!cycle?.matingId

  const matingDate = mating?.matingDate ?? cycle?.confirmedMatingDate ?? cycle?.matingDate ?? ""
  const followUp = mating ? isPostPregnancyFollowUp(mating.checks) : false

  const resultOptions: EcoResult[] = useMemo(() => {
    if (mating) {
      const { phase } = matingActions(mating.checks)
      return diagnoseOptionsForPhase(phase, mating.checks)
    }
    return breedingResultToUiOptions()
  }, [mating])

  const outsideWindow = useMemo(() => {
    if (!matingDate || !form.checkDate) return false
    return ecoOutsideWindow(form.checkDate, matingDate, reproParams)
  }, [form.checkDate, matingDate, reproParams])

  useEffect(() => {
    if (!open || !target) return
    setError(null)
    setDiagHistory([])

    if (target.kind === "mating") {
      setForm(diagnosisFormFromMating(target.mating, reproParams))
      setDiagHistory(target.mating.checks)
    } else {
      setForm(diagnosisFormFromCycle(target.cycle))
      if (target.cycle.matingId) {
        fetchPregnancyChecksByMating(target.cycle.matingId)
          .then(setDiagHistory)
          .catch(() => setDiagHistory([]))
      }
    }
  }, [open, target, reproParams])

  useEffect(() => {
    if (form.result !== "Vacía" || followUp) return
    const suggested = defaultRemateDate(form.checkDate, reproParams)
    setForm((prev) =>
      prev.remateDate === suggested ? prev : { ...prev, remateDate: suggested },
    )
  }, [form.checkDate, form.result, followUp, reproParams])

  function setField<K extends keyof DiagnosisFormState>(key: K, value: DiagnosisFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!target || !form.checkDate) return
    setSaving(true)
    setError(null)
    try {
      if (target.kind === "mating") {
        await saveMatingDiagnosis({
          mating: target.mating,
          form,
          sheepId: target.sheepId,
          isFemale: target.isFemale,
          reproParams,
        })
      } else {
        await saveCycleDiagnosis({ cycle: target.cycle, form })
      }
      await onSaved()
      onClose()
    } catch (err) {
      if (err instanceof Error && err.message === "Cancelado") return
      setError(err instanceof Error ? err.message : "No se pudo guardar el diagnóstico")
    } finally {
      setSaving(false)
    }
  }

  const description =
    target?.kind === "mating"
      ? `Monta del ${formatDisplayDate(target.mating.matingDate)} · ${target.partnerLabel}`
      : target?.kind === "cycle"
        ? `${target.eweLabel} · ciclo ${target.cycle.cycleName}`
        : undefined

  const ecoWindow = matingDate ? suggestedEcoWindow(matingDate, reproParams) : null

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Registrar diagnóstico"
      description={description}
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
            form="breeding-diag-form"
            disabled={saving}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {saving ? "Guardando…" : "Guardar diagnóstico"}
          </button>
        </>
      }
    >
      <form id="breeding-diag-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        {diagHistory.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Historial de chequeos</p>
            <DiagnosisHistoryTable checks={diagHistory} />
          </div>
        )}

        {isMating && mating && !followUp && ecoWindow && (
          <p className="rounded-md bg-indigo-50 px-3 py-2 text-sm text-indigo-800">
            Ventana ECO recomendada: {formatDisplayDate(ecoWindow.min)} –{" "}
            {formatDisplayDate(ecoWindow.max)}
          </p>
        )}

        {isMating && mating && followUp && (
          <p className="rounded-md bg-pink-50 px-3 py-2 text-sm text-pink-800">
            Preñez confirmada. <strong>Revisar</strong> programa un control de gestación sin cambiar el
            estado preñada. <strong>Vacía</strong> solo si hubo pérdida o el diagnóstico fue erróneo.
          </p>
        )}

        {!isMating && (
          <p className="rounded-md bg-indigo-50 px-3 py-2 text-sm text-indigo-800">
            Diagnóstico de preñez por ecógrafo (ECO) o control manual.
          </p>
        )}

        {cycle && hasMating ? (
          <Field label="Fecha de monta confirmada" htmlFor="confirmed-mating-date">
            <TextInput
              id="confirmed-mating-date"
              type="date"
              value={toDateInputValue(cycle.confirmedMatingDate ?? cycle.matingDate ?? "")}
              readOnly
            />
          </Field>
        ) : cycle ? (
          <>
            <Field label="Fecha planificada" htmlFor="planned-mating-date">
              <TextInput
                id="planned-mating-date"
                type="date"
                value={toDateInputValue(cycle.matingDate)}
                readOnly
              />
            </Field>

            <SwitchField
              label="Confirmar monta al guardar"
              description="Registra la monta real antes del diagnóstico"
              checked={form.confirmMating}
              onChange={(checked) => setField("confirmMating", checked)}
              aria-label="Confirmar monta al guardar"
            />

            {form.confirmMating && (
              <Field label="Fecha de monta" required htmlFor="confirm-mating-date">
                <TextInput
                  id="confirm-mating-date"
                  type="date"
                  value={form.confirmMatingDate}
                  onChange={(e) => setField("confirmMatingDate", e.target.value)}
                  required
                />
              </Field>
            )}
          </>
        ) : null}

        <Field label="Tipo" required htmlFor="d-type">
          <Select
            id="d-type"
            value={form.diagnosisType}
            onChange={(e) => setField("diagnosisType", e.target.value as DiagnosisType)}
          >
            {diagnosisTypesForForms.map((type) => (
              <option key={type} value={type}>
                {labelDiagnosisType(type)}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Fecha del diagnóstico" required htmlFor="d-date">
          <TextInput
            id="d-date"
            type="date"
            value={form.checkDate}
            onChange={(e) => setField("checkDate", e.target.value)}
          />
        </Field>

        {outsideWindow && (
          <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
            La fecha está fuera de la ventana ECO recomendada ({reproParams.ecoCheckMinDays}–
            {reproParams.ecoCheckMaxDays} días post-monta). Puedes guardar igualmente si hay motivo
            clínico.
          </p>
        )}

        <Field label="Resultado" required>
          <div className="flex gap-2">
            {resultOptions.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setField("result", opt)}
                className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium ${
                  form.result === opt
                    ? opt === "Preñada"
                      ? "border-pink-300 bg-pink-50 text-pink-700"
                      : opt === "Revisar"
                        ? "border-yellow-300 bg-yellow-50 text-yellow-800"
                        : "border-gray-400 bg-gray-100 text-gray-800"
                    : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </Field>

        {form.result === "Revisar" && (
          <Field label="Próximo chequeo" htmlFor="d-next">
            <TextInput
              id="d-next"
              type="date"
              value={form.nextCheckDate}
              onChange={(e) => setField("nextCheckDate", e.target.value)}
            />
            {followUp && (
              <p className="mt-1 text-xs text-gray-500">
                La oveja sigue preñada; solo se agenda el próximo control.
              </p>
            )}
          </Field>
        )}

        {form.result === "Vacía" && (
          <>
            <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {followUp
                ? "Solo si hubo pérdida de gestación o el diagnóstico inicial fue erróneo. La oveja quedará disponible para nueva monta."
                : `Aplicar Vitasel y programar remate (~${reproParams.heatCycleDays} días).`}
              {form.checkDate && !followUp && (
                <> Remate sugerido: {formatDisplayDate(form.remateDate)}.</>
              )}
            </p>

            {!followUp && (
              <>
                <SwitchField
                  label="Vitasel aplicado"
                  checked={form.vitaselApplied}
                  onChange={(checked) => setField("vitaselApplied", checked)}
                  aria-label="Vitasel aplicado"
                />

                <SwitchField
                  label="Programar remate"
                  description={`Crea una monta planificada (~${reproParams.heatCycleDays} días)`}
                  checked={form.scheduleRemate}
                  onChange={(checked) => {
                    setField("scheduleRemate", checked)
                    if (checked && !form.remateDate) {
                      setField("remateDate", defaultRemateDate(form.checkDate, reproParams))
                    }
                  }}
                  aria-label="Programar remate"
                />

                {form.scheduleRemate && (
                  <>
                    <Field label="Fecha remate" required htmlFor="d-remate-date">
                      <TextInput
                        id="d-remate-date"
                        type="date"
                        value={form.remateDate}
                        onChange={(e) => setField("remateDate", e.target.value)}
                        required
                      />
                    </Field>
                    <Field label="Notas (remate)" htmlFor="d-remate-notes">
                      <Textarea
                        id="d-remate-notes"
                        rows={2}
                        value={form.remateNotes}
                        onChange={(e) => setField("remateNotes", e.target.value)}
                        placeholder="Opcional"
                      />
                    </Field>
                  </>
                )}
              </>
            )}
          </>
        )}

        <Field label="Notas" htmlFor="d-notes">
          <Textarea
            id="d-notes"
            rows={2}
            value={form.notes}
            onChange={(e) => setField("notes", e.target.value)}
          />
        </Field>
      </form>
    </Drawer>
  )
}