"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { EmptyState } from "@/components/ui/empty-state"
import { StatusBadge } from "@/components/ui/status-badge"
import { Modal } from "@/components/ui/modal"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import { Field, TextInput, Select, Textarea } from "@/components/ui/form-fields"
import {
  breedingData as seedBreeding,
  sheepData,
  sheepDisplay,
  ubicacionesData,
  statusColor,
  CATEGORIES,
  DIAGNOSIS_TYPES,
  BREEDING_RESULTS,
  type BreedingRecord,
} from "@/lib/mock-data"
import {
  CalendarDaysIcon,
  PlusIcon,
  UserGroupIcon,
  ArrowRightIcon,
  CheckIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline"

const today = () => new Date().toISOString().split("T")[0]

const females = sheepData.filter((s) => s.sexo === "Hembra")
const males = sheepData.filter((s) => s.sexo === "Macho")

const ramOptions: ComboboxOption[] = males.map((s) => ({
  value: s.id,
  label: s.arete,
  sublabel: s.nombre,
}))
const eweOptions: ComboboxOption[] = females.map((s) => ({
  value: s.id,
  label: s.arete,
  sublabel: s.nombre,
}))

export default function PlannerPage() {
  const [rows, setRows] = useState<BreedingRecord[]>(() => [...seedBreeding])

  // Section A filters.
  const [cycleFilter, setCycleFilter] = useState("")
  const [potreroFilter, setPotreroFilter] = useState("")

  // Nuevo ciclo modal.
  const [newOpen, setNewOpen] = useState(false)
  const [nEwe, setNEwe] = useState("")
  const [nCycle, setNCycle] = useState("")
  const [nRam, setNRam] = useState("")
  const [nDate, setNDate] = useState(today())
  const [nVitasel, setNVitasel] = useState(false)
  const [nNotes, setNNotes] = useState("")
  const [newError, setNewError] = useState<string | null>(null)

  // Diagnóstico modal.
  const [diagFor, setDiagFor] = useState<BreedingRecord | null>(null)
  const [dType, setDType] = useState<(typeof DIAGNOSIS_TYPES)[number]>("ECO")
  const [dDate, setDDate] = useState(today())
  const [dResult, setDResult] = useState<(typeof BREEDING_RESULTS)[number]>("Preñada")
  const [dNotes, setDNotes] = useState("")

  // Section B — bulk.
  const [bCycle, setBCycle] = useState("")
  const [bRam, setBRam] = useState("")
  const [bDate, setBDate] = useState(today())
  const [bVitasel, setBVitasel] = useState(false)
  const [bNotes, setBNotes] = useState("")
  const [bSearch, setBSearch] = useState("")
  const [bCategory, setBCategory] = useState("")
  const [bPotrero, setBPotrero] = useState("")
  const [bSelected, setBSelected] = useState<Set<string>>(new Set())
  const [bResult, setBResult] = useState<{ ok: number; skipped: string[] } | null>(null)
  const [bError, setBError] = useState<string | null>(null)

  const cycleNames = useMemo(
    () => Array.from(new Set(rows.map((r) => r.cycleName))).sort(),
    [rows],
  )

  function potreroOf(eweId: string) {
    return sheepData.find((s) => s.id === eweId)?.ubicacion ?? ""
  }

  const visibleRows = useMemo(() => {
    return rows.filter((r) => {
      if (cycleFilter && r.cycleName !== cycleFilter) return false
      if (potreroFilter) {
        const u = ubicacionesData.find((x) => x.id === potreroFilter)
        if (u && potreroOf(r.eweId) !== u.nombre) return false
      }
      return true
    })
  }, [rows, cycleFilter, potreroFilter])

  /* --------------------------- Nuevo ciclo --------------------------- */

  function openNew() {
    setNEwe("")
    setNCycle("")
    setNRam("")
    setNDate(today())
    setNVitasel(false)
    setNNotes("")
    setNewError(null)
    setNewOpen(true)
  }

  function saveNew(e: React.FormEvent) {
    e.preventDefault()
    if (!nEwe) {
      setNewError("Selecciona una oveja")
      return
    }
    if (!nCycle.trim()) {
      setNewError("Indica el nombre del ciclo (ej. 2026-A)")
      return
    }
    if (!nDate) {
      setNewError("Indica la fecha de monta")
      return
    }
    setRows((prev) => [
      {
        id: `b-${Date.now()}`,
        eweId: nEwe,
        ramId: nRam || undefined,
        cycleName: nCycle.trim(),
        matingDate: nDate,
        vitaselApplied: nVitasel,
        result: "Pendiente",
        notes: nNotes.trim() || undefined,
      },
      ...prev,
    ])
    setNewOpen(false)
  }

  /* ---------------------------- Diagnóstico --------------------------- */

  function openDiag(row: BreedingRecord) {
    setDiagFor(row)
    setDType("ECO")
    setDDate(today())
    setDResult("Preñada")
    setDNotes("")
  }

  function saveDiag(e: React.FormEvent) {
    e.preventDefault()
    if (!diagFor || !dDate) return
    setRows((prev) =>
      prev.map((r) =>
        r.id === diagFor.id
          ? {
              ...r,
              result: dResult,
              diagnosisType: dType,
              diagnosisDate: dDate,
              notes: dNotes.trim() || r.notes,
            }
          : r,
      ),
    )
    setDiagFor(null)
  }

  function deleteRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id))
  }

  /* ------------------------------- Bulk ------------------------------- */

  const bulkVisible = useMemo(() => {
    const q = bSearch.trim().toLowerCase()
    return females.filter((s) => {
      if (q && !(s.arete.toLowerCase().includes(q) || s.nombre.toLowerCase().includes(q))) return false
      if (bCategory && s.categoria !== bCategory) return false
      if (bPotrero) {
        const u = ubicacionesData.find((x) => x.id === bPotrero)
        if (u && s.ubicacion !== u.nombre) return false
      }
      return true
    })
  }, [bSearch, bCategory, bPotrero])

  const bulkAllSelected = bulkVisible.length > 0 && bulkVisible.every((s) => bSelected.has(s.id))

  function toggleBulkAll() {
    setBSelected((prev) => {
      if (bulkVisible.every((s) => prev.has(s.id))) {
        const next = new Set(prev)
        bulkVisible.forEach((s) => next.delete(s.id))
        return next
      }
      const next = new Set(prev)
      bulkVisible.forEach((s) => next.add(s.id))
      return next
    })
  }

  function toggleBulkOne(id: string) {
    setBSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function submitBulk(e: React.FormEvent) {
    e.preventDefault()
    setBError(null)
    setBResult(null)
    if (!bCycle.trim()) {
      setBError("Indica el nombre del ciclo (ej. 2026-B)")
      return
    }
    if (!bDate) {
      setBError("Indica la fecha de monta")
      return
    }
    const ids = Array.from(bSelected)
    if (ids.length === 0) {
      setBError("Selecciona al menos una oveja")
      return
    }

    // Mock: simulate one failure (e.g. an already-pregnant ewe) for demo realism.
    const skipped: string[] = []
    const created: BreedingRecord[] = []
    ids.forEach((id) => {
      const ewe = sheepData.find((s) => s.id === id)
      if (ewe && ewe.categoria === "Oveja preñada") {
        skipped.push(`${sheepDisplay(id)}: ya preñada, ciclo omitido`)
        return
      }
      created.push({
        id: `b-${Date.now()}-${id}`,
        eweId: id,
        ramId: bRam || undefined,
        cycleName: bCycle.trim(),
        matingDate: bDate,
        vitaselApplied: bVitasel,
        result: "Pendiente",
        notes: bNotes.trim() || undefined,
      })
    })

    setRows((prev) => [...created, ...prev])
    setBResult({ ok: created.length, skipped })
    // Keep only skipped ewes selected so the user can review them.
    const skippedIds = new Set(
      ids.filter((id) => sheepData.find((s) => s.id === id)?.categoria === "Oveja preñada"),
    )
    setBSelected(skippedIds)
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Planificador de montas"
        description="Ciclos reproductivos por temporada"
        action={
          <div className="flex items-center gap-2">
            <Link
              href="/weaning"
              className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Ver alertas de destete
              <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
            </Link>
            <button
              onClick={openNew}
              className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
            >
              <PlusIcon className="h-5 w-5" aria-hidden="true" />
              Nuevo ciclo
            </button>
          </div>
        }
      />

      {/* Section A — ciclos */}
      <section className="rounded-lg bg-white shadow">
        <div className="flex flex-col gap-3 border-b border-gray-200 p-4 sm:flex-row sm:items-end">
          <Field label="Nombre del ciclo" htmlFor="cycle-filter" className="sm:w-56">
            <TextInput
              id="cycle-filter"
              value={cycleFilter}
              onChange={(e) => setCycleFilter(e.target.value)}
              placeholder="Ej. 2026-A"
              list="cycle-names"
            />
            <datalist id="cycle-names">
              {cycleNames.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
          <Field label="Potrero" htmlFor="potrero-filter" className="sm:w-56">
            <Select
              id="potrero-filter"
              value={potreroFilter}
              onChange={(e) => setPotreroFilter(e.target.value)}
            >
              <option value="">Todos los potreros</option>
              {ubicacionesData.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre}
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
        </div>

        {visibleRows.length === 0 ? (
          <EmptyState
            icon={CalendarDaysIcon}
            title="Sin ciclos"
            description="No hay ciclos para este filtro. Crea uno con “Nuevo ciclo”."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {["Oveja", "Carnero", "Ciclo", "Fecha monta", "Resultado", "Vitasel", "Acciones"].map((h) => (
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
                {visibleRows.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                      {sheepDisplay(r.eweId)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                      {r.ramId ? sheepDisplay(r.ramId) : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{r.cycleName}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{r.matingDate}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <StatusBadge color={statusColor[r.result]}>{r.result}</StatusBadge>
                      {r.diagnosisType && r.diagnosisDate && (
                        <span className="ml-2 text-xs text-gray-400">
                          {r.diagnosisType} · {r.diagnosisDate}
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      {r.vitaselApplied ? (
                        <StatusBadge color="green">Sí</StatusBadge>
                      ) : (
                        <StatusBadge color="gray">No</StatusBadge>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openDiag(r)}
                          className="text-xs font-medium text-indigo-600 hover:underline"
                        >
                          Diagnóstico
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteRow(r.id)}
                          className="text-xs font-medium text-red-700 hover:underline"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Section B — bulk */}
      <section className="mt-6 rounded-lg bg-white shadow">
        <div className="flex items-center gap-2 border-b border-gray-200 p-4">
          <UserGroupIcon className="h-5 w-5 text-indigo-600" aria-hidden="true" />
          <h2 className="text-base font-semibold text-gray-900">Programar ciclo en lote</h2>
        </div>

        <form onSubmit={submitBulk} className="grid grid-cols-1 gap-6 p-4 lg:grid-cols-3">
          {/* Config */}
          <div className="flex flex-col gap-4 lg:col-span-1">
            {bError && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{bError}</div>}
            {bResult && (
              <div
                className={`rounded-md px-3 py-2 text-sm ${
                  bResult.skipped.length === 0 ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-800"
                }`}
              >
                <p className="font-medium">{bResult.ok} ciclo(s) programado(s)</p>
                {bResult.skipped.length > 0 && (
                  <ul className="mt-1 list-disc pl-5">
                    {bResult.skipped.map((s) => (
                      <li key={s}>{s}</li>
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
                placeholder="2026-B"
              />
            </Field>
            <Field label="Carnero (opcional)" htmlFor="b-ram">
              <Combobox
                id="b-ram"
                options={ramOptions}
                value={bRam}
                onChange={setBRam}
                placeholder="Seleccionar carnero"
                emptyMessage="Sin carneros"
              />
            </Field>
            <Field label="Fecha de monta" required htmlFor="b-date">
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
              <TextInput id="b-notes" value={bNotes} onChange={(e) => setBNotes(e.target.value)} />
            </Field>
            <button
              type="submit"
              disabled={bSelected.size === 0}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              <CheckIcon className="h-5 w-5" aria-hidden="true" />
              Programar ciclo ({bSelected.size})
            </button>
          </div>

          {/* Ewe picker */}
          <div className="lg:col-span-2">
            <div className="mb-3 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <MagnifyingGlassIcon
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                  aria-hidden="true"
                />
                <TextInput
                  value={bSearch}
                  onChange={(e) => setBSearch(e.target.value)}
                  placeholder="Buscar por arete o nombre"
                  aria-label="Buscar oveja"
                  className="pl-9"
                />
              </div>
              <Select
                value={bCategory}
                onChange={(e) => setBCategory(e.target.value)}
                aria-label="Filtrar por categoría"
                className="sm:w-48"
              >
                <option value="">Todas las categorías</option>
                {CATEGORIES.filter((c) => females.some((f) => f.categoria === c)).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
              <Select
                value={bPotrero}
                onChange={(e) => setBPotrero(e.target.value)}
                aria-label="Filtrar por potrero"
                className="sm:w-44"
              >
                <option value="">Todos los potreros</option>
                {ubicacionesData.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nombre}
                  </option>
                ))}
              </Select>
            </div>

            <div className="overflow-hidden rounded-md border border-gray-200">
              <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-3 py-2">
                <p className="text-sm text-gray-600">
                  {bulkVisible.length} oveja(s) · {bSelected.size} seleccionada(s)
                </p>
                <button
                  type="button"
                  onClick={toggleBulkAll}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-500"
                >
                  {bulkAllSelected ? "Quitar todas" : "Seleccionar todas"}
                </button>
              </div>
              <div className="max-h-80 divide-y divide-gray-100 overflow-y-auto">
                {bulkVisible.length === 0 ? (
                  <p className="px-3 py-6 text-center text-sm text-gray-500">Sin ovejas para este filtro</p>
                ) : (
                  bulkVisible.map((s) => (
                    <label
                      key={s.id}
                      className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={bSelected.has(s.id)}
                        onChange={() => toggleBulkOne(s.id)}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-gray-900">
                          {s.arete} {s.nombre}
                        </span>
                        <span className="block truncate text-xs text-gray-500">
                          {s.categoria} · {s.ubicacion}
                        </span>
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>
        </form>
      </section>

      {/* Nuevo ciclo modal */}
      <Modal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        title="Nuevo ciclo"
        description="Programa un ciclo para una sola oveja"
        footer={
          <>
            <button
              type="button"
              onClick={() => setNewOpen(false)}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="new-cycle-form"
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Guardar ciclo
            </button>
          </>
        }
      >
        <form id="new-cycle-form" onSubmit={saveNew} className="flex flex-col gap-4">
          {newError && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{newError}</div>}
          <Field label="Oveja" required htmlFor="n-ewe">
            <Combobox
              id="n-ewe"
              options={eweOptions}
              value={nEwe}
              onChange={setNEwe}
              placeholder="Seleccionar oveja"
              searchPlaceholder="Buscar por arete o nombre…"
            />
          </Field>
          <Field label="Nombre del ciclo" required htmlFor="n-cycle">
            <TextInput id="n-cycle" value={nCycle} onChange={(e) => setNCycle(e.target.value)} placeholder="2026-A" />
          </Field>
          <Field label="Carnero (opcional)" htmlFor="n-ram">
            <Combobox
              id="n-ram"
              options={ramOptions}
              value={nRam}
              onChange={setNRam}
              placeholder="Seleccionar carnero"
              emptyMessage="Sin carneros"
            />
          </Field>
          <Field label="Fecha de monta" required htmlFor="n-date">
            <TextInput id="n-date" type="date" value={nDate} onChange={(e) => setNDate(e.target.value)} />
          </Field>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={nVitasel}
              onChange={(e) => setNVitasel(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
            />
            Aplicó Vitasel
          </label>
          <Field label="Notas" htmlFor="n-notes">
            <Textarea id="n-notes" rows={2} value={nNotes} onChange={(e) => setNNotes(e.target.value)} />
          </Field>
        </form>
      </Modal>

      {/* Diagnóstico modal */}
      <Modal
        open={diagFor !== null}
        onClose={() => setDiagFor(null)}
        title="Registrar diagnóstico"
        description={diagFor ? `${sheepDisplay(diagFor.eweId)} · ciclo ${diagFor.cycleName}` : undefined}
        footer={
          <>
            <button
              type="button"
              onClick={() => setDiagFor(null)}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="diag-form"
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Guardar diagnóstico
            </button>
          </>
        }
      >
        <form id="diag-form" onSubmit={saveDiag} className="flex flex-col gap-4">
          <Field label="Tipo" required htmlFor="d-type">
            <Select id="d-type" value={dType} onChange={(e) => setDType(e.target.value as typeof dType)}>
              {DIAGNOSIS_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Fecha" required htmlFor="d-date">
            <TextInput id="d-date" type="date" value={dDate} onChange={(e) => setDDate(e.target.value)} />
          </Field>
          <Field label="Resultado" required htmlFor="d-result">
            <Select
              id="d-result"
              value={dResult}
              onChange={(e) => setDResult(e.target.value as typeof dResult)}
            >
              {(["Preñada", "Vacía", "Revisar"] as const).map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Notas" htmlFor="d-notes">
            <Textarea id="d-notes" rows={2} value={dNotes} onChange={(e) => setDNotes(e.target.value)} />
          </Field>
        </form>
      </Modal>
    </DashboardLayout>
  )
}
