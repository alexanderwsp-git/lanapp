"use client"

import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react"
import { MedicineStatus } from "@sheep/domain"
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
  AnalysisStatus,
  AnalysisType,
  type ApiAnalysis,
  type ApiAnalysisType,
} from "@/lib/analysis/types"
import {
  bulkScheduleAnalyses,
  createAnalysisType,
  deleteAnalysis,
  deleteAnalysisType,
  fetchAnalyses,
  fetchAnalysisTypes,
  markAnalysisCompleted,
  updateAnalysis,
  updateAnalysisType,
} from "@/lib/api/analysis"
import { fetchSheep } from "@/lib/api/sheep"
import { fetchLocations } from "@/lib/api/location"
import { fetchMedicines, createMedicineApplication } from "@/lib/api/medicine"
import type { ApiLocation, ApiMedicine, ApiSheep, BulkResult } from "@/lib/api/types"
import { SheepCategoryCell } from "@/components/sheep-category-cell"
import { labelMedicineType, medicineTypeOptions } from "@/lib/labels/medicine"
import { toDateInputValue, formatDisplayDate } from "@/lib/format"
import { AnalysisDiagnosisDrawer } from "@/components/analysis-diagnosis-drawer"
import { medsForType, treatmentNotes } from "@/lib/analysis/diagnosis-form"
import {
  analysisRecommendation,
  analysisTypeOptions,
  famachaColor,
  famachaDiagnosis,
  labelAnalysisType,
} from "@/lib/labels/analysis"
import {
  IconAdd,
  IconAnalysis,
  IconCancel,
  IconDelete,
  IconDiagnosis,
  IconDue,
  IconEdit,
  IconSchedule,
} from "@/lib/icons/analysis-medicine"
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline"

type TypeForm = {
  type: AnalysisType
  name: string
  description: string
  defaultUnit: string
  recommendedMedicineType: string
}


type BatchEntry = {
  score: number | null
  value: string
  diagnosis: string
  diagnosisTouched: boolean
  notes: string
}

type BatchTreatmentItem = {
  analysisId: string
  sheepId: string
  sheepTag: string
  message: string
  medicineType: string
  medicineId: string
  completedDate: string
  diagnosis: string
  analysisTypeName: string
  selected: boolean
}

const today = () => new Date().toISOString().split("T")[0]
const SCORES = [1, 2, 3, 4, 5]

const scoreButton: Record<number, { active: string; idle: string }> = {
  1: { active: "border-red-500 bg-red-600 text-white", idle: "border-red-200 text-red-700 hover:bg-red-50" },
  2: { active: "border-red-400 bg-red-500 text-white", idle: "border-red-200 text-red-700 hover:bg-red-50" },
  3: { active: "border-yellow-400 bg-yellow-400 text-yellow-900", idle: "border-yellow-200 text-yellow-700 hover:bg-yellow-50" },
  4: { active: "border-green-400 bg-green-500 text-white", idle: "border-green-200 text-green-700 hover:bg-green-50" },
  5: { active: "border-green-500 bg-green-600 text-white", idle: "border-green-200 text-green-700 hover:bg-green-50" },
}

const emptyTypeForm = (): TypeForm => ({
  type: AnalysisType.FAMACHA,
  name: "",
  description: "",
  defaultUnit: "",
  recommendedMedicineType: "",
})

const HISTORY_STATUSES = new Set<AnalysisStatus>([
  AnalysisStatus.COMPLETED,
  AnalysisStatus.CANCELLED,
  AnalysisStatus.MISSED,
])

function isDue(a: ApiAnalysis): boolean {
  return a.status === AnalysisStatus.SCHEDULED && toDateInputValue(a.scheduledDate) <= today()
}

export default function AnalysisPage() {
  const [tab, setTab] = useState<"types" | "scheduled" | "history">("scheduled")
  const [scheduleFilter, setScheduleFilter] = useState<"due" | "all">("all")
  const [loadError, setLoadError] = useState<string | null>(null)

  const [types, setTypes] = useState<ApiAnalysisType[]>([])
  const [analyses, setAnalyses] = useState<ApiAnalysis[]>([])
  const [sheep, setSheep] = useState<ApiSheep[]>([])
  const [locations, setLocations] = useState<ApiLocation[]>([])
  const [meds, setMeds] = useState<ApiMedicine[]>([])
  const [loadingTypes, setLoadingTypes] = useState(true)
  const [loadingAnalyses, setLoadingAnalyses] = useState(true)

  const [typeForm, setTypeForm] = useState<TypeForm>(emptyTypeForm())
  const [typeOpen, setTypeOpen] = useState(false)
  const [editingType, setEditingType] = useState<ApiAnalysisType | null>(null)
  const [typeToDelete, setTypeToDelete] = useState<ApiAnalysisType | null>(null)
  const [savingType, setSavingType] = useState(false)
  const [deletingType, setDeletingType] = useState(false)
  const [typeError, setTypeError] = useState<string | null>(null)

  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkTypeId, setBulkTypeId] = useState("")
  const [bulkDate, setBulkDate] = useState(today())
  const [bulkNotes, setBulkNotes] = useState("")
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set())
  const [savingBulk, setSavingBulk] = useState(false)
  const [bulkError, setBulkError] = useState<string | null>(null)
  const [bulkResult, setBulkResult] = useState<BulkResult | null>(null)

  // Batch result entry (record results for many scheduled analyses at once).
  const [batchOpen, setBatchOpen] = useState(false)
  const [batchTypeId, setBatchTypeId] = useState("")
  const [batchDate, setBatchDate] = useState(today())
  const [batchEntries, setBatchEntries] = useState<Record<string, BatchEntry>>({})
  const [savingBatch, setSavingBatch] = useState(false)
  const [batchError, setBatchError] = useState<string | null>(null)
  const [batchResult, setBatchResult] = useState<{ saved: number; needTreatment: number } | null>(null)
  const [batchTreatmentQueue, setBatchTreatmentQueue] = useState<BatchTreatmentItem[]>([])
  const [schedulingBatchTreatments, setSchedulingBatchTreatments] = useState(false)
  const [batchTreatmentError, setBatchTreatmentError] = useState<string | null>(null)

  const [resultTarget, setResultTarget] = useState<ApiAnalysis | null>(null)
  const [resultSuccess, setResultSuccess] = useState<string | null>(null)

  const [toDelete, setToDelete] = useState<ApiAnalysis | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null)

  const typeById = useMemo(() => new Map(types.map((t) => [t.id, t])), [types])
  const sheepById = useMemo(() => new Map(sheep.map((s) => [s.id, s])), [sheep])

  const scheduledAnalyses = useMemo(
    () => analyses.filter((a) => a.status === AnalysisStatus.SCHEDULED),
    [analyses],
  )
  const dueAnalyses = useMemo(() => scheduledAnalyses.filter(isDue), [scheduledAnalyses])
  const historyAnalyses = useMemo(
    () => analyses.filter((a) => HISTORY_STATUSES.has(a.status as AnalysisStatus)),
    [analyses],
  )

  const visibleScheduled = useMemo(() => {
    const list = scheduleFilter === "due" ? dueAnalyses : scheduledAnalyses
    return [...list].sort((a, b) => {
      const aDue = isDue(a) ? 0 : 1
      const bDue = isDue(b) ? 0 : 1
      if (aDue !== bDue) return aDue - bDue
      return toDateInputValue(a.scheduledDate).localeCompare(toDateInputValue(b.scheduledDate))
    })
  }, [scheduleFilter, dueAnalyses, scheduledAnalyses])

  const loadTypes = useCallback(async () => {
    setLoadingTypes(true)
    try {
      const res = await fetchAnalysisTypes(1, 200)
      setTypes(res.items)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "No se pudieron cargar los tipos de análisis")
      setTypes([])
    } finally {
      setLoadingTypes(false)
    }
  }, [])

  const loadAnalyses = useCallback(async () => {
    setLoadingAnalyses(true)
    try {
      const res = await fetchAnalyses(1, 300)
      setAnalyses(res.items)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "No se pudieron cargar los análisis")
      setAnalyses([])
    } finally {
      setLoadingAnalyses(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function loadAll() {
      setLoadingTypes(true)
      setLoadingAnalyses(true)
      setLoadError(null)
      try {
        const [typesRes, analysesRes, sheepRes, locsRes, medsRes] = await Promise.all([
          fetchAnalysisTypes(1, 200),
          fetchAnalyses(1, 300),
          fetchSheep({ page: 1, limit: 200 }),
          fetchLocations(200).catch(() => [] as ApiLocation[]),
          fetchMedicines(1, 200).catch(() => ({ items: [] as ApiMedicine[] })),
        ])
        if (cancelled) return
        setTypes(typesRes.items)
        setAnalyses(analysesRes.items)
        setSheep(sheepRes.items)
        setLocations(locsRes)
        setMeds(medsRes.items)
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : "No se pudieron cargar los datos")
        }
      } finally {
        if (!cancelled) {
          setLoadingTypes(false)
          setLoadingAnalyses(false)
        }
      }
    }
    loadAll()
    return () => {
      cancelled = true
    }
  }, [])

  // Prefill schedule drawer from ?scheduleSheep=<id>
  useEffect(() => {
    if (typeof window === "undefined") return
    const params = new URLSearchParams(window.location.search)
    const scheduleSheep = params.get("scheduleSheep")
    if (scheduleSheep) {
      openBulk({ sheepId: scheduleSheep })
      setTab("scheduled")
      window.history.replaceState({}, "", "/analysis")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const typeOptions = useMemo(
    () => types.map((t) => ({ value: t.id, label: t.name, sublabel: labelAnalysisType(t.type) })),
    [types],
  )

  function typeName(id: string) {
    return typeById.get(id)?.name ?? id
  }
  function sheepTag(id: string) {
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

  // --- Catalog (types) ---
  function openNewType() {
    setEditingType(null)
    setTypeForm(emptyTypeForm())
    setTypeError(null)
    setTypeOpen(true)
  }
  function openEditType(t: ApiAnalysisType) {
    setEditingType(t)
    setTypeForm({
      type: t.type,
      name: t.name,
      description: t.description ?? "",
      defaultUnit: t.defaultUnit ?? "",
      recommendedMedicineType: t.recommendedMedicineType ?? "",
    })
    setTypeError(null)
    setTypeOpen(true)
  }
  async function saveType(e: React.FormEvent) {
    e.preventDefault()
    setTypeError(null)
    if (!typeForm.name.trim()) {
      setTypeError("El nombre es obligatorio")
      return
    }
    const payload = {
      type: typeForm.type,
      name: typeForm.name.trim(),
      description: typeForm.description.trim() || null,
      defaultUnit: typeForm.defaultUnit.trim() || null,
      recommendedMedicineType: typeForm.recommendedMedicineType || null,
    }
    setSavingType(true)
    try {
      if (editingType) await updateAnalysisType(editingType.id, payload)
      else await createAnalysisType(payload)
      setTypeOpen(false)
      await loadTypes()
    } catch (err) {
      setTypeError(err instanceof Error ? err.message : "No se pudo guardar")
    } finally {
      setSavingType(false)
    }
  }
  async function confirmDeleteType() {
    if (!typeToDelete) return
    setDeletingType(true)
    try {
      await deleteAnalysisType(typeToDelete.id)
      setTypeToDelete(null)
      await loadTypes()
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "No se pudo eliminar")
      setTypeToDelete(null)
    } finally {
      setDeletingType(false)
    }
  }

  // --- Schedule (one or many sheep) ---
  function openBulk(prefill?: { sheepId?: string }) {
    setBulkTypeId("")
    setBulkDate(today())
    setBulkNotes("")
    setBulkSelected(prefill?.sheepId ? new Set([prefill.sheepId]) : new Set())
    setBulkError(null)
    setBulkResult(null)
    setBulkOpen(true)
  }
  async function saveBulk(e: React.FormEvent) {
    e.preventDefault()
    setBulkError(null)
    setBulkResult(null)
    if (!bulkTypeId) return setBulkError("Selecciona un tipo de análisis")
    if (!bulkDate) return setBulkError("Indica la fecha")
    const sheepIds = Array.from(bulkSelected)
    if (sheepIds.length === 0) return setBulkError("Selecciona al menos una oveja")

    setSavingBulk(true)
    try {
      const res = await bulkScheduleAnalyses({
        analysisTypeId: bulkTypeId,
        scheduledDate: bulkDate,
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
      await loadAnalyses()
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

  // --- Batch result entry ---
  // Types that actually have pending analyses, with a count for the selector.
  const batchTypeOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string; type: AnalysisType; count: number }>()
    for (const a of scheduledAnalyses) {
      const t = a.analysisType
      if (!t) continue
      const existing = map.get(t.id)
      if (existing) existing.count++
      else map.set(t.id, { id: t.id, name: t.name, type: t.type, count: 1 })
    }
    return Array.from(map.values())
  }, [scheduledAnalyses])

  const batchRows = useMemo(
    () => scheduledAnalyses.filter((a) => a.analysisTypeId === batchTypeId),
    [scheduledAnalyses, batchTypeId],
  )
  const batchIsFamacha =
    batchTypeOptions.find((t) => t.id === batchTypeId)?.type === AnalysisType.FAMACHA

  function openBatch() {
    const firstType = batchTypeOptions[0]?.id ?? ""
    setBatchTypeId(firstType)
    setBatchDate(today())
    setBatchEntries({})
    setBatchError(null)
    setBatchResult(null)
    setBatchTreatmentQueue([])
    setBatchTreatmentError(null)
    setBatchOpen(true)
  }

  function batchSelectScore(analysisId: string, score: number) {
    setBatchEntries((prev) => {
      const entry = prev[analysisId] ?? { score: null, value: "", diagnosis: "", diagnosisTouched: false, notes: "" }
      return {
        ...prev,
        [analysisId]: {
          ...entry,
          score,
          diagnosis: entry.diagnosisTouched ? entry.diagnosis : famachaDiagnosis(score),
        },
      }
    })
  }

  function batchSetValue(analysisId: string, value: string) {
    setBatchEntries((prev) => {
      const entry = prev[analysisId] ?? { score: null, value: "", diagnosis: "", diagnosisTouched: false, notes: "" }
      return { ...prev, [analysisId]: { ...entry, value } }
    })
  }

  function batchSetDiagnosis(analysisId: string, diagnosis: string) {
    setBatchEntries((prev) => {
      const entry = prev[analysisId] ?? { score: null, value: "", diagnosis: "", diagnosisTouched: false, notes: "" }
      return { ...prev, [analysisId]: { ...entry, diagnosis, diagnosisTouched: true } }
    })
  }

  function batchSetNotes(analysisId: string, notes: string) {
    setBatchEntries((prev) => {
      const entry = prev[analysisId] ?? { score: null, value: "", diagnosis: "", diagnosisTouched: false, notes: "" }
      return { ...prev, [analysisId]: { ...entry, notes } }
    })
  }

  // How many rows in the current batch have a usable value entered.
  const batchFilledCount = useMemo(() => {
    return batchRows.reduce((n, a) => {
      const entry = batchEntries[a.id]
      if (!entry) return n
      const ok = batchIsFamacha ? entry.score != null : entry.value.trim().length > 0
      return ok ? n + 1 : n
    }, 0)
  }, [batchRows, batchEntries, batchIsFamacha])

  async function saveBatch(e: React.FormEvent) {
    e.preventDefault()
    setBatchError(null)
    setBatchResult(null)
    setBatchTreatmentQueue([])
    setBatchTreatmentError(null)
    if (!batchTypeId) return setBatchError("Selecciona un tipo de análisis")
    if (!batchDate) return setBatchError("Indica la fecha")

    const toSave = batchRows.filter((a) => {
      const entry = batchEntries[a.id]
      if (!entry) return false
      return batchIsFamacha ? entry.score != null : entry.value.trim().length > 0
    })
    if (toSave.length === 0)
      return setBatchError("Ingresa al menos un diagnóstico para guardar")

    setSavingBatch(true)
    try {
      let saved = 0
      let needTreatment = 0
      const treatmentItems: BatchTreatmentItem[] = []
      for (const a of toSave) {
        const entry = batchEntries[a.id]
        const completed = await markAnalysisCompleted(a, {
          completedDate: batchDate,
          famachaScore: batchIsFamacha ? entry.score : null,
          resultValue: batchIsFamacha ? String(entry.score) : entry.value.trim(),
          diagnosis: entry.diagnosis.trim() || null,
          notes: entry.notes.trim() || null,
        })
        saved++
        const rec = analysisRecommendation(completed)
        if (rec.needsTreatment && rec.medicineType) {
          needTreatment++
          const options = medsForType(meds, rec.medicineType)
          const defaultMed = options[0]
          treatmentItems.push({
            analysisId: completed.id,
            sheepId: completed.sheepId,
            sheepTag: completed.sheep?.tag ?? sheepTag(completed.sheepId),
            message: rec.message,
            medicineType: rec.medicineType,
            medicineId: defaultMed?.id ?? "",
            completedDate: batchDate,
            diagnosis: entry.diagnosis.trim(),
            analysisTypeName: completed.analysisType?.name ?? typeName(completed.analysisTypeId),
            selected: !!defaultMed,
          })
        }
      }
      setBatchResult({ saved, needTreatment })
      setBatchTreatmentQueue(treatmentItems)
      setBatchTreatmentError(null)
      await loadAnalyses()
      setBatchEntries({})
    } catch (err) {
      setBatchError(err instanceof Error ? err.message : "No se pudieron guardar los diagnósticos")
    } finally {
      setSavingBatch(false)
    }
  }

  function openResult(a: ApiAnalysis) {
    setResultTarget(a)
  }

  async function scheduleBatchTreatments() {
    const selected = batchTreatmentQueue.filter((item) => item.selected && item.medicineId)
    if (selected.length === 0) {
      setBatchTreatmentError("Selecciona al menos una oveja con medicamento para programar.")
      return
    }
    setSchedulingBatchTreatments(true)
    setBatchTreatmentError(null)
    try {
      for (const item of selected) {
        await createMedicineApplication({
          medicineId: item.medicineId,
          sheepId: item.sheepId,
          analysisId: item.analysisId,
          applicationDate: new Date(item.completedDate),
          status: MedicineStatus.SCHEDULED,
          notes: treatmentNotes(item.analysisTypeName, item.diagnosis),
        })
      }
      setBatchTreatmentQueue((prev) => prev.filter((item) => !item.selected || !item.medicineId))
      setResultSuccess(
        `${selected.length} tratamiento(s) programado(s). Revisa en Medicina o en la ficha de cada oveja.`,
      )
    } catch (err) {
      setBatchTreatmentError(
        err instanceof Error ? err.message : "No se pudieron programar los tratamientos",
      )
    } finally {
      setSchedulingBatchTreatments(false)
    }
  }

  async function setStatus(a: ApiAnalysis, status: AnalysisStatus) {
    setStatusUpdating(a.id)
    try {
      await updateAnalysis(a.id, { status })
      await loadAnalyses()
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "No se pudo actualizar")
    } finally {
      setStatusUpdating(null)
    }
  }

  async function confirmDelete() {
    if (!toDelete) return
    setDeleting(true)
    try {
      await deleteAnalysis(toDelete.id)
      setToDelete(null)
      await loadAnalyses()
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "No se pudo eliminar")
      setToDelete(null)
    } finally {
      setDeleting(false)
    }
  }

  function renderResultCell(a: ApiAnalysis): ReactNode {
    if (a.status === AnalysisStatus.SCHEDULED) return <span className="text-gray-400">Pendiente</span>
    if (a.analysisType?.type === AnalysisType.FAMACHA && a.famachaScore != null) {
      return <StatusBadge color={famachaColor(a.famachaScore)}>{`FAMACHA ${a.famachaScore}`}</StatusBadge>
    }
    return <span className="text-gray-900">{a.resultValue || "—"}</span>
  }

  function renderTable(
    rows: ApiAnalysis[],
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
        columns={[
          {
            key: "type",
            header: "Análisis",
            className: "whitespace-nowrap font-medium text-gray-900",
            cell: (a) => (
              <div className="flex items-center gap-2">
                <IconAnalysis className="size-4 shrink-0 text-gray-400" aria-hidden="true" />
                {a.analysisType?.name ?? typeName(a.analysisTypeId)}
              </div>
            ),
          },
          {
            key: "sheep",
            header: "Oveja",
            className: "whitespace-nowrap",
            cell: (a) => (
              <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                {a.sheep?.tag ?? sheepTag(a.sheepId)}
              </span>
            ),
          },
          {
            key: "date",
            header: mode === "scheduled" ? "Programado" : "Fecha",
            className: "whitespace-nowrap",
            cell: (a) => {
              const due = isDue(a)
              return (
                <>
                  <div className="font-medium text-gray-900">
                    {formatDisplayDate(mode === "history" ? a.completedDate ?? a.scheduledDate : a.scheduledDate)}
                  </div>
                  {mode === "scheduled" && due ? (
                    <div className="mt-1">
                      <StatusBadge color="yellow" icon={IconDue}>
                        Vence hoy
                      </StatusBadge>
                    </div>
                  ) : mode === "scheduled" && toDateInputValue(a.scheduledDate) > today() ? (
                    <span className="mt-1 inline-block text-xs text-gray-400">Próximo</span>
                  ) : null}
                </>
              )
            },
          },
          {
            key: "result",
            header: "Resultado",
            className: "whitespace-nowrap",
            cell: (a) => renderResultCell(a),
          },
          {
            key: "diagnosis",
            header: "Diagnóstico",
            className: "max-w-[12rem] truncate text-gray-500",
            cell: (a) => <span title={a.diagnosis ?? undefined}>{a.diagnosis || "—"}</span>,
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
                      onClick={() => openResult(a)}
                      className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-indigo-600 disabled:opacity-50"
                      title="Registrar diagnóstico"
                      aria-label="Registrar diagnóstico"
                    >
                      <IconDiagnosis className="h-5 w-5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      disabled={statusUpdating === a.id}
                      onClick={() => setStatus(a, AnalysisStatus.CANCELLED)}
                      className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-indigo-600 disabled:opacity-50"
                      title="Cancelar"
                      aria-label="Cancelar"
                    >
                      <IconCancel className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </>
                )}
                <button
                  onClick={() => setToDelete(a)}
                  className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  aria-label="Eliminar"
                >
                  <IconDelete className="h-5 w-5" aria-hidden="true" />
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
        title="Análisis"
        description="Estudios de salud: programación y resultados (FAMACHA, coprológico, etc.)"
        action={
          tab === "types" ? (
            <button
              onClick={openNewType}
              className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
            >
              <IconAdd className="h-5 w-5" aria-hidden="true" />
              Nuevo tipo
            </button>
          ) : (
            <div className="flex items-center gap-2">
              {tab === "scheduled" && (
                <button
                  onClick={openBatch}
                  disabled={scheduledAnalyses.length === 0}
                  className="inline-flex items-center gap-2 rounded-md border border-indigo-600 px-4 py-2 text-sm font-semibold text-indigo-600 shadow-sm hover:bg-indigo-50 disabled:opacity-50"
                >
                  <IconDiagnosis className="h-5 w-5" aria-hidden="true" />
                  Registrar diagnósticos
                </button>
              )}
              <button
                onClick={() => openBulk()}
                disabled={types.length === 0 || sheep.length === 0}
                className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
              >
                <IconSchedule className="h-5 w-5" aria-hidden="true" />
                Programar análisis
              </button>
            </div>
          )
        }
      />

      {resultSuccess && (
        <div className="mb-4 flex flex-col gap-2 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 sm:flex-row sm:items-center sm:justify-between">
          <p>{resultSuccess}</p>
          <button
            type="button"
            onClick={() => setResultSuccess(null)}
            className="shrink-0 self-start rounded-md p-1 text-green-700 hover:bg-green-100 sm:self-center"
            aria-label="Cerrar"
          >
            <IconCancel className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      )}

      {loadError && (
        <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
          <button
            type="button"
            onClick={() => {
              loadTypes()
              loadAnalyses()
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
            { id: "types" as const, label: "Tipos de análisis" },
            { id: "scheduled" as const, label: "Programados" },
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
                  t.id !== "scheduled" || dueAnalyses.length === 0 ? "hidden" : ""
                }`}
                aria-hidden={t.id !== "scheduled" || dueAnalyses.length === 0}
              >
                {dueAnalyses.length}
              </span>
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-6">
        <div className={tab === "types" ? undefined : "hidden"}>
          <DataTable
            rows={types}
            rowKey={(t) => t.id}
            loading={loadingTypes}
            loadingText="Cargando tipos..."
            empty={
              <EmptyState
                icon={IconAnalysis}
                title="Sin tipos de análisis"
                description="Crea tipos como FAMACHA o coprológico para programar diagnósticos."
                action={
                  <button
                    onClick={openNewType}
                    className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                  >
                    Nuevo tipo
                  </button>
                }
              />
            }
            columns={[
              { key: "name", header: "Nombre", className: "whitespace-nowrap font-medium text-gray-900", cell: (t) => t.name },
              {
                key: "type",
                header: "Categoría",
                className: "whitespace-nowrap",
                cell: (t) => <StatusBadge color="indigo">{labelAnalysisType(t.type)}</StatusBadge>,
              },
              { key: "unit", header: "Unidad", className: "whitespace-nowrap text-gray-700", cell: (t) => t.defaultUnit || "—" },
              {
                key: "rec",
                header: "Tratamiento sugerido",
                className: "whitespace-nowrap text-gray-500",
                cell: (t) => (t.recommendedMedicineType ? labelMedicineType(t.recommendedMedicineType) : "—"),
              },
              {
                key: "actions",
                header: "",
                align: "right",
                className: "whitespace-nowrap",
                cell: (t) => (
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => openEditType(t)}
                      className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-indigo-600"
                      aria-label={`Editar ${t.name}`}
                    >
                      <IconEdit className="h-5 w-5" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => setTypeToDelete(t)}
                      className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      aria-label={`Eliminar ${t.name}`}
                    >
                      <IconDelete className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>
                ),
              },
            ]}
          />
        </div>

        <div className={tab === "scheduled" ? undefined : "hidden"}>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <IconSchedule className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" aria-hidden="true" />
              <p className="text-sm text-gray-600">
                Programa análisis aquí. Cuando obtengas el valor, registra el{" "}
                <strong>diagnóstico</strong>.
              </p>
            </div>
            <select
              value={scheduleFilter}
              onChange={(e) => setScheduleFilter(e.target.value as "due" | "all")}
              className="w-full shrink-0 rounded-md border-0 py-1.5 pl-3 pr-8 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 sm:ml-auto sm:w-auto"
            >
              <option value="all">Todos programados ({scheduledAnalyses.length})</option>
              <option value="due">Pendientes hoy ({dueAnalyses.length})</option>
            </select>
          </div>
          {renderTable(visibleScheduled, "scheduled", {
            loading: loadingAnalyses,
            empty: (
              <EmptyState
                icon={IconDiagnosis}
                title={scheduleFilter === "due" ? "Sin pendientes" : "Sin análisis programados"}
                description={
                  scheduleFilter === "due"
                    ? "No hay análisis programados para hoy o fechas anteriores."
                    : "Programa el primer análisis con el botón de arriba."
                }
                action={
                  scheduleFilter === "all" && types.length > 0 && sheep.length > 0 ? (
                    <button
                      onClick={() => openBulk()}
                      className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                    >
                      Programar análisis
                    </button>
                  ) : undefined
                }
              />
            ),
          })}
        </div>

        <div className={tab === "history" ? undefined : "hidden"}>
          {renderTable(historyAnalyses, "history", {
            loading: loadingAnalyses,
            loadingText: "Cargando historial...",
            empty: (
              <EmptyState
                icon={IconDiagnosis}
                title="Sin historial"
                description="Los análisis realizados, cancelados u omitidos aparecerán aquí."
              />
            ),
          })}
        </div>
      </div>

      {/* Type drawer */}
      <Drawer
        open={typeOpen}
        onClose={() => setTypeOpen(false)}
        title={editingType ? "Editar tipo de análisis" : "Nuevo tipo de análisis"}
        description="Define un tipo de diagnóstico para programar y registrar diagnósticos."
        footer={
          <>
            <button
              type="button"
              onClick={() => setTypeOpen(false)}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="type-form"
              disabled={savingType}
              className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {savingType && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              )}
              {editingType ? "Guardar" : "Crear"}
            </button>
          </>
        }
      >
        <form id="type-form" onSubmit={saveType} className="flex flex-col gap-4">
          {typeError && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{typeError}</div>
          )}
          <Field label="Nombre" required htmlFor="type-name">
            <TextInput
              id="type-name"
              value={typeForm.name}
              onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
              placeholder="Ej. FAMACHA, Coprológico"
              required
            />
          </Field>
          <Field label="Categoría" required htmlFor="type-cat">
            <Select
              id="type-cat"
              value={typeForm.type}
              onChange={(e) => setTypeForm({ ...typeForm, type: e.target.value as AnalysisType })}
            >
              {analysisTypeOptions.map((t) => (
                <option key={t} value={t}>
                  {labelAnalysisType(t)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Unidad del resultado" htmlFor="type-unit">
            <TextInput
              id="type-unit"
              value={typeForm.defaultUnit}
              onChange={(e) => setTypeForm({ ...typeForm, defaultUnit: e.target.value })}
              placeholder="Ej. 1–5, hpg"
            />
          </Field>
          <Field label="Tratamiento sugerido" htmlFor="type-rec">
            <Select
              id="type-rec"
              value={typeForm.recommendedMedicineType}
              onChange={(e) => setTypeForm({ ...typeForm, recommendedMedicineType: e.target.value })}
            >
              <option value="">Ninguno</option>
              {medicineTypeOptions.map((t) => (
                <option key={t} value={t}>
                  {labelMedicineType(t)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Descripción" htmlFor="type-desc">
            <Textarea
              id="type-desc"
              rows={2}
              value={typeForm.description}
              onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })}
            />
          </Field>
        </form>
      </Drawer>

      {/* Schedule drawer — one type + date, one or many sheep */}
      <Drawer
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        title="Programar análisis"
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
              form="analysis-bulk-form"
              disabled={savingBulk || !bulkTypeId || bulkSelected.size === 0}
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
        <form id="analysis-bulk-form" onSubmit={saveBulk} className="flex flex-col gap-4">
          {bulkError && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{bulkError}</div>
          )}
          {bulkResult && bulkResult.failed.length > 0 && (
            <div className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
              <p className="font-medium">
                {bulkResult.succeeded.length} programado(s), {bulkResult.failed.length} con error:
              </p>
              <ul className="mt-1 list-disc pl-5">
                {bulkResult.failed.map((f) => (
                  <li key={f.sheepId}>
                    {sheepTag(f.sheepId)}: {f.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Field label="Tipo de análisis" required htmlFor="bulk-type">
            <Combobox
              id="bulk-type"
              options={typeOptions}
              value={bulkTypeId}
              onChange={setBulkTypeId}
              placeholder="Seleccionar tipo"
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
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-gray-900">{s.tag}</span>
                      {s.name && (
                        <span className="block truncate text-xs text-gray-500">{s.name}</span>
                      )}
                      <SheepCategoryCell sheep={s} compact />
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>
        </form>
      </Drawer>

      {/* Batch result drawer — record results for many scheduled analyses at once */}
      <Drawer
        open={batchOpen}
        onClose={() => setBatchOpen(false)}
        title="Registrar diagnósticos"
        description="Captura el diagnóstico de cada oveja con análisis pendiente."
        footer={
          <>
            <button
              type="button"
              onClick={() => setBatchOpen(false)}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cerrar
            </button>
            <button
              type="submit"
              form="batch-form"
              disabled={savingBatch || batchFilledCount === 0}
              className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-60"
            >
              {savingBatch && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              )}
              Guardar {batchFilledCount > 0 ? `(${batchFilledCount})` : ""}
            </button>
          </>
        }
      >
        <form id="batch-form" onSubmit={saveBatch} className="flex flex-col gap-4">
          {batchError && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{batchError}</div>
          )}
          {batchResult && (
            <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
              {batchResult.saved} diagnóstico(s) guardado(s).
              {batchResult.needTreatment > 0
                ? ` ${batchResult.needTreatment} requiere(n) tratamiento — programa abajo.`
                : ""}
            </div>
          )}
          {batchTreatmentError && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{batchTreatmentError}</div>
          )}
          {batchTreatmentQueue.length > 0 && (
            <div className="flex flex-col gap-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900">
              <div className="flex items-start gap-2">
                <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                <p>Programa el tratamiento sugerido para las ovejas que lo requieren.</p>
              </div>
              <div className="flex flex-col divide-y divide-amber-100 overflow-hidden rounded-md border border-amber-200 bg-white">
                {batchTreatmentQueue.map((item) => {
                  const options = medsForType(meds, item.medicineType)
                  return (
                    <div key={item.analysisId} className="flex flex-col gap-2 px-3 py-2 sm:flex-row sm:items-center">
                      <label className="flex min-w-0 flex-1 items-start gap-2">
                        <input
                          type="checkbox"
                          checked={item.selected}
                          onChange={(e) =>
                            setBatchTreatmentQueue((prev) =>
                              prev.map((row) =>
                                row.analysisId === item.analysisId
                                  ? { ...row, selected: e.target.checked }
                                  : row,
                              ),
                            )
                          }
                          className="mt-1 rounded border-gray-300"
                        />
                        <span className="min-w-0">
                          <span className="block font-medium text-gray-900">{item.sheepTag}</span>
                          <span className="block text-xs text-gray-500">{item.message}</span>
                        </span>
                      </label>
                      <Select
                        aria-label={`Medicamento para ${item.sheepTag}`}
                        value={item.medicineId}
                        onChange={(e) =>
                          setBatchTreatmentQueue((prev) =>
                            prev.map((row) =>
                              row.analysisId === item.analysisId
                                ? { ...row, medicineId: e.target.value, selected: !!e.target.value }
                                : row,
                            ),
                          )
                        }
                        className="sm:max-w-xs"
                      >
                        <option value="">Sin medicamento</option>
                        {options.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} — {labelMedicineType(m.type)}
                          </option>
                        ))}
                      </Select>
                    </div>
                  )
                })}
              </div>
              <button
                type="button"
                onClick={scheduleBatchTreatments}
                disabled={
                  schedulingBatchTreatments ||
                  !batchTreatmentQueue.some((item) => item.selected && item.medicineId)
                }
                className="inline-flex items-center justify-center gap-2 self-start rounded-md bg-amber-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-amber-500 disabled:opacity-60"
              >
                {schedulingBatchTreatments && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                )}
                Programar seleccionados
              </button>
            </div>
          )}
          {batchTypeOptions.length === 0 ? (
            <p className="rounded-md border border-gray-200 bg-gray-50 px-3 py-4 text-center text-sm text-gray-500">
              No hay análisis programados pendientes.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Tipo de análisis" htmlFor="batch-type">
                  <Select
                    id="batch-type"
                    value={batchTypeId}
                    onChange={(e) => {
                      setBatchTypeId(e.target.value)
                      setBatchEntries({})
                      setBatchResult(null)
                      setBatchTreatmentQueue([])
                      setBatchTreatmentError(null)
                    }}
                  >
                    {batchTypeOptions.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.count})
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Fecha" required htmlFor="batch-date">
                  <TextInput
                    id="batch-date"
                    type="date"
                    value={batchDate}
                    onChange={(e) => setBatchDate(e.target.value)}
                    required
                  />
                </Field>
              </div>

              <div>
                <p className="mb-1.5 text-sm font-medium text-gray-700">
                  Ovejas pendientes ({batchRows.length})
                </p>
                <div className="flex flex-col divide-y divide-gray-100 overflow-hidden rounded-md border border-gray-200">
                  {batchRows.length === 0 ? (
                    <p className="px-3 py-4 text-center text-sm text-gray-500">
                      Sin análisis pendientes de este tipo.
                    </p>
                  ) : (
                    batchRows.map((a) => {
                      const entry = batchEntries[a.id]
                      return (
                        <div key={a.id} className="flex flex-col gap-2 px-3 py-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-medium text-gray-900">
                                {sheepTag(a.sheepId)}
                              </span>
                              {a.sheep?.name && (
                                <span className="block truncate text-xs text-gray-500">
                                  {a.sheep.name}
                                </span>
                              )}
                            </span>
                            {batchIsFamacha ? (
                              <div className="flex gap-1">
                                {SCORES.map((score) => {
                                  const active = entry?.score === score
                                  const style = scoreButton[score]
                                  return (
                                    <button
                                      key={score}
                                      type="button"
                                      onClick={() => batchSelectScore(a.id, score)}
                                      className={`h-8 w-8 rounded-md border text-sm font-semibold ${
                                        active ? style.active : style.idle
                                      }`}
                                    >
                                      {score}
                                    </button>
                                  )
                                })}
                              </div>
                            ) : (
                              <TextInput
                                aria-label={`Resultado de ${sheepTag(a.sheepId)}`}
                                value={entry?.value ?? ""}
                                onChange={(e) => batchSetValue(a.id, e.target.value)}
                                placeholder="Resultado"
                                className="max-w-[10rem]"
                              />
                            )}
                          </div>
                          <Field label="Diagnóstico" htmlFor={`batch-diag-${a.id}`}>
                            <TextInput
                              id={`batch-diag-${a.id}`}
                              value={entry?.diagnosis ?? ""}
                              onChange={(e) => batchSetDiagnosis(a.id, e.target.value)}
                              placeholder="Interpretación del resultado (opcional)"
                            />
                          </Field>
                          <Field label="Notas" htmlFor={`batch-notes-${a.id}`}>
                            <TextInput
                              id={`batch-notes-${a.id}`}
                              value={entry?.notes ?? ""}
                              onChange={(e) => batchSetNotes(a.id, e.target.value)}
                              placeholder="Observaciones (opcional)"
                            />
                          </Field>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </form>
      </Drawer>

      <AnalysisDiagnosisDrawer
        open={!!resultTarget}
        onClose={() => setResultTarget(null)}
        record={resultTarget}
        sheepLabel={
          resultTarget
            ? resultTarget.sheep?.tag ?? sheepTag(resultTarget.sheepId)
            : ""
        }
        meds={meds}
        onSaved={(message) => {
          setResultSuccess(message)
          void loadAnalyses()
        }}
      />

      <ConfirmDialog
        open={!!typeToDelete}
        title="Eliminar tipo de análisis"
        message={`¿Eliminar "${typeToDelete?.name}"?`}
        loading={deletingType}
        onConfirm={confirmDeleteType}
        onClose={() => setTypeToDelete(null)}
      />

      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar análisis"
        message="¿Eliminar este registro de análisis?"
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </DashboardLayout>
  )
}
