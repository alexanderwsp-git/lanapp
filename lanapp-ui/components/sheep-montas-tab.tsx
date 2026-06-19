"use client"

import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import {
  Gender,
  DiagnosisType,
  SheepCategory,
  SheepStatus,
  BreedingCycleStatus,
  deliveryCheck,
  expectedBirthFromMating,
  isOutsideEcoWindow,
  suggestedEcoWindow,
  suggestedRemateDate,
} from "@sheep/domain"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Drawer } from "@/components/ui/drawer"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import { Field, Select, TextInput, Textarea } from "@/components/ui/form-fields"
import {
  MatingActivityFeed,
  matingPhaseSummary,
} from "@/components/mating-timeline"
import { diagnoseOptionsForPhase, isPostPregnancyFollowUp, matingActions } from "@/lib/mating-actions"
import {
  createMating,
  fetchMatingsBySheep,
  type ApiMating,
  type MatingCreatePayload,
} from "@/lib/api/mating"
import {
  fetchPregnancyChecksByMating,
  recordDelivery,
  recordPregnancyCheck,
  type ApiPregnancyCheck,
  type PregnancyCheckCreatePayload,
} from "@/lib/api/pregnancy-check"
import {
  confirmBreedingCycleMating,
  fetchBreedingCyclesByEwe,
  type ApiBreedingCycle,
} from "@/lib/api/breeding-cycle"
import { fetchSheep } from "@/lib/api/sheep"
import type { ApiSheep } from "@/lib/api/types"
import {
  eweBreedingEligibility,
  isEweBreedingEligible,
  isRamBreedingEligible,
  ramBreedingEligibility,
} from "@/lib/breeding-eligibility"
import { useReproductionParameters } from "@/lib/hooks/use-reproduction-parameters"
import { formatDisplayDate, formatAgeDays, toDateInputValue } from "@/lib/format"
import { labelBreedingResult, labelDiagnosisType, diagnosisTypesForForms } from "@/lib/labels/breeding"
import { labelMatingStatus, matingStatusBadgeColor } from "@/lib/labels/mating"
import { labelCategory } from "@/lib/labels/sheep"
import { HeartIcon } from "@heroicons/react/24/outline"

const today = () => new Date().toISOString().split("T")[0]

const MONTAS_DIAGNOSIS_TYPES = diagnosisTypesForForms

type EcoResult = "Preñada" | "Vacía" | "Revisar"

type MatingRow = ApiMating & { checks: ApiPregnancyCheck[] }

function sheepLabel(s: Pick<ApiSheep, "tag" | "name"> | null | undefined, id: string): string {
  if (!s) return id
  return s.name ? `${s.tag} · ${s.name}` : s.tag
}

export function SheepMontasTab({
  sheep,
  onUpdated,
}: {
  sheep: ApiSheep
  onUpdated?: () => void
}) {
  const sheepId = sheep.id
  const isFemale = sheep.gender === Gender.FEMALE

  const [rows, setRows] = useState<MatingRow[]>([])
  const [cycles, setCycles] = useState<ApiBreedingCycle[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [partners, setPartners] = useState<ApiSheep[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [partner, setPartner] = useState("")
  const [matingDate, setMatingDate] = useState(today())
  const [notes, setNotes] = useState("")

  const [ecoFor, setEcoFor] = useState<MatingRow | null>(null)
  const [ecoType, setEcoType] = useState<DiagnosisType>(DiagnosisType.ECO)
  const [ecoResult, setEcoResult] = useState<EcoResult>("Preñada")
  const [checkDate, setCheckDate] = useState(today())
  const [nextCheckDate, setNextCheckDate] = useState("")
  const [ecoNotes, setEcoNotes] = useState("")
  const [ecoVitasel, setEcoVitasel] = useState(false)

  const [partoFor, setPartoFor] = useState<MatingRow | null>(null)
  const [deliveryDate, setDeliveryDate] = useState(today())
  const [partoNotes, setPartoNotes] = useState("")

  const partnerLabel = isFemale ? "Reproductor" : "Oveja"
  const { params: reproParams } = useReproductionParameters()

  const registerBlockReason = isFemale
    ? eweBreedingEligibility(sheep)
    : ramBreedingEligibility(sheep)
  const canRegister = !registerBlockReason

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const [matings, partnerList, eweCycles] = await Promise.all([
        fetchMatingsBySheep(sheepId),
        fetchSheep({
          gender: isFemale ? Gender.MALE : Gender.FEMALE,
          status: SheepStatus.ACTIVE,
          limit: 200,
        }),
        isFemale ? fetchBreedingCyclesByEwe(sheepId).catch(() => []) : Promise.resolve([]),
      ])
      const withChecks = await Promise.all(
        matings.map(async (m) => ({
          ...m,
          checks: await fetchPregnancyChecksByMating(m.id).catch(() => []),
        })),
      )
      setRows(withChecks.sort((a, b) => b.matingDate.localeCompare(a.matingDate)))
      setCycles(eweCycles)
      setPartners(partnerList.items)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "No se pudieron cargar las montas")
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [isFemale, sheepId])

  useEffect(() => {
    load()
  }, [load])

  const partnerOptions: ComboboxOption[] = useMemo(() => {
    const eligible = partners.filter((s) =>
      isFemale ? isRamBreedingEligible(s) : isEweBreedingEligible(s),
    )
    return eligible
      .filter((s) => s.id !== sheepId)
      .map((s) => ({
        value: s.id,
        label: s.tag,
        sublabel: `${s.name ?? labelCategory(s.category)} · ${formatDisplayDate(s.birthDate)}`,
      }))
  }, [isFemale, partners, sheepId])

  const expectedBirth = useMemo(
    () => (matingDate ? expectedBirthFromMating(matingDate, reproParams) : ""),
    [matingDate, reproParams],
  )

  const ecoOutsideWindow = useMemo(() => {
    if (!ecoFor || !checkDate) return false
    return isOutsideEcoWindow(checkDate, ecoFor.matingDate, reproParams)
  }, [checkDate, ecoFor, reproParams])

  function partnerOf(row: MatingRow) {
    return isFemale ? row.maleId : row.femaleId
  }

  function partnerDisplay(row: MatingRow) {
    const s = isFemale ? row.male : row.female
    return sheepLabel(s, partnerOf(row))
  }

  function partoDate(row: MatingRow): string | null {
    const d = deliveryCheck(row.checks)
    return d ? toDateInputValue(String(d.checkDate)) : null
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (!partner || !matingDate) return
    setSaving(true)
    try {
      const femaleId = isFemale ? sheepId : partner
      const maleId = isFemale ? partner : sheepId
      await createMating({
        maleId,
        femaleId,
        matingDate,
        expectedBirthDate: expectedBirth || undefined,
        notes: notes.trim() || undefined,
      } satisfies MatingCreatePayload)
      setPartner("")
      setMatingDate(today())
      setNotes("")
      await load()
      onUpdated?.()
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "No se pudo registrar la monta")
    } finally {
      setSaving(false)
    }
  }

  function openEco(row: MatingRow) {
    const { phase } = matingActions(row.checks)
    const options = diagnoseOptionsForPhase(phase, row.checks)
    const window = suggestedEcoWindow(row.matingDate, reproParams)
    const defaultDate =
      today() >= window.min && today() <= window.max ? today() : window.min
    const followUp = isPostPregnancyFollowUp(row.checks)
    setEcoFor(row)
    setEcoType(followUp || phase === "pregnant" ? DiagnosisType.FAMACHA : DiagnosisType.ECO)
    setEcoResult(options[0] ?? "Preñada")
    setCheckDate(followUp ? today() : defaultDate)
    setNextCheckDate(followUp ? "" : window.max)
    setEcoNotes("")
    setEcoVitasel(false)
  }

  async function handleEcoSave(e: React.FormEvent) {
    e.preventDefault()
    if (!ecoFor || !checkDate) return

    const followUp = isPostPregnancyFollowUp(ecoFor.checks)
    if (ecoResult === "Vacía" && followUp) {
      const ok = window.confirm(
        "La oveja fue confirmada preñada en esta monta. ¿Marcar como vacía (pérdida de gestación o error de diagnóstico)? Esto desbloqueará la oveja para una nueva monta.",
      )
      if (!ok) return
    }

    setSaving(true)
    try {
      const isPregnant = ecoResult === "Preñada"
      await recordPregnancyCheck({
        matingId: ecoFor.id,
        checkDate,
        isPregnant,
        checkType: ecoType,
        notes: ecoNotes.trim() || undefined,
        nextCheckDate: ecoResult === "Revisar" && nextCheckDate ? nextCheckDate : undefined,
        vitaselApplied: ecoResult === "Vacía" ? ecoVitasel : undefined,
      } satisfies PregnancyCheckCreatePayload)
      setEcoFor(null)
      await load()
      onUpdated?.()
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "No se pudo guardar el chequeo")
    } finally {
      setSaving(false)
    }
  }

  async function confirmCycleMating(cycle: ApiBreedingCycle) {
    try {
      await confirmBreedingCycleMating(cycle.id)
      await load()
      onUpdated?.()
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "No se pudo confirmar la monta")
    }
  }

  const activeCycles = useMemo(
    () =>
      isFemale
        ? cycles.filter(
            (c) => c.status !== BreedingCycleStatus.CANCELLED && !c.actualBirthDate,
          )
        : [],
    [cycles, isFemale],
  )

  function openParto(row: MatingRow) {
    setPartoFor(row)
    setDeliveryDate(today())
    setPartoNotes("")
  }

  async function handlePartoSave(e: React.FormEvent) {
    e.preventDefault()
    if (!partoFor || !deliveryDate) return
    setSaving(true)
    try {
      await recordDelivery(partoFor.id, {
        deliveryDate,
        notes: partoNotes.trim() || "Parto registrado",
      })
      setPartoFor(null)
      await load()
      onUpdated?.()
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "No se pudo registrar el parto")
    } finally {
      setSaving(false)
    }
  }

  function partnerBirth(row: MatingRow): string {
    const s = isFemale ? row.male : row.female
    return s?.birthDate ? formatDisplayDate(s.birthDate) : "—"
  }

  const inLactancia = isFemale && sheep.category === SheepCategory.OVEJA_LACTANCIA
  const isPregnantEwe =
    isFemale &&
    (sheep.isPregnant ||
      sheep.category === SheepCategory.OVEJA_PRENADA ||
      sheep.category === SheepCategory.BORREGA_PRENADA)

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-gray-600">
        <span className="font-medium text-gray-900">{sheep.tag}</span>
        {" · Nacimiento "}
        {formatDisplayDate(sheep.birthDate)}
        {" · "}
        {formatAgeDays(sheep.birthDate)}
      </p>
      {inLactancia && (
        <div className="rounded-md bg-pink-50 px-4 py-3 text-sm font-medium text-pink-700">
          Oveja en lactancia — no apta para monta hasta destete.
        </div>
      )}
      {isPregnantEwe && (
        <div className="rounded-md bg-pink-50 px-4 py-3 text-sm font-medium text-pink-800">
          Oveja preñada — monta bloqueada hasta el parto.
          {sheep.pregnancyConfirmedAt &&
            ` Confirmada ${formatDisplayDate(sheep.pregnancyConfirmedAt)}.`}
        </div>
      )}

      {loadError && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
          <button type="button" onClick={load} className="ml-2 font-semibold underline">
            Reintentar
          </button>
        </div>
      )}

      {activeCycles.length > 0 && (
        <div className="rounded-lg bg-white p-4 shadow">
          <h3 className="text-sm font-semibold text-gray-900">Ciclos planificados</h3>
          <p className="mt-1 text-xs text-gray-500">
            Desde el planificador. Confirma la monta y registra diagnósticos en la tabla de abajo.
          </p>
          <ul className="mt-3 divide-y divide-gray-100">
            {activeCycles.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <div className="text-sm text-gray-700">
                  <span className="font-medium">{c.cycleName}</span>
                  {" · "}
                  {formatDisplayDate(c.matingDate)}
                  {" · "}
                  {labelBreedingResult(c.result)}
                </div>
                <div className="flex gap-2">
                  {!c.matingId && (
                    <button
                      type="button"
                      onClick={() => confirmCycleMating(c)}
                      className="text-xs font-medium text-indigo-600 hover:underline"
                    >
                      Confirmar monta
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {canRegister ? (
        <form onSubmit={handleRegister} className="rounded-lg bg-white p-4 shadow">
          <div className="flex flex-wrap items-start gap-4">
            <Field label={partnerLabel} htmlFor="partner" required className="w-64">
              <Combobox
                id="partner"
                options={partnerOptions}
                value={partner}
                onChange={setPartner}
                placeholder={`Seleccionar ${partnerLabel.toLowerCase()}`}
                searchPlaceholder="Buscar por arete o nombre…"
                emptyMessage={`Sin ${partnerLabel.toLowerCase()}es aptos`}
              />
            </Field>
            <Field label="Fecha monta" htmlFor="fecha-monta" required className="w-48">
              <TextInput
                id="fecha-monta"
                type="date"
                value={matingDate}
                onChange={(e) => setMatingDate(e.target.value)}
              />
              {expectedBirth && (
                <p className="mt-1 text-xs text-gray-500">
                  Parto esperado (~{reproParams.gestationDays} días): {expectedBirth}
                </p>
              )}
            </Field>
            <Field label="Notas (opcional)" htmlFor="monta-notes" className="w-64">
              <TextInput id="monta-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </Field>
            <button
              type="submit"
              disabled={!partner || !matingDate || saving}
              className="mt-7 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {saving ? "Guardando…" : "Registrar monta"}
            </button>
          </div>
        </form>
      ) : (
        <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600">
          {registerBlockReason ?? "No apta para registrar monta."}
        </div>
      )}

      <div className="overflow-hidden rounded-lg bg-white shadow">
        {loading ? (
          <p className="p-8 text-center text-sm text-gray-500">Cargando montas…</p>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={HeartIcon}
            title="Sin montas"
            description="No hay montas registradas para esta oveja."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {["Fecha", "Pareja", "Nac. pareja", "Estado", "Diagnóstico", "Acciones"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((m) => {
                  const phaseInfo = matingPhaseSummary(m.checks)
                  const actions = matingActions(m.checks)
                  const birth = partoDate(m)
                  const isExpanded = expandedId === m.id
                  const ecoWindow = suggestedEcoWindow(m.matingDate, reproParams)
                  return (
                    <Fragment key={m.id}>
                      <tr className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                          {formatDisplayDate(m.matingDate)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{partnerDisplay(m)}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{partnerBirth(m)}</td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex flex-col gap-1">
                            <StatusBadge color={phaseInfo.color}>{phaseInfo.label}</StatusBadge>
                            <StatusBadge color={matingStatusBadgeColor(m.status)}>
                              {labelMatingStatus(m.status)}
                            </StatusBadge>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {phaseInfo.detail && <div>{phaseInfo.detail}</div>}
                          {actions.phase === "awaiting_diagnosis" && (
                            <div className="mt-1 text-indigo-700">
                              ECO sugerido: {formatDisplayDate(ecoWindow.min)} –{" "}
                              {formatDisplayDate(ecoWindow.max)}
                            </div>
                          )}
                          {m.expectedBirthDate && actions.phase === "pregnant" && !birth && (
                            <div className="mt-1">Parto esperado: {formatDisplayDate(m.expectedBirthDate)}</div>
                          )}
                          {birth && <div className="mt-1">Parto: {formatDisplayDate(birth)}</div>}
                          {actions.phase === "empty" && (
                            <div className="mt-1 text-amber-700">
                              Aplicar Vitasel y registrar nueva monta (~{reproParams.heatCycleDays} días)
                            </div>
                          )}
                          {!phaseInfo.detail && !birth && actions.phase === "awaiting_diagnosis" && "—"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex flex-wrap gap-2">
                            {actions.canDiagnose ? (
                              <button
                                type="button"
                                onClick={() => openEco(m)}
                                className="text-xs font-medium text-indigo-600 hover:underline"
                              >
                                Diagnóstico
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400" title={actions.diagnoseBlockedReason}>
                                {actions.diagnoseBlockedReason}
                              </span>
                            )}
                            {actions.canDeliver ? (
                              <button
                                type="button"
                                onClick={() => openParto(m)}
                                className="text-xs font-medium text-indigo-600 hover:underline"
                              >
                                Registrar parto
                              </button>
                            ) : actions.phase === "pregnant" ? null : actions.deliverBlockedReason ? (
                              <span className="text-xs text-gray-400">{actions.deliverBlockedReason}</span>
                            ) : null}
                            {m.checks.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setExpandedId(isExpanded ? null : m.id)}
                                className="text-xs font-medium text-gray-600 hover:underline"
                              >
                                {isExpanded ? "Ocultar historial" : `Historial (${m.checks.length})`}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={6} className="bg-gray-50 px-4 py-4">
                            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                              Historial
                            </p>
                            <MatingActivityFeed
                              checks={m.checks}
                              mating={{
                                matingDate: m.matingDate,
                                partnerLabel: partnerDisplay(m),
                              }}
                            />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Drawer
        open={ecoFor !== null}
        onClose={() => setEcoFor(null)}
        title="Registrar diagnóstico"
        description={ecoFor ? `Monta del ${formatDisplayDate(ecoFor.matingDate)} · ${partnerDisplay(ecoFor)}` : undefined}
        footer={
          <>
            <button
              type="button"
              onClick={() => setEcoFor(null)}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="eco-form"
              disabled={saving}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {saving ? "Guardando…" : "Guardar chequeo"}
            </button>
          </>
        }
      >
        <form id="eco-form" onSubmit={handleEcoSave} className="flex flex-col gap-4">
          {ecoFor && !isPostPregnancyFollowUp(ecoFor.checks) && (
            <p className="rounded-md bg-indigo-50 px-3 py-2 text-sm text-indigo-800">
              Ventana ECO recomendada:{" "}
              {formatDisplayDate(suggestedEcoWindow(ecoFor.matingDate, reproParams).min)} –{" "}
              {formatDisplayDate(suggestedEcoWindow(ecoFor.matingDate, reproParams).max)}
            </p>
          )}
          {ecoFor && isPostPregnancyFollowUp(ecoFor.checks) && (
            <p className="rounded-md bg-pink-50 px-3 py-2 text-sm text-pink-800">
              Preñez confirmada. <strong>Revisar</strong> programa un control de gestación sin cambiar el
              estado preñada. <strong>Vacía</strong> solo si hubo pérdida o el diagnóstico fue erróneo.
            </p>
          )}
          <Field label="Tipo" required htmlFor="eco-type">
            <Select id="eco-type" value={ecoType} onChange={(e) => setEcoType(e.target.value as DiagnosisType)}>
              {MONTAS_DIAGNOSIS_TYPES.map((t) => (
                <option key={t} value={t}>
                  {labelDiagnosisType(t)}
                </option>
              ))}
            </Select>
            <p className="mt-1 text-xs text-gray-500">
              ECO = ecógrafo · FAMACHA = control manual de preñez (sin equipo).
            </p>
          </Field>
          <Field label="Resultado" required>
            <div className="flex gap-2">
              {(ecoFor
                ? diagnoseOptionsForPhase(matingActions(ecoFor.checks).phase, ecoFor.checks)
                : (["Preñada", "Vacía", "Revisar"] as EcoResult[])
              ).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setEcoResult(opt)}
                  className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium ${
                    ecoResult === opt
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
          <Field label="Fecha chequeo" htmlFor="eco-date" required>
            <TextInput id="eco-date" type="date" value={checkDate} onChange={(e) => setCheckDate(e.target.value)} />
          </Field>
          {ecoOutsideWindow && (
            <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
              La fecha está fuera de la ventana ECO recomendada ({reproParams.ecoCheckMinDays}–
              {reproParams.ecoCheckMaxDays} días post-monta). Puedes guardar igualmente si hay motivo
              clínico.
            </p>
          )}
          {ecoResult === "Revisar" && (
            <Field label="Próximo chequeo" htmlFor="eco-next">
              <TextInput
                id="eco-next"
                type="date"
                value={nextCheckDate}
                onChange={(e) => setNextCheckDate(e.target.value)}
              />
              {ecoFor && isPostPregnancyFollowUp(ecoFor.checks) && (
                <p className="mt-1 text-xs text-gray-500">
                  La oveja sigue preñada; solo se agenda el próximo control.
                </p>
              )}
            </Field>
          )}
          {ecoResult === "Vacía" && (
            <>
              <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
                {ecoFor && isPostPregnancyFollowUp(ecoFor.checks)
                  ? "Solo si hubo pérdida de gestación o el ECO inicial fue erróneo. La oveja quedará disponible para nueva monta."
                  : `Aplicar Vitasel y programar segunda monta (~${reproParams.heatCycleDays} días).`}
                {checkDate && !(ecoFor && isPostPregnancyFollowUp(ecoFor.checks)) && (
                  <>
                    {" "}
                    Remate sugerido: {formatDisplayDate(suggestedRemateDate(checkDate, reproParams))}.
                  </>
                )}
              </p>
              {!(ecoFor && isPostPregnancyFollowUp(ecoFor.checks)) && (
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={ecoVitasel}
                    onChange={(e) => setEcoVitasel(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                  />
                  Vitasel aplicado
                </label>
              )}
            </>
          )}
          <Field label="Notas" htmlFor="eco-notes">
            <Textarea
              id="eco-notes"
              rows={2}
              value={ecoNotes}
              onChange={(e) => setEcoNotes(e.target.value)}
            />
          </Field>
        </form>
      </Drawer>

      <Drawer
        open={partoFor !== null}
        onClose={() => setPartoFor(null)}
        title="Registrar parto"
        description={
          partoFor ? `Monta del ${formatDisplayDate(partoFor.matingDate)} · ${partnerDisplay(partoFor)}` : undefined
        }
        footer={
          <>
            <button
              type="button"
              onClick={() => setPartoFor(null)}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="parto-form"
              disabled={saving}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {saving ? "Guardando…" : "Guardar parto"}
            </button>
          </>
        }
      >
        <form id="parto-form" onSubmit={handlePartoSave} className="flex flex-col gap-4">
          <Field label="Fecha parto" htmlFor="parto-date" required>
            <TextInput
              id="parto-date"
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
            />
          </Field>
          <Field label="Notas" htmlFor="parto-notes">
            <Textarea
              id="parto-notes"
              rows={2}
              value={partoNotes}
              onChange={(e) => setPartoNotes(e.target.value)}
              placeholder="Parto simple, cordero sano"
            />
          </Field>
          <p className="text-xs text-gray-500">
            Registra cada cría manualmente en Nueva oveja con la misma fecha de nacimiento.
          </p>
        </form>
      </Drawer>
    </div>
  )
}
