"use client"

import { useEffect, useState } from "react"
import { DiagnosisType } from "@sheep/domain"
import { Drawer } from "@/components/ui/drawer"
import { Field, Select, TextInput, Textarea } from "@/components/ui/form-fields"
import { SwitchField } from "@/components/ui/switch"
import { DiagnosisHistoryTable } from "@/components/diagnosis-history-table"
import {
  recordBreedingDiagnosis,
  type ApiBreedingCycle,
} from "@/lib/api/breeding-cycle"
import { fetchPregnancyChecksByMating, type ApiPregnancyCheck } from "@/lib/api/pregnancy-check"
import {
  breedingResultToUiOptions,
  uiResultToBreedingResult,
} from "@/lib/labels/breeding"
import { toDateInputValue } from "@/lib/format"

const today = () => new Date().toISOString().split("T")[0]

type EcoResult = "Preñada" | "Vacía" | "Revisar"

type BreedingDiagnosisDrawerProps = {
  open: boolean
  onClose: () => void
  cycle: ApiBreedingCycle | null
  eweLabel: string
  onSaved: () => void | Promise<void>
}

export function BreedingDiagnosisDrawer({
  open,
  onClose,
  cycle,
  eweLabel,
  onSaved,
}: BreedingDiagnosisDrawerProps) {
  const [dDate, setDDate] = useState(today())
  const [dResult, setDResult] = useState<EcoResult>("Preñada")
  const [dNotes, setDNotes] = useState("")
  const [dNextCheck, setDNextCheck] = useState("")
  const [confirmMating, setConfirmMating] = useState(false)
  const [confirmMatingDate, setConfirmMatingDate] = useState(today())
  const [diagHistory, setDiagHistory] = useState<ApiPregnancyCheck[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasMating = !!cycle?.matingId

  useEffect(() => {
    if (!open || !cycle) return
    setDDate(today())
    setDResult("Preñada")
    setDNotes("")
    setDNextCheck("")
    setConfirmMating(!cycle.matingId)
    setConfirmMatingDate(today())
    setError(null)
    setDiagHistory([])
    if (cycle.matingId) {
      fetchPregnancyChecksByMating(cycle.matingId)
        .then(setDiagHistory)
        .catch(() => setDiagHistory([]))
    }
  }, [open, cycle])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!cycle || !dDate) return
    if (!hasMating && confirmMating && !confirmMatingDate) {
      setError("Indica la fecha de monta")
      return
    }
    if (!hasMating && !confirmMating) {
      setError('Confirma la monta o activa "Confirmar monta al guardar"')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await recordBreedingDiagnosis(cycle.id, {
        diagnosisType: DiagnosisType.ECO,
        diagnosisDate: dDate,
        result: uiResultToBreedingResult(dResult),
        notes: dNotes.trim() || undefined,
        nextCheckDate: dResult === "Revisar" && dNextCheck ? dNextCheck : undefined,
        confirmMating: !hasMating && confirmMating,
        confirmMatingDate: !hasMating && confirmMating ? confirmMatingDate : undefined,
      })
      await onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el diagnóstico")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Registrar diagnóstico"
      description={cycle ? `${eweLabel} · ciclo ${cycle.cycleName}` : undefined}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cerrar
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

        <p className="rounded-md bg-indigo-50 px-3 py-2 text-sm text-indigo-800">
          Diagnóstico de preñez por ecógrafo (ECO).
        </p>

        {hasMating ? (
          <Field label="Fecha de monta confirmada" htmlFor="confirmed-mating-date">
            <TextInput
              id="confirmed-mating-date"
              type="date"
              value={toDateInputValue(cycle?.confirmedMatingDate ?? "")}
              readOnly
            />
          </Field>
        ) : (
          <>
            <Field label="Fecha planificada" htmlFor="planned-mating-date">
              <TextInput
                id="planned-mating-date"
                type="date"
                value={cycle ? toDateInputValue(cycle.matingDate) : ""}
                readOnly
              />
            </Field>

            <SwitchField
              label="Confirmar monta al guardar"
              description="Registra la monta real antes del diagnóstico ECO"
              checked={confirmMating}
              onChange={setConfirmMating}
              aria-label="Confirmar monta al guardar"
            />

            {confirmMating && (
              <Field label="Fecha de monta" required htmlFor="confirm-mating-date">
                <TextInput
                  id="confirm-mating-date"
                  type="date"
                  value={confirmMatingDate}
                  onChange={(e) => setConfirmMatingDate(e.target.value)}
                  required
                />
              </Field>
            )}
          </>
        )}

        <Field label="Fecha del diagnóstico" required htmlFor="d-date">
          <TextInput id="d-date" type="date" value={dDate} onChange={(e) => setDDate(e.target.value)} />
        </Field>

        <Field label="Resultado" required htmlFor="d-result">
          <Select
            id="d-result"
            value={dResult}
            onChange={(e) => setDResult(e.target.value as EcoResult)}
          >
            {breedingResultToUiOptions().map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        </Field>

        {dResult === "Revisar" && (
          <Field label="Próximo chequeo" htmlFor="d-next">
            <TextInput
              id="d-next"
              type="date"
              value={dNextCheck}
              onChange={(e) => setDNextCheck(e.target.value)}
            />
          </Field>
        )}

        <Field label="Notas" htmlFor="d-notes">
          <Textarea id="d-notes" rows={2} value={dNotes} onChange={(e) => setDNotes(e.target.value)} />
        </Field>
      </form>
    </Drawer>
  )
}
