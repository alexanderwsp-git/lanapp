"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Gender,
  DiagnosisType,
  SheepCategory,
  SheepStatus,
  BreedingCycleStatus,
  deliveryCheck,
  isOutsideEcoWindow,
  suggestedEcoWindow,
  suggestedRemateDate,
} from "@sheep/domain"
import { StatusBadge } from "@/components/ui/status-badge"
import { DataTable } from "@/components/ui/data-table"
import { Drawer } from "@/components/ui/drawer"
import { Field, TextInput, Textarea } from "@/components/ui/form-fields"
import type { ComboboxOption } from "@/components/ui/combobox"
import { MatingRegisterDrawer } from "@/components/mating-register-drawer"
import {
  MatingActivityFeed,
  matingPhaseSummary,
} from "@/components/mating-timeline"
import { diagnoseOptionsForPhase, isPostPregnancyFollowUp, matingActions } from "@/lib/mating-actions"
import {
  fetchMatingsBySheep,
  type ApiMating,
} from "@/lib/api/mating"
import {
  fetchPregnancyChecksByMating,
  recordDelivery,
  recordPregnancyCheck,
  type ApiPregnancyCheck,
  type PregnancyCheckCreatePayload,
} from "@/lib/api/pregnancy-check"
import {
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
import { formatDisplayDate, toDateInputValue } from "@/lib/format"
import { breedingResultBadgeColor, labelBreedingResult } from "@/lib/labels/breeding"
import { labelMatingStatus, matingStatusBadgeColor } from "@/lib/labels/mating"
import { labelCategory } from "@/lib/labels/sheep"
import { IconMating } from "@/lib/icons/analysis-medicine"
import { BeakerIcon, SunIcon, ClockIcon } from "@heroicons/react/24/outline"

const today = () => new Date().toISOString().split("T")[0]

type EcoResult = "Preñada" | "Vacía" | "Revisar"

type MatingRow = ApiMating & { checks: ApiPregnancyCheck[] }

type MontasTableRow =
  | { kind: "planned"; cycle: ApiBreedingCycle }
  | { kind: "mating"; row: MatingRow }

function sortMontasRows(items: MontasTableRow[]): MontasTableRow[] {
  return [...items].sort((a, b) => {
    const aPending = a.kind === "planned" ? 0 : 1
    const bPending = b.kind === "planned" ? 0 : 1
    if (aPending !== bPending) return aPending - bPending
    const aDate = a.kind === "planned" ? a.cycle.matingDate : a.row.matingDate
    const bDate = b.kind === "planned" ? b.cycle.matingDate : b.row.matingDate
    return bDate.localeCompare(aDate)
  })
}

function formatSheepLabel(
  s: { tag: string; name?: string | null } | null | undefined,
  id: string,
): string {
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
  const sheepLabel = sheep.name ? `${sheep.tag} · ${sheep.name}` : sheep.tag

  const [rows, setRows] = useState<MatingRow[]>([])
  const [cycles, setCycles] = useState<ApiBreedingCycle[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [partners, setPartners] = useState<ApiSheep[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [registerOpen, setRegisterOpen] = useState(false)
  const [plannedTarget, setPlannedTarget] = useState<ApiBreedingCycle | null>(null)

  const [ecoFor, setEcoFor] = useState<MatingRow | null>(null)
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

  const plannedCycles = useMemo(
    () =>
      isFemale
        ? cycles.filter(
            (c) =>
              c.status !== BreedingCycleStatus.CANCELLED &&
              !c.actualBirthDate &&
              !c.matingId,
          )
        : [],
    [cycles, isFemale],
  )

  const tableRows = useMemo(
    () =>
      sortMontasRows([
        ...plannedCycles.map((cycle) => ({ kind: "planned" as const, cycle })),
        ...rows.map((row) => ({ kind: "mating" as const, row })),
      ]),
    [plannedCycles, rows],
  )

  function cyclePartnerDisplay(cycle: ApiBreedingCycle): string {
    if (!isFemale) return sheepLabel
    if (!cycle.ramId) return "—"
    return formatSheepLabel(cycle.ram, cycle.ramId)
  }

  const ecoOutsideWindow = useMemo(() => {
    if (!ecoFor || !checkDate) return false
    return isOutsideEcoWindow(checkDate, ecoFor.matingDate, reproParams)
  }, [checkDate, ecoFor, reproParams])

  function partnerOf(row: MatingRow) {
    return isFemale ? row.maleId : row.femaleId
  }

  function partnerDisplay(row: MatingRow) {
    const s = isFemale ? row.male : row.female
    return formatSheepLabel(s, partnerOf(row))
  }

  function partoDate(row: MatingRow): string | null {
    const d = deliveryCheck(row.checks)
    return d ? toDateInputValue(String(d.checkDate)) : null
  }

  async function confirmCycleMating(cycle: ApiBreedingCycle) {
    setPlannedTarget(cycle)
    setRegisterOpen(true)
  }

  function openNewMating() {
    setPlannedTarget(null)
    setRegisterOpen(true)
  }

  function closeMatingDrawer() {
    setRegisterOpen(false)
    setPlannedTarget(null)
  }

  function openEco(row: MatingRow) {
    const { phase } = matingActions(row.checks)
    const options = diagnoseOptionsForPhase(phase, row.checks)
    const window = suggestedEcoWindow(row.matingDate, reproParams)
    const defaultDate =
      today() >= window.min && today() <= window.max ? today() : window.min
    const followUp = isPostPregnancyFollowUp(row.checks)
    setEcoFor(row)
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
        checkType: DiagnosisType.ECO,
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

  const inLactancia = isFemale && sheep.category === SheepCategory.OVEJA_LACTANCIA
  const isPregnantEwe =
    isFemale &&
    (sheep.isPregnant ||
      sheep.category === SheepCategory.OVEJA_PRENADA ||
      sheep.category === SheepCategory.BORREGA_PRENADA)

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900">
          <IconMating className="h-5 w-5 text-gray-400" aria-hidden="true" />
          Montas
        </h3>
        <button
          type="button"
          onClick={openNewMating}
          className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          <IconMating className="h-4 w-4" aria-hidden="true" />
          Registrar monta
        </button>
      </div>
      <p className="mt-1 text-sm text-gray-500">
        Montas y diagnósticos de preñez (ECO).
        {plannedCycles.length > 0 ? ` ${plannedCycles.length} programada(s).` : ""}
      </p>

      {inLactancia && (
        <div className="mt-3 rounded-md bg-pink-50 px-3 py-2 text-sm font-medium text-pink-700">
          Oveja en lactancia — no apta para monta hasta destete.
        </div>
      )}
      {isPregnantEwe && (
        <div className="mt-3 rounded-md bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700">
          Oveja preñada — monta bloqueada hasta el parto.
          {sheep.pregnancyConfirmedAt &&
            ` Confirmada ${formatDisplayDate(sheep.pregnancyConfirmedAt)}.`}
        </div>
      )}

      {success && (
        <div className="mt-3 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          {success}
        </div>
      )}

      {loadError && (
        <div className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {loadError}
          <button type="button" onClick={load} className="ml-2 font-semibold underline">
            Reintentar
          </button>
        </div>
      )}

      <div className="mt-4">
        <DataTable
          bare
          hideFooter
          rows={tableRows}
          rowKey={(item) => (item.kind === "planned" ? `cycle-${item.cycle.id}` : item.row.id)}
          loading={loading}
          loadingText="Cargando montas…"
          empty={<p className="text-sm text-gray-500">Sin montas registradas.</p>}
          expand={{
            isExpanded: (item) => item.kind === "mating" && expandedId === item.row.id,
            render: (item) => {
              if (item.kind !== "mating") return null
              const m = item.row
              return (
                <>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Historial
                  </p>
                  <MatingActivityFeed
                    checks={m.checks}
                    mating={{ matingDate: m.matingDate, partnerLabel: partnerDisplay(m) }}
                  />
                </>
              )
            },
          }}
          columns={[
            {
              key: "date",
              header: "Fecha",
              className: "whitespace-nowrap",
              cell: (item) => {
                const date =
                  item.kind === "planned" ? item.cycle.matingDate : item.row.matingDate
                const upcoming =
                  item.kind === "planned" &&
                  toDateInputValue(item.cycle.matingDate) > today()
                return (
                  <>
                    <div className="font-medium text-gray-900">{formatDisplayDate(date)}</div>
                    {item.kind === "planned" && (
                      <div className="mt-1 text-xs text-gray-400">Programada</div>
                    )}
                    {upcoming && <div className="mt-1 text-xs text-gray-400">Próxima</div>}
                  </>
                )
              },
            },
            {
              key: "partner",
              header: "Pareja",
              className: "whitespace-nowrap",
              cell: (item) =>
                item.kind === "planned"
                  ? cyclePartnerDisplay(item.cycle)
                  : partnerDisplay(item.row),
            },
            {
              key: "cycle",
              header: "Ciclo",
              className: "whitespace-nowrap text-gray-500",
              cell: (item) =>
                item.kind === "planned" ? item.cycle.cycleName : "—",
            },
            {
              key: "status",
              header: "Estado",
              className: "whitespace-nowrap",
              cell: (item) => {
                if (item.kind === "planned") {
                  return <StatusBadge color="yellow">Programada</StatusBadge>
                }
                const m = item.row
                const phaseInfo = matingPhaseSummary(m.checks)
                return (
                  <div className="flex flex-col gap-1">
                    <StatusBadge color={phaseInfo.color}>{phaseInfo.label}</StatusBadge>
                    <StatusBadge color={matingStatusBadgeColor(m.status)}>
                      {labelMatingStatus(m.status)}
                    </StatusBadge>
                  </div>
                )
              },
            },
            {
              key: "diagnosis",
              header: "Diagnóstico",
              className: "align-top",
              cell: (item) => {
                if (item.kind === "planned") {
                  const c = item.cycle
                  return (
                    <div className="flex max-w-xs flex-col gap-1">
                      <StatusBadge color={breedingResultBadgeColor(c.result)}>
                        {labelBreedingResult(c.result)}
                      </StatusBadge>
                      {c.notes ? (
                        <p className="text-xs text-gray-500">{c.notes}</p>
                      ) : (
                        <p className="text-xs text-gray-400">Desde planificador</p>
                      )}
                    </div>
                  )
                }
                const m = item.row
                const phaseInfo = matingPhaseSummary(m.checks)
                const actions = matingActions(m.checks)
                const birth = partoDate(m)
                const ecoWindow = suggestedEcoWindow(m.matingDate, reproParams)
                return (
                  <div className="flex max-w-xs flex-col gap-1.5">
                    {phaseInfo.detail && (
                      <p className="text-sm font-medium text-gray-700">{phaseInfo.detail}</p>
                    )}
                    {actions.phase === "awaiting_diagnosis" && (
                      <p className="text-xs text-indigo-700">
                        ECO sugerido: {formatDisplayDate(ecoWindow.min)} –{" "}
                        {formatDisplayDate(ecoWindow.max)}
                      </p>
                    )}
                    {m.expectedBirthDate && actions.phase === "pregnant" && !birth && (
                      <p className="text-xs text-gray-500">
                        Parto esperado: {formatDisplayDate(m.expectedBirthDate)}
                      </p>
                    )}
                    {birth && (
                      <p className="text-xs text-gray-500">Parto: {formatDisplayDate(birth)}</p>
                    )}
                    {actions.phase === "empty" && (
                      <p className="text-xs text-amber-700">
                        Aplicar Vitasel y registrar nueva monta (~{reproParams.heatCycleDays} días)
                      </p>
                    )}
                    {!phaseInfo.detail && !birth && actions.phase === "awaiting_diagnosis" && (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </div>
                )
              },
            },
            {
              key: "actions",
              header: "",
              align: "right",
              className: "whitespace-nowrap",
              cell: (item) => {
                if (item.kind === "planned") {
                  return (
                    <button
                      type="button"
                      onClick={() => confirmCycleMating(item.cycle)}
                      className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-indigo-600"
                      title="Registrar monta"
                      aria-label="Registrar monta"
                    >
                      <IconMating className="h-5 w-5" aria-hidden="true" />
                    </button>
                  )
                }
                const m = item.row
                const actions = matingActions(m.checks)
                const isExpanded = expandedId === m.id
                return (
                  <div className="flex flex-wrap items-center justify-end gap-1">
                    {actions.canDiagnose && (
                      <button
                        type="button"
                        onClick={() => openEco(m)}
                        title="Diagnóstico"
                        aria-label="Diagnóstico"
                        className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-indigo-600"
                      >
                        <BeakerIcon className="size-5" aria-hidden="true" />
                      </button>
                    )}
                    {actions.canDeliver && (
                      <button
                        type="button"
                        onClick={() => openParto(m)}
                        title="Registrar parto"
                        aria-label="Registrar parto"
                        className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-indigo-600"
                      >
                        <SunIcon className="size-5" aria-hidden="true" />
                      </button>
                    )}
                    {m.checks.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : m.id)}
                        title={isExpanded ? "Ocultar historial" : "Ver historial"}
                        aria-label={isExpanded ? "Ocultar historial" : "Ver historial"}
                        aria-expanded={isExpanded}
                        className="inline-flex items-center gap-1 rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-indigo-600"
                      >
                        <ClockIcon className="size-5" aria-hidden="true" />
                        <span className="text-xs font-medium">{m.checks.length}</span>
                      </button>
                    )}
                    {!actions.canDiagnose && !actions.canDeliver && m.checks.length === 0 && (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </div>
                )
              },
            },
          ]}
        />
      </div>

      <MatingRegisterDrawer
        open={registerOpen}
        onClose={closeMatingDrawer}
        sheepId={sheepId}
        sheepLabel={sheepLabel}
        isFemale={isFemale}
        partnerLabel={partnerLabel}
        partnerOptions={partnerOptions}
        blockReason={registerBlockReason}
        plannedCycle={plannedTarget}
        onSaved={async (message) => {
          setSuccess(message)
          await load()
          await onUpdated?.()
        }}
      />

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
              Preñez confirmada. <strong>Revisar</strong> programa un control ECO de gestación sin cambiar el
              estado preñada. <strong>Vacía</strong> solo si hubo pérdida o el diagnóstico fue erróneo.
            </p>
          )}
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
