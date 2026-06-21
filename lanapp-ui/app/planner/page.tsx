"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { EmptyState } from "@/components/ui/empty-state"
import { DataTable } from "@/components/ui/data-table"
import { StatusBadge } from "@/components/ui/status-badge"
import { Drawer } from "@/components/ui/drawer"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import { Field, TextInput, Select, Textarea } from "@/components/ui/form-fields"
import { useSheepFilter } from "@/components/ui/sheep-filter"
import { BreedingDiagnosisDrawer } from "@/components/breeding-diagnosis-drawer"
import { MatingBatchConfirmDrawer } from "@/components/mating-batch-confirm-drawer"
import { fetchSheep } from "@/lib/api/sheep"
import { fetchLocations } from "@/lib/api/location"
import {
  bulkScheduleBreedingCycles,
  cancelBreedingCycle,
  fetchBreedingCycles,
  type ApiBreedingCycle,
} from "@/lib/api/breeding-cycle"
import type { ApiLocation, ApiSheep, BulkResult } from "@/lib/api/types"
import { BreedingCycleStatus, Gender, SheepCategory, SheepStatus } from "@sheep/domain"
import { labelCategory } from "@/lib/labels/sheep"
import {
  breedingResultBadgeColor,
  labelBreedingResult,
} from "@/lib/labels/breeding"
import { isEweBreedingEligible, isRamBreedingEligible } from "@/lib/breeding-eligibility"
import { formatDisplayDate } from "@/lib/format"
import {
  CalendarDaysIcon,
  UserGroupIcon,
  CheckIcon,
  HeartIcon,
  XMarkIcon,
  BeakerIcon,
  TrashIcon,
} from "@heroicons/react/24/outline"

const today = () => new Date().toISOString().split("T")[0]

function sheepLabel(s: { tag: string; name?: string | null }) {
  return `${s.tag}${s.name ? ` ${s.name}` : ""}`
}

export default function PlannerPage() {
  const [addOpen, setAddOpen] = useState(false)

  const [rows, setRows] = useState<ApiBreedingCycle[]>([])
  const [ewes, setEwes] = useState<ApiSheep[]>([])
  const [rams, setRams] = useState<ApiSheep[]>([])
  const [locations, setLocations] = useState<ApiLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [cycleFilter, setCycleFilter] = useState("")
  const [potreroFilter, setPotreroFilter] = useState("")

  const [diagFor, setDiagFor] = useState<ApiBreedingCycle | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmPreselect, setConfirmPreselect] = useState<string[]>([])
  const [toCancel, setToCancel] = useState<ApiBreedingCycle | null>(null)
  const [cancelling, setCancelling] = useState(false)

  const [bCycle, setBCycle] = useState("")
  const [bRam, setBRam] = useState("")
  const [bDate, setBDate] = useState(today())
  const [bVitasel, setBVitasel] = useState(false)
  const [bNotes, setBNotes] = useState("")
  const [bSelected, setBSelected] = useState<Set<string>>(new Set())
  const [bResult, setBResult] = useState<BulkResult | null>(null)
  const [bError, setBError] = useState<string | null>(null)
  const [bSaving, setBSaving] = useState(false)
  const [eligibleOnly, setEligibleOnly] = useState(true)

  const eligibleEwes = useMemo(() => ewes.filter(isEweBreedingEligible), [ewes])
  const eligibleRams = useMemo(() => rams.filter(isRamBreedingEligible), [rams])

  const bulkSource = eligibleOnly ? eligibleEwes : ewes
  const { filtered: bulkVisible, controls: bulkFilterControls } = useSheepFilter(
    bulkSource,
    locations,
  )

  const eweById = useMemo(() => new Map(ewes.map((s) => [s.id, s])), [ewes])
  const ramById = useMemo(() => new Map(rams.map((s) => [s.id, s])), [rams])

  const ramOptions: ComboboxOption[] = useMemo(
    () =>
      eligibleRams.map((s) => ({
        value: s.id,
        label: s.tag,
        sublabel: s.name ?? labelCategory(s.category),
      })),
    [eligibleRams],
  )

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const [cycles, females, males, locs] = await Promise.all([
        fetchBreedingCycles({ limit: 500 }),
        fetchSheep({ gender: Gender.FEMALE, status: SheepStatus.ACTIVE, limit: 500 }),
        fetchSheep({ gender: Gender.MALE, status: SheepStatus.ACTIVE, category: SheepCategory.REPRODUCTOR, limit: 200 }),
        fetchLocations(200).catch(() => [] as ApiLocation[]),
      ])
      setRows(cycles.filter((c) => c.status === BreedingCycleStatus.ACTIVE))
      setEwes(females.items)
      setRams(males.items)
      setLocations(locs)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "No se pudieron cargar los ciclos")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const cycleNames = useMemo(
    () => Array.from(new Set(rows.map((r) => r.cycleName))).sort(),
    [rows],
  )

  /** Ewes that already have an active row for the cycle name in the add drawer. */
  const ewesAlreadyInCycle = useMemo(() => {
    const name = bCycle.trim()
    if (!name) return new Set<string>()
    return new Set(rows.filter((r) => r.cycleName === name).map((r) => r.eweId))
  }, [rows, bCycle])

  const visibleRows = useMemo(() => {
    return rows.filter((r) => {
      if (cycleFilter && r.cycleName !== cycleFilter) return false
      if (potreroFilter) {
        const ewe = eweById.get(r.eweId) ?? r.ewe
        const locId = ewe && "currentLocationId" in ewe ? ewe.currentLocationId : null
        if (locId !== potreroFilter) return false
      }
      return true
    })
  }, [rows, cycleFilter, potreroFilter, eweById])

  function displayEwe(row: ApiBreedingCycle) {
    const s = eweById.get(row.eweId) ?? row.ewe
    return s ? sheepLabel(s) : row.eweId
  }

  function displayRam(row: ApiBreedingCycle) {
    if (!row.ramId) return "—"
    const s = ramById.get(row.ramId) ?? row.ram
    return s ? sheepLabel(s) : row.ramId
  }

  function openAddDrawer(cycleName?: string) {
    setBCycle(cycleName ?? cycleFilter ?? "")
    setBRam("")
    setBDate(today())
    setBVitasel(false)
    setBNotes("")
    setBSelected(new Set())
    setBError(null)
    setBResult(null)
    setEligibleOnly(true)
    setAddOpen(true)
  }

  function openDiag(row: ApiBreedingCycle) {
    setDiagFor(row)
  }

  function openConfirmMating(row?: ApiBreedingCycle) {
    setConfirmPreselect(row ? [row.id] : [])
    setConfirmOpen(true)
  }

  function confirmMatingBlockReason(row: ApiBreedingCycle): string | null {
    if (row.matingId) return "Monta ya confirmada"
    if (!row.ramId) return "Asigna un reproductor antes de confirmar"
    return null
  }

  function cancelRow(row: ApiBreedingCycle) {
    if (row.result || row.diagnosisDate) {
      window.alert("Solo se puede cancelar un ciclo pendiente sin diagnóstico")
      return
    }
    setToCancel(row)
  }

  async function confirmCancel() {
    if (!toCancel) return
    setCancelling(true)
    try {
      await cancelBreedingCycle(toCancel.id)
      setToCancel(null)
      await load()
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "No se pudo cancelar el ciclo")
      setToCancel(null)
    } finally {
      setCancelling(false)
    }
  }

  const selectableBulk = useMemo(
    () => bulkVisible.filter((s) => !ewesAlreadyInCycle.has(s.id)),
    [bulkVisible, ewesAlreadyInCycle],
  )

  const bulkAllSelected =
    selectableBulk.length > 0 && selectableBulk.every((s) => bSelected.has(s.id))

  function toggleBulkAll() {
    setBSelected((prev) => {
      if (selectableBulk.every((s) => prev.has(s.id))) {
        const next = new Set(prev)
        selectableBulk.forEach((s) => next.delete(s.id))
        return next
      }
      const next = new Set(prev)
      selectableBulk.forEach((s) => next.add(s.id))
      return next
    })
  }

  function toggleBulkOne(id: string) {
    if (ewesAlreadyInCycle.has(id)) return
    setBSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function submitBulk(e: React.FormEvent) {
    e.preventDefault()
    setBError(null)
    setBResult(null)
    if (!bCycle.trim()) {
      setBError("Indica el nombre del ciclo (ej. 2026-A)")
      return
    }
    if (!bRam) {
      setBError("Selecciona un reproductor")
      return
    }
    if (!bDate) {
      setBError("Indica la fecha planificada")
      return
    }
    const eweIds = Array.from(bSelected)
    if (eweIds.length === 0) {
      setBError("Selecciona al menos una oveja")
      return
    }

    setBSaving(true)
    try {
      const res = await bulkScheduleBreedingCycles({
        cycleName: bCycle.trim(),
        ramId: bRam,
        matingDate: bDate,
        vitaselApplied: bVitasel,
        notes: bNotes.trim() || undefined,
        eweIds,
      })
      setBResult(res)
      const failedIds = new Set(res.failed.map((f) => f.sheepId))
      setBSelected(failedIds)
      await load()
      if (res.failed.length === 0) {
        setCycleFilter(bCycle.trim())
        setAddOpen(false)
      }
    } catch (err) {
      setBError(err instanceof Error ? err.message : "No se pudo programar el ciclo")
    } finally {
      setBSaving(false)
    }
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Planificador de montas"
        description="Ciclos reproductivos por temporada"
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openConfirmMating()}
              disabled={rows.filter((r) => !r.matingId && r.ramId).length === 0}
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
            >
              <HeartIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              Confirmar montas
            </button>
            <button
              type="button"
              onClick={() => openAddDrawer()}
              disabled={ewes.length === 0}
              className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
            >
              <UserGroupIcon className="h-5 w-5" aria-hidden="true" />
              Agregar ovejas al ciclo
            </button>
          </div>
        }
      />

      {loadError && (
        <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
          <button type="button" onClick={load} className="ml-2 font-semibold underline">
            Reintentar
          </button>
        </div>
      )}

      <section className="rounded-lg bg-white shadow">
          <div className="flex flex-col gap-3 border-b border-gray-200 p-4 sm:flex-row sm:items-end">
            <Field label="Ciclo" htmlFor="cycle-filter" className="sm:w-56">
              <Select
                id="cycle-filter"
                value={cycleFilter}
                onChange={(e) => setCycleFilter(e.target.value)}
              >
                <option value="">Todos los ciclos</option>
                {cycleNames.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Potrero" htmlFor="potrero-filter" className="sm:w-56">
              <Select
                id="potrero-filter"
                value={potreroFilter}
                onChange={(e) => setPotreroFilter(e.target.value)}
              >
                <option value="">Todos los potreros</option>
                {locations.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </Select>
            </Field>
            {(cycleFilter || potreroFilter) && (
              <button
                type="button"
                onClick={() => {
                  setCycleFilter("")
                  setPotreroFilter("")
                }}
                className="inline-flex h-fit items-center gap-1 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                <XMarkIcon className="h-4 w-4" aria-hidden="true" />
                Limpiar
              </button>
            )}
            {cycleFilter && (
              <button
                type="button"
                onClick={() => openAddDrawer(cycleFilter)}
                className="inline-flex h-fit items-center gap-1 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                <UserGroupIcon className="h-4 w-4" aria-hidden="true" />
                Agregar más a {cycleFilter}
              </button>
            )}
          </div>

          <DataTable
            bare
            rows={visibleRows}
            rowKey={(r) => r.id}
            loading={loading}
            loadingText="Cargando ciclos..."
            empty={
              <EmptyState
                icon={CalendarDaysIcon}
                title="Sin ciclos"
                description="Programa ovejas con Agregar al ciclo. Si olvidaste alguna, ábrelo de nuevo con el mismo nombre de ciclo."
                action={
                  <button
                    type="button"
                    onClick={() => openAddDrawer()}
                    className="mt-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                  >
                    Agregar al ciclo
                  </button>
                }
              />
            }
            columns={[
              { key: "ewe", header: "Oveja", className: "whitespace-nowrap font-medium text-gray-900", cell: (r) => displayEwe(r) },
              { key: "ram", header: "Reproductor", className: "whitespace-nowrap", cell: (r) => displayRam(r) },
              { key: "cycle", header: "Ciclo", className: "whitespace-nowrap", cell: (r) => r.cycleName },
              {
                key: "plannedDate",
                header: "Planificada",
                className: "whitespace-nowrap",
                cell: (r) => formatDisplayDate(r.matingDate),
              },
              {
                key: "confirmedDate",
                header: "Monta confirmada",
                className: "whitespace-nowrap",
                cell: (r) =>
                  r.confirmedMatingDate ? (
                    formatDisplayDate(r.confirmedMatingDate)
                  ) : (
                    <span className="text-gray-400">—</span>
                  ),
              },
              {
                key: "mating",
                header: "Monta",
                className: "whitespace-nowrap",
                cell: (r) =>
                  r.matingId ? (
                    <StatusBadge color="green">Registrada</StatusBadge>
                  ) : (
                    <StatusBadge color="yellow">Planificada</StatusBadge>
                  ),
              },
              {
                key: "result",
                header: "Resultado",
                className: "whitespace-nowrap",
                cell: (r) => (
                  <StatusBadge color={breedingResultBadgeColor(r.result)}>
                    {labelBreedingResult(r.result)}
                  </StatusBadge>
                ),
              },
              {
                key: "vitasel",
                header: "Vitasel",
                className: "whitespace-nowrap",
                cell: (r) =>
                  r.vitaselApplied ? (
                    <StatusBadge color="green">Sí</StatusBadge>
                  ) : (
                    <StatusBadge color="gray">No</StatusBadge>
                  ),
              },
              {
                key: "actions",
                header: "Acciones",
                className: "whitespace-nowrap",
                cell: (r) => (
                  <div className="flex flex-wrap items-center gap-2">
                    {!r.matingId && (
                      <button
                        type="button"
                        onClick={() => openConfirmMating(r)}
                        disabled={!!confirmMatingBlockReason(r)}
                        title={confirmMatingBlockReason(r) ?? "Confirmar monta"}
                        aria-label="Confirmar monta"
                        className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <HeartIcon className="size-5" aria-hidden="true" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => openDiag(r)}
                      title="Registrar diagnóstico"
                      aria-label="Registrar diagnóstico"
                      className="rounded-md p-1.5 text-indigo-600 hover:bg-indigo-50"
                    >
                      <BeakerIcon className="size-5" aria-hidden="true" />
                    </button>
                    {!r.result && !r.diagnosisDate && (
                      <button
                        type="button"
                        onClick={() => cancelRow(r)}
                        title="Descartar ciclo"
                        aria-label="Descartar ciclo"
                        className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <TrashIcon className="size-5" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                ),
              },
            ]}
          />
        </section>

      <Drawer
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Agregar al ciclo"
        description={`${bSelected.size} oveja(s) seleccionada(s). Mismo nombre de ciclo = agregar más ovejas (ej. si olvidaste una).`}
        footer={
          <>
            <button
              type="button"
              onClick={() => setAddOpen(false)}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="add-cycle-form"
              disabled={bSaving || bSelected.size === 0 || !bRam}
              className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {bSaving && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              )}
              <CheckIcon className="h-5 w-5" aria-hidden="true" />
              Agregar al ciclo ({bSelected.size})
            </button>
          </>
        }
      >
        <form id="add-cycle-form" onSubmit={submitBulk} className="flex flex-col gap-4">
          {bError && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{bError}</div>}
          {bResult && (
            <div
              className={`rounded-md px-3 py-2 text-sm ${
                bResult.failed.length === 0 ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-800"
              }`}
            >
              <p className="font-medium">{bResult.succeeded.length} ciclo(s) programado(s)</p>
              {bResult.failed.length > 0 && (
                <ul className="mt-1 list-disc pl-5">
                  {bResult.failed.map((f) => (
                    <li key={f.sheepId}>
                      {sheepLabel(eweById.get(f.sheepId) ?? { tag: f.sheepId })}: {f.error}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <Field label="Nombre del ciclo" required htmlFor="b-cycle">
            <TextInput
              id="b-cycle"
              value={bCycle}
              onChange={(e) => setBCycle(e.target.value)}
              placeholder="2026-A"
              list="cycle-names-add"
            />
            <datalist id="cycle-names-add">
              {cycleNames.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
          {bCycle.trim() && ewesAlreadyInCycle.size > 0 && (
            <p className="text-xs text-gray-500">
              {ewesAlreadyInCycle.size} oveja(s) ya en ciclo <strong>{bCycle.trim()}</strong>.
            </p>
          )}
          <Field label="Reproductor" required htmlFor="b-ram">
            <Combobox
              id="b-ram"
              options={ramOptions}
              value={bRam}
              onChange={setBRam}
              placeholder="Seleccionar reproductor"
              emptyMessage="Sin reproductores aptos"
            />
          </Field>
          <Field label="Fecha planificada" required htmlFor="b-date">
            <TextInput id="b-date" type="date" value={bDate} onChange={(e) => setBDate(e.target.value)} />
          </Field>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={bVitasel}
              onChange={(e) => setBVitasel(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
            />
            Aplicó Vitasel
          </label>
          <Field label="Notas" htmlFor="b-notes">
            <Textarea id="b-notes" rows={2} value={bNotes} onChange={(e) => setBNotes(e.target.value)} />
          </Field>
          <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
            <label className="mb-2 flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={eligibleOnly}
                onChange={(e) => setEligibleOnly(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
              />
              Solo aptas para monta
            </label>
            {bulkFilterControls}
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">Ovejas</p>
              <button
                type="button"
                onClick={toggleBulkAll}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-500"
              >
                {bulkAllSelected ? "Quitar todas" : "Seleccionar todas"}
              </button>
            </div>
            <div className="max-h-72 divide-y divide-gray-100 overflow-y-auto rounded-md border border-gray-200">
              {bulkVisible.length === 0 ? (
                <p className="px-3 py-4 text-center text-sm text-gray-500">Sin ovejas para este filtro</p>
              ) : (
                bulkVisible.map((s) => {
                  const alreadyIn = ewesAlreadyInCycle.has(s.id)
                  return (
                    <label
                      key={s.id}
                      className={`flex items-center gap-3 px-3 py-2 ${
                        alreadyIn ? "cursor-not-allowed bg-gray-50 opacity-60" : "cursor-pointer hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={bSelected.has(s.id)}
                        disabled={alreadyIn}
                        onChange={() => toggleBulkOne(s.id)}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 disabled:opacity-50"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-gray-900">
                          {s.tag} {s.name ?? ""}
                          {alreadyIn && (
                            <span className="ml-2 text-xs font-normal text-gray-500">Ya en ciclo</span>
                          )}
                        </span>
                        <span className="block truncate text-xs text-gray-500">
                          {labelCategory(s.category)}
                          {s.currentLocation?.name ? ` · ${s.currentLocation.name}` : ""}
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

      <BreedingDiagnosisDrawer
        open={diagFor !== null}
        onClose={() => setDiagFor(null)}
        target={diagFor ? { kind: "cycle", cycle: diagFor, eweLabel: displayEwe(diagFor) } : null}
        onSaved={load}
      />

      <MatingBatchConfirmDrawer
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        cycles={rows}
        eweById={eweById}
        initialCycleFilter={cycleFilter}
        initialSelectedIds={confirmPreselect}
        onSaved={load}
      />

      <ConfirmDialog
        open={toCancel !== null}
        title="Cancelar ciclo"
        message={
          toCancel
            ? `¿Cancelar el ciclo "${toCancel.cycleName}"? El registro se conserva en el historial.`
            : ""
        }
        confirmLabel="Cancelar ciclo"
        loading={cancelling}
        onConfirm={confirmCancel}
        onClose={() => setToCancel(null)}
      />
    </DashboardLayout>
  )
}
