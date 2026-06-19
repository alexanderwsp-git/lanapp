"use client"

import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { EmptyState } from "@/components/ui/empty-state"
import { StatusBadge } from "@/components/ui/status-badge"
import { DataTable } from "@/components/ui/data-table"
import { Field, TextInput, Select, Textarea } from "@/components/ui/form-fields"
import { Combobox } from "@/components/ui/combobox"
import { useSheepFilter } from "@/components/ui/sheep-filter"
import { Drawer } from "@/components/ui/drawer"
import {
  MedicineCreateSchema,
  MedicineStatus,
  MedicineType,
  MedicineApplicationCreateSchema,
  type MedicineCreate,
  type MedicineUpdate,
  type MedicineApplicationCreate,
} from "@sheep/domain"
import {
  bulkScheduleMedicineApplications,
  createMedicine,
  createMedicineApplication,
  deleteMedicine,
  deleteMedicineApplication,
  fetchMedicineApplications,
  fetchMedicines,
  markApplicationApplied,
  updateMedicine,
  updateMedicineApplicationStatus,
} from "@/lib/api/medicine"
import { fetchSheep } from "@/lib/api/sheep"
import { fetchLocations } from "@/lib/api/location"
import type { ApiLocation, ApiMedicine, ApiMedicineApplication, ApiSheep, BulkResult } from "@/lib/api/types"
import { labelCategory } from "@/lib/labels/sheep"
import { toDateInputValue, formatDisplayDate } from "@/lib/format"
import {
  labelMedicineStatus,
  labelMedicineType,
  medicineStatusColor,
  medicineTypeOptions,
} from "@/lib/labels/medicine"
import {
  PlusIcon,
  BeakerIcon,
  PencilSquareIcon,
  TrashIcon,
  ClipboardDocumentCheckIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline"

type MedForm = {
  type: MedicineType
  name: string
  dosage: string
  description: string
  notes: string
}

type ScheduleForm = {
  medicineId: string
  sheepId: string
  scheduledDate: string
  notes: string
}

type ApplyForm = {
  appliedDate: string
  scheduleNext: boolean
  nextScheduledDate: string
  notes: string
}

const today = () => new Date().toISOString().split("T")[0]

const emptyMedForm = (): MedForm => ({
  type: MedicineType.DEWORMER,
  name: "",
  dosage: "",
  description: "",
  notes: "",
})

const emptyScheduleForm = (): ScheduleForm => ({
  medicineId: "",
  sheepId: "",
  scheduledDate: today(),
  notes: "",
})

const HISTORY_STATUSES = new Set([
  MedicineStatus.APPLIED,
  MedicineStatus.CANCELLED,
  MedicineStatus.MISSED,
])

function isDue(app: ApiMedicineApplication): boolean {
  return (
    app.status === MedicineStatus.SCHEDULED &&
    toDateInputValue(app.applicationDate) <= today()
  )
}

export default function MedicinesPage() {
  const [tab, setTab] = useState<"meds" | "scheduled" | "history">("scheduled")
  const [scheduleFilter, setScheduleFilter] = useState<"due" | "all">("all")
  const [loadError, setLoadError] = useState<string | null>(null)

  const [meds, setMeds] = useState<ApiMedicine[]>([])
  const [apps, setApps] = useState<ApiMedicineApplication[]>([])
  const [sheep, setSheep] = useState<ApiSheep[]>([])
  const [loadingMeds, setLoadingMeds] = useState(true)
  const [loadingApps, setLoadingApps] = useState(true)

  const [medForm, setMedForm] = useState<MedForm>(emptyMedForm())
  const [medOpen, setMedOpen] = useState(false)
  const [editingMed, setEditingMed] = useState<ApiMedicine | null>(null)
  const [medToDelete, setMedToDelete] = useState<ApiMedicine | null>(null)
  const [savingMed, setSavingMed] = useState(false)
  const [deletingMed, setDeletingMed] = useState(false)
  const [medError, setMedError] = useState<string | null>(null)

  const [scheduleForm, setScheduleForm] = useState<ScheduleForm>(emptyScheduleForm())
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [savingSchedule, setSavingSchedule] = useState(false)
  const [scheduleError, setScheduleError] = useState<string | null>(null)

  const [locations, setLocations] = useState<ApiLocation[]>([])
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkMedicineId, setBulkMedicineId] = useState("")
  const [bulkDate, setBulkDate] = useState(today())
  const [bulkNotes, setBulkNotes] = useState("")
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set())
  const [savingBulk, setSavingBulk] = useState(false)
  const [bulkError, setBulkError] = useState<string | null>(null)
  const [bulkResult, setBulkResult] = useState<BulkResult | null>(null)

  const [applyTarget, setApplyTarget] = useState<ApiMedicineApplication | null>(null)
  const [applyForm, setApplyForm] = useState<ApplyForm>({
    appliedDate: today(),
    scheduleNext: false,
    nextScheduledDate: "",
    notes: "",
  })
  const [savingApply, setSavingApply] = useState(false)
  const [applyError, setApplyError] = useState<string | null>(null)

  const [appToDelete, setAppToDelete] = useState<ApiMedicineApplication | null>(null)
  const [deletingApp, setDeletingApp] = useState(false)
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null)

  const medById = useMemo(() => new Map(meds.map((m) => [m.id, m])), [meds])
  const sheepById = useMemo(() => new Map(sheep.map((s) => [s.id, s])), [sheep])

  const scheduledApps = useMemo(
    () => apps.filter((a) => a.status === MedicineStatus.SCHEDULED),
    [apps],
  )

  const dueApps = useMemo(() => scheduledApps.filter(isDue), [scheduledApps])

  const historyApps = useMemo(
    () => apps.filter((a) => HISTORY_STATUSES.has(a.status as MedicineStatus)),
    [apps],
  )

  const visibleScheduled = useMemo(() => {
    const list = scheduleFilter === "due" ? dueApps : scheduledApps
    return [...list].sort((a, b) => {
      const aDue = isDue(a) ? 0 : 1
      const bDue = isDue(b) ? 0 : 1
      if (aDue !== bDue) return aDue - bDue
      return toDateInputValue(a.applicationDate).localeCompare(toDateInputValue(b.applicationDate))
    })
  }, [scheduleFilter, dueApps, scheduledApps])

  const loadMeds = useCallback(async () => {
    setLoadingMeds(true)
    setLoadError(null)
    try {
      const result = await fetchMedicines(1, 200)
      setMeds(result.items)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "No se pudieron cargar los fármacos")
      setMeds([])
    } finally {
      setLoadingMeds(false)
    }
  }, [])

  const loadApps = useCallback(async () => {
    setLoadingApps(true)
    try {
      const result = await fetchMedicineApplications(1, 200)
      setApps(result.items)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "No se pudieron cargar las aplicaciones")
      setApps([])
    } finally {
      setLoadingApps(false)
    }
  }, [])

  const loadSheep = useCallback(async () => {
    try {
      const result = await fetchSheep({ page: 1, limit: 200 })
      setSheep(result.items)
    } catch {
      setSheep([])
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function loadAll() {
      setLoadingMeds(true)
      setLoadingApps(true)
      setLoadError(null)
      try {
        const [medsRes, appsRes, sheepRes, locsRes] = await Promise.all([
          fetchMedicines(1, 200),
          fetchMedicineApplications(1, 200),
          fetchSheep({ page: 1, limit: 200 }),
          fetchLocations(200).catch(() => [] as ApiLocation[]),
        ])
        if (cancelled) return
        setMeds(medsRes.items)
        setApps(appsRes.items)
        setSheep(sheepRes.items)
        setLocations(locsRes)
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : "No se pudieron cargar los datos")
          setMeds([])
          setApps([])
          setSheep([])
        }
      } finally {
        if (!cancelled) {
          setLoadingMeds(false)
          setLoadingApps(false)
        }
      }
    }
    loadAll()
    return () => {
      cancelled = true
    }
  }, [])

  const medicineOptions = useMemo(
    () => meds.map((m) => ({ value: m.id, label: m.name, sublabel: labelMedicineType(m.type) })),
    [meds],
  )

  const sheepOptions = useMemo(
    () =>
      sheep.map((s) => ({
        value: s.id,
        label: s.tag,
        sublabel: s.name ?? undefined,
      })),
    [sheep],
  )

  function medDisplayName(id: string) {
    return medById.get(id)?.name ?? id
  }

  function sheepDisplayTag(id: string) {
    const s = sheepById.get(id)
    return s ? (s.name ? `${s.tag} (${s.name})` : s.tag) : id
  }

  const { filtered: bulkVisibleSheep, controls: bulkFilterControls } = useSheepFilter(sheep, locations)

  const bulkAllSelected =
    bulkVisibleSheep.length > 0 && bulkVisibleSheep.every((s) => bulkSelected.has(s.id))

  function toggleBulkAll() {
    setBulkSelected((prev) => {
      if (bulkVisibleSheep.every((s) => prev.has(s.id))) {
        const next = new Set(prev)
        bulkVisibleSheep.forEach((s) => next.delete(s.id))
        return next
      }
      const next = new Set(prev)
      bulkVisibleSheep.forEach((s) => next.add(s.id))
      return next
    })
  }

  function toggleBulkOne(id: string) {
    setBulkSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function openNewMed() {
    setEditingMed(null)
    setMedForm(emptyMedForm())
    setMedError(null)
    setMedOpen(true)
  }

  function openEditMed(m: ApiMedicine) {
    setEditingMed(m)
    setMedForm({
      type: m.type,
      name: m.name,
      dosage: m.dosage,
      description: m.description ?? "",
      notes: m.notes ?? "",
    })
    setMedError(null)
    setMedOpen(true)
  }

  async function saveMed(e: React.FormEvent) {
    e.preventDefault()
    setMedError(null)
    const payload = {
      type: medForm.type,
      name: medForm.name.trim(),
      dosage: medForm.dosage.trim(),
      description: medForm.description.trim() || undefined,
      notes: medForm.notes.trim() || undefined,
    }

    const parsed = MedicineCreateSchema.safeParse(payload)
    if (!parsed.success) {
      setMedError(parsed.error.errors[0]?.message ?? "Datos inválidos")
      return
    }

    setSavingMed(true)
    try {
      if (editingMed) {
        await updateMedicine(editingMed.id, parsed.data as MedicineUpdate)
      } else {
        await createMedicine(parsed.data as MedicineCreate)
      }
      setMedOpen(false)
      await loadMeds()
    } catch (err) {
      setMedError(err instanceof Error ? err.message : "No se pudo guardar")
    } finally {
      setSavingMed(false)
    }
  }

  async function confirmDeleteMed() {
    if (!medToDelete) return
    setDeletingMed(true)
    try {
      await deleteMedicine(medToDelete.id)
      setMedToDelete(null)
      await loadMeds()
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "No se pudo eliminar")
      setMedToDelete(null)
    } finally {
      setDeletingMed(false)
    }
  }

  function openSchedule() {
    setScheduleForm(emptyScheduleForm())
    setScheduleError(null)
    setScheduleOpen(true)
  }

  async function saveSchedule(e: React.FormEvent) {
    e.preventDefault()
    setScheduleError(null)
    const payload = {
      medicineId: scheduleForm.medicineId,
      sheepId: scheduleForm.sheepId,
      applicationDate: scheduleForm.scheduledDate,
      status: MedicineStatus.SCHEDULED,
      notes: scheduleForm.notes.trim() || undefined,
    }

    const parsed = MedicineApplicationCreateSchema.safeParse(payload)
    if (!parsed.success) {
      setScheduleError(parsed.error.errors[0]?.message ?? "Datos inválidos")
      return
    }

    setSavingSchedule(true)
    try {
      await createMedicineApplication(parsed.data as MedicineApplicationCreate)
      setScheduleOpen(false)
      setTab("scheduled")
      await loadApps()
    } catch (err) {
      setScheduleError(err instanceof Error ? err.message : "No se pudo programar")
    } finally {
      setSavingSchedule(false)
    }
  }

  function openBulk() {
    setBulkMedicineId("")
    setBulkDate(today())
    setBulkNotes("")
    setBulkSelected(new Set())
    setBulkError(null)
    setBulkResult(null)
    setBulkOpen(true)
  }

  async function saveBulk(e: React.FormEvent) {
    e.preventDefault()
    setBulkError(null)
    setBulkResult(null)

    if (!bulkMedicineId) {
      setBulkError("Selecciona un medicamento")
      return
    }
    if (!bulkDate) {
      setBulkError("Indica la fecha de aplicación")
      return
    }
    const sheepIds = Array.from(bulkSelected)
    if (sheepIds.length === 0) {
      setBulkError("Selecciona al menos una oveja")
      return
    }

    setSavingBulk(true)
    try {
      const res = await bulkScheduleMedicineApplications({
        medicineId: bulkMedicineId,
        applicationDate: bulkDate,
        notes: bulkNotes.trim() || undefined,
        sheepIds,
      })
      setBulkResult(res)
      const succeededIds = new Set(res.succeeded.map((r) => r.sheepId))
      setBulkSelected((prev) => {
        const next = new Set(prev)
        succeededIds.forEach((id) => next.delete(id))
        return next
      })
      await loadApps()
      if (res.failed.length === 0) {
        setBulkOpen(false)
        setTab("scheduled")
      }
    } catch (err) {
      setBulkError(err instanceof Error ? err.message : "No se pudo programar en lote")
    } finally {
      setSavingBulk(false)
    }
  }

  function openApply(app: ApiMedicineApplication) {
    const scheduled = toDateInputValue(app.applicationDate)
    setApplyTarget(app)
    setApplyForm({
      appliedDate: scheduled <= today() ? today() : scheduled,
      scheduleNext: false,
      nextScheduledDate: "",
      notes: app.notes ?? "",
    })
    setApplyError(null)
  }

  async function confirmApply(e: React.FormEvent) {
    e.preventDefault()
    if (!applyTarget) return
    setApplyError(null)

    if (applyForm.scheduleNext && !applyForm.nextScheduledDate) {
      setApplyError("Indica la fecha de la próxima dosis")
      return
    }

    setSavingApply(true)
    try {
      await markApplicationApplied(applyTarget, {
        appliedDate: applyForm.appliedDate,
        nextScheduledDate: applyForm.scheduleNext ? applyForm.nextScheduledDate : undefined,
        notes: applyForm.notes,
      })
      setApplyTarget(null)
      await loadApps()
    } catch (err) {
      setApplyError(err instanceof Error ? err.message : "No se pudo registrar la aplicación")
    } finally {
      setSavingApply(false)
    }
  }

  async function setAppStatus(app: ApiMedicineApplication, status: MedicineStatus) {
    setStatusUpdating(app.id)
    try {
      await updateMedicineApplicationStatus(app.id, status)
      await loadApps()
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "No se pudo actualizar el estado")
    } finally {
      setStatusUpdating(null)
    }
  }

  async function confirmDeleteApp() {
    if (!appToDelete) return
    setDeletingApp(true)
    try {
      await deleteMedicineApplication(appToDelete.id)
      setAppToDelete(null)
      await loadApps()
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "No se pudo eliminar")
      setAppToDelete(null)
    } finally {
      setDeletingApp(false)
    }
  }

  function renderAppTable(
    rows: ApiMedicineApplication[],
    mode: "scheduled" | "history",
    opts: { loading: boolean; empty: ReactNode; loadingText?: string },
  ) {
    return (
      <DataTable
        rows={rows}
        rowKey={(a) => a.id}
        loading={opts.loading}
        loadingText={opts.loadingText ?? "Cargando..."}
        empty={opts.empty}
        rowClassName={(a) => (isDue(a) ? "bg-amber-50/60" : undefined)}
        columns={[
          {
            key: "medicine",
            header: "Medicamento",
            className: "whitespace-nowrap font-medium text-gray-900",
            cell: (a) => (
              <div className="flex items-center gap-2">
                <BeakerIcon className="size-4 shrink-0 text-gray-400" aria-hidden="true" />
                {a.medicine?.name ?? medDisplayName(a.medicineId)}
              </div>
            ),
          },
          {
            key: "sheep",
            header: "Oveja",
            className: "whitespace-nowrap",
            cell: (a) => (
              <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                {a.sheep?.tag ?? sheepDisplayTag(a.sheepId)}
              </span>
            ),
          },
          {
            key: "date",
            header: "Fecha",
            className: "whitespace-nowrap",
            cell: (a) => {
              const due = isDue(a)
              return (
                <>
                  <div className="font-medium text-gray-900">{formatDisplayDate(a.applicationDate)}</div>
                  {mode === "scheduled" && due ? (
                    <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                      <ClockIcon className="size-3.5" aria-hidden="true" />
                      Vence hoy
                    </span>
                  ) : mode === "scheduled" && toDateInputValue(a.applicationDate) > today() ? (
                    <span className="mt-1 inline-block text-xs text-gray-400">Próxima</span>
                  ) : null}
                </>
              )
            },
          },
          {
            key: "status",
            header: "Estado",
            className: "whitespace-nowrap",
            cell: (a) => {
              const statusLabel = labelMedicineStatus(a.status)
              return (
                <StatusBadge
                  color={medicineStatusColor[mode === "scheduled" ? "Programado" : statusLabel] ?? "gray"}
                >
                  {mode === "scheduled" ? "Programado" : statusLabel}
                </StatusBadge>
              )
            },
          },
          {
            key: "notes",
            header: "Notas",
            className: "max-w-[12rem] truncate text-gray-500",
            cell: (a) => (
              <span title={a.notes ?? undefined}>{a.notes || "—"}</span>
            ),
          },
          {
            key: "actions",
            header: "",
            align: "right",
            className: "whitespace-nowrap",
            cell: (a) => (
              <div className="flex items-center justify-end gap-1">
                {mode === "scheduled" && (
                  <>
                    <button
                      type="button"
                      disabled={statusUpdating === a.id}
                      onClick={() => openApply(a)}
                      className="inline-flex items-center gap-1 rounded-md bg-green-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-green-500 disabled:opacity-50"
                    >
                      <CheckIcon className="h-4 w-4" />
                      Aplicado
                    </button>
                    <button
                      type="button"
                      disabled={statusUpdating === a.id}
                      onClick={() => setAppStatus(a, MedicineStatus.CANCELLED)}
                      className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
                      title="Cancelar"
                      aria-label="Cancelar"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </>
                )}
                <button
                  onClick={() => setAppToDelete(a)}
                  className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  aria-label="Eliminar"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            ),
          },
        ]}
      />
    )
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Medicamentos"
        description="Fármacos, programación y registro de aplicaciones"
        action={
          tab === "meds" ? (
            <button
              onClick={openNewMed}
              className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
            >
              <PlusIcon className="h-5 w-5" aria-hidden="true" />
              Nuevo medicamento
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={openBulk}
                disabled={meds.length === 0 || sheep.length === 0}
                className="inline-flex items-center gap-2 rounded-md border border-indigo-600 px-4 py-2 text-sm font-semibold text-indigo-600 shadow-sm hover:bg-indigo-50 disabled:opacity-50"
              >
                <UserGroupIcon className="h-5 w-5" aria-hidden="true" />
                Programar en lote
              </button>
              <button
                onClick={openSchedule}
                disabled={meds.length === 0 || sheep.length === 0}
                className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
              >
                <PlusIcon className="h-5 w-5" aria-hidden="true" />
                Programar aplicación
              </button>
            </div>
          )
        }
      />

      {loadError && (
        <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
          <button
            type="button"
            onClick={() => {
              loadMeds()
              loadApps()
            }}
            className="ml-2 font-semibold underline"
          >
            Reintentar
          </button>
        </div>
      )}

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex flex-wrap gap-x-6 gap-y-1" aria-label="Pestañas">
          {[
            { id: "meds" as const, label: "Fármacos" },
            { id: "scheduled" as const, label: "Programadas" },
            { id: "history" as const, label: "Historial" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium ${
                tab === t.id
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
            >
              {t.label}
              <span
                className={`ml-1.5 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 ${
                  t.id !== "scheduled" || dueApps.length === 0 ? "hidden" : ""
                }`}
                aria-hidden={t.id !== "scheduled" || dueApps.length === 0}
              >
                {dueApps.length}
              </span>
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-6">
        <div className={tab === "meds" ? undefined : "hidden"}>
          <DataTable
            rows={meds}
            rowKey={(m) => m.id}
            loading={loadingMeds}
            loadingText="Cargando fármacos..."
            empty={
              <EmptyState
                icon={BeakerIcon}
                title="Sin medicamentos"
                description="Agrega fármacos y vacunas al inventario."
                action={
                  <button
                    onClick={openNewMed}
                    className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                  >
                    Nuevo medicamento
                  </button>
                }
              />
            }
            columns={[
              { key: "name", header: "Nombre", className: "whitespace-nowrap font-medium text-gray-900", cell: (m) => m.name },
              {
                key: "type",
                header: "Tipo",
                className: "whitespace-nowrap",
                cell: (m) => <StatusBadge color="indigo">{labelMedicineType(m.type)}</StatusBadge>,
              },
              { key: "dosage", header: "Dosis", className: "whitespace-nowrap", cell: (m) => m.dosage },
              {
                key: "description",
                header: "Descripción",
                className: "max-w-xs truncate text-gray-500",
                cell: (m) => m.description ?? "—",
              },
              {
                key: "actions",
                header: "",
                align: "right",
                className: "whitespace-nowrap",
                cell: (m) => (
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => openEditMed(m)}
                      className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-indigo-600"
                      aria-label={`Editar ${m.name}`}
                    >
                      <PencilSquareIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setMedToDelete(m)}
                      className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      aria-label={`Eliminar ${m.name}`}
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                ),
              },
            ]}
          />
        </div>

        <div className={tab === "scheduled" ? undefined : "hidden"}>
          <div>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex items-start gap-3">
                <ClockIcon className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
                <p className="text-sm text-gray-600">
                  Programa tratamientos aquí. Cuando los apliques en campo, marca{" "}
                  <strong>Aplicado</strong>.
                </p>
              </div>
              <select
                value={scheduleFilter}
                onChange={(e) => setScheduleFilter(e.target.value as "due" | "all")}
                className="w-full shrink-0 rounded-md border-0 py-1.5 pl-3 pr-8 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 sm:ml-auto sm:w-auto"
              >
                <option value="all">Todas programadas ({scheduledApps.length})</option>
                <option value="due">Pendientes hoy ({dueApps.length})</option>
              </select>
            </div>
            {renderAppTable(visibleScheduled, "scheduled", {
              loading: loadingApps,
              empty: (
                <EmptyState
                  icon={ClipboardDocumentCheckIcon}
                  title={scheduleFilter === "due" ? "Sin pendientes" : "Sin programaciones"}
                  description={
                    scheduleFilter === "due"
                      ? "No hay dosis programadas para hoy o fechas anteriores."
                      : "Programa la primera aplicación con el botón de arriba."
                  }
                  action={
                    scheduleFilter === "all" && meds.length > 0 && sheep.length > 0 ? (
                      <button
                        onClick={openSchedule}
                        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                      >
                        Programar aplicación
                      </button>
                    ) : undefined
                  }
                />
              ),
            })}
          </div>
        </div>

        <div className={tab === "history" ? undefined : "hidden"}>
          {renderAppTable(historyApps, "history", {
            loading: loadingApps,
            loadingText: "Cargando historial...",
            empty: (
              <EmptyState
                icon={ClipboardDocumentCheckIcon}
                title="Sin historial"
                description="Las aplicaciones marcadas como Aplicado, Cancelado u Omitido aparecerán aquí."
              />
            ),
          })}
        </div>
      </div>

      {/* Catalog drawer */}
      <Drawer
        open={medOpen}
        onClose={() => setMedOpen(false)}
        title={editingMed ? "Editar medicamento" : "Nuevo medicamento"}
        description="Registra un fármaco o vacuna en el inventario."
        footer={
          <>
            <button
              type="button"
              onClick={() => setMedOpen(false)}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="medicine-form"
              disabled={savingMed}
              className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {savingMed && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              )}
              {editingMed ? "Guardar" : "Crear"}
            </button>
          </>
        }
      >
        <form id="medicine-form" onSubmit={saveMed} className="flex flex-col gap-4">
          {medError && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{medError}</div>
          )}
          <Field label="Nombre" required htmlFor="med-name">
            <TextInput
              id="med-name"
              value={medForm.name}
              onChange={(e) => setMedForm({ ...medForm, name: e.target.value })}
              required
            />
          </Field>
          <Field label="Tipo" required htmlFor="med-type">
            <Select
              id="med-type"
              value={medForm.type}
              onChange={(e) => setMedForm({ ...medForm, type: e.target.value as MedicineType })}
            >
              {medicineTypeOptions.map((t) => (
                <option key={t} value={t}>
                  {labelMedicineType(t)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Dosis" required htmlFor="med-dosage">
            <TextInput
              id="med-dosage"
              value={medForm.dosage}
              onChange={(e) => setMedForm({ ...medForm, dosage: e.target.value })}
              placeholder="1ml/50kg"
              required
            />
          </Field>
          <Field label="Descripción" htmlFor="med-desc">
            <Textarea
              id="med-desc"
              rows={2}
              value={medForm.description}
              onChange={(e) => setMedForm({ ...medForm, description: e.target.value })}
            />
          </Field>
          <Field label="Notas" htmlFor="med-notes">
            <Textarea
              id="med-notes"
              rows={2}
              value={medForm.notes}
              onChange={(e) => setMedForm({ ...medForm, notes: e.target.value })}
            />
          </Field>
        </form>
      </Drawer>

      {/* Schedule drawer — planned date only */}
      <Drawer
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        title="Programar aplicación"
        description="Crea una dosis pendiente. Aún no se ha aplicado — marca Aplicado cuando la realices."
        footer={
          <>
            <button
              type="button"
              onClick={() => setScheduleOpen(false)}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="schedule-form"
              disabled={savingSchedule || !scheduleForm.medicineId || !scheduleForm.sheepId}
              className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {savingSchedule && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              )}
              Programar
            </button>
          </>
        }
      >
        <form id="schedule-form" onSubmit={saveSchedule} className="flex flex-col gap-4">
          {scheduleError && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{scheduleError}</div>
          )}
          <Field label="Medicamento" required htmlFor="sch-medicine">
            <Combobox
              id="sch-medicine"
              options={medicineOptions}
              value={scheduleForm.medicineId}
              onChange={(v) => setScheduleForm({ ...scheduleForm, medicineId: v })}
              placeholder="Seleccionar medicamento"
            />
          </Field>
          <Field label="Oveja" required htmlFor="sch-sheep">
            <Combobox
              id="sch-sheep"
              options={sheepOptions}
              value={scheduleForm.sheepId}
              onChange={(v) => setScheduleForm({ ...scheduleForm, sheepId: v })}
              placeholder="Seleccionar oveja"
            />
          </Field>
          <Field label="Fecha programada" required htmlFor="sch-date">
            <TextInput
              id="sch-date"
              type="date"
              value={scheduleForm.scheduledDate}
              onChange={(e) => setScheduleForm({ ...scheduleForm, scheduledDate: e.target.value })}
              required
            />
          </Field>
          <Field label="Notas" htmlFor="sch-notes">
            <Textarea
              id="sch-notes"
              rows={2}
              value={scheduleForm.notes}
              onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
            />
          </Field>
        </form>
      </Drawer>

      {/* Bulk schedule drawer — many sheep, one medicine + date */}
      <Drawer
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        title="Programar en lote"
        description={`${bulkSelected.size} oveja(s) seleccionada(s)`}
        footer={
          <>
            <button
              type="button"
              onClick={() => setBulkOpen(false)}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="bulk-schedule-form"
              disabled={savingBulk || !bulkMedicineId || bulkSelected.size === 0}
              className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {savingBulk && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              )}
              Programar ({bulkSelected.size})
            </button>
          </>
        }
      >
        <form id="bulk-schedule-form" onSubmit={saveBulk} className="flex flex-col gap-4">
          {bulkError && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{bulkError}</div>
          )}
          {bulkResult && bulkResult.failed.length > 0 && (
            <div className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
              <p className="font-medium">
                {bulkResult.succeeded.length} programada(s), {bulkResult.failed.length} con error:
              </p>
              <ul className="mt-1 list-disc pl-5">
                {bulkResult.failed.map((f) => (
                  <li key={f.sheepId}>
                    {sheepDisplayTag(f.sheepId)}: {f.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Field label="Medicamento" required htmlFor="bulk-medicine">
            <Combobox
              id="bulk-medicine"
              options={medicineOptions}
              value={bulkMedicineId}
              onChange={setBulkMedicineId}
              placeholder="Seleccionar medicamento"
            />
          </Field>
          <Field label="Fecha programada" required htmlFor="bulk-date">
            <TextInput
              id="bulk-date"
              type="date"
              value={bulkDate}
              onChange={(e) => setBulkDate(e.target.value)}
              required
            />
          </Field>
          <Field label="Notas" htmlFor="bulk-notes">
            <Textarea
              id="bulk-notes"
              rows={2}
              value={bulkNotes}
              onChange={(e) => setBulkNotes(e.target.value)}
            />
          </Field>
          <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
            <p className="mb-2 text-sm font-medium text-gray-700">Filtrar ovejas</p>
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
              {bulkVisibleSheep.length === 0 ? (
                <p className="px-3 py-4 text-center text-sm text-gray-500">Sin ovejas para este filtro</p>
              ) : (
                bulkVisibleSheep.map((s) => (
                  <label
                    key={s.id}
                    className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={bulkSelected.has(s.id)}
                      onChange={() => toggleBulkOne(s.id)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-gray-900">{s.tag}</span>
                      <span className="block truncate text-xs text-gray-500">
                        {s.name ? `${s.name} · ` : ""}
                        {labelCategory(s.category)}
                      </span>
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>
        </form>
      </Drawer>

      {/* Apply drawer — confirm + optional next schedule */}
      <Drawer
        open={!!applyTarget}
        onClose={() => setApplyTarget(null)}
        title="Registrar aplicación"
        description={
          applyTarget
            ? `${medDisplayName(applyTarget.medicineId)} → ${sheepDisplayTag(applyTarget.sheepId)}`
            : undefined
        }
        footer={
          <>
            <button
              type="button"
              onClick={() => setApplyTarget(null)}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="apply-form"
              disabled={savingApply}
              className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-60"
            >
              {savingApply && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              )}
              Confirmar aplicado
            </button>
          </>
        }
      >
        <form id="apply-form" onSubmit={confirmApply} className="flex flex-col gap-4">
          {applyError && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{applyError}</div>
          )}
          <Field label="Fecha en que se aplicó" required htmlFor="apply-date">
            <TextInput
              id="apply-date"
              type="date"
              value={applyForm.appliedDate}
              onChange={(e) => setApplyForm({ ...applyForm, appliedDate: e.target.value })}
              required
            />
          </Field>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={applyForm.scheduleNext}
              onChange={(e) =>
                setApplyForm({
                  ...applyForm,
                  scheduleNext: e.target.checked,
                  nextScheduledDate: e.target.checked
                    ? applyForm.nextScheduledDate ||
                      (() => {
                        const d = new Date(applyForm.appliedDate)
                        d.setDate(d.getDate() + 7)
                        return d.toISOString().split("T")[0]
                      })()
                    : "",
                })
              }
              className="rounded border-gray-300 text-indigo-600"
            />
            Programar próxima dosis (nuevo registro)
          </label>
          {applyForm.scheduleNext && (
            <Field label="Fecha próxima dosis" required htmlFor="apply-next">
              <TextInput
                id="apply-next"
                type="date"
                value={applyForm.nextScheduledDate}
                onChange={(e) => setApplyForm({ ...applyForm, nextScheduledDate: e.target.value })}
                required
              />
            </Field>
          )}
          <Field label="Notas" htmlFor="apply-notes">
            <Textarea
              id="apply-notes"
              rows={3}
              value={applyForm.notes}
              onChange={(e) => setApplyForm({ ...applyForm, notes: e.target.value })}
              placeholder="Ej. dosis aplicada, reacción, lote, observaciones del campo..."
            />
          </Field>
        </form>
      </Drawer>

      <ConfirmDialog
        open={!!medToDelete}
        title="Eliminar medicamento"
        message={`¿Eliminar "${medToDelete?.name}" del inventario de fármacos?`}
        loading={deletingMed}
        onConfirm={confirmDeleteMed}
        onClose={() => setMedToDelete(null)}
      />

      <ConfirmDialog
        open={!!appToDelete}
        title="Eliminar registro"
        message="¿Eliminar este registro?"
        loading={deletingApp}
        onConfirm={confirmDeleteApp}
        onClose={() => setAppToDelete(null)}
      />
    </DashboardLayout>
  )
}
