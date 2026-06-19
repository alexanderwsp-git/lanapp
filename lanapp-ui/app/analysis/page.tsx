"use client"

import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
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
import { fetchMedicines } from "@/lib/api/medicine"
import type { ApiLocation, ApiMedicine, ApiSheep, BulkResult } from "@/lib/api/types"
import { labelCategory } from "@/lib/labels/sheep"
import { labelMedicineType, medicineTypeOptions } from "@/lib/labels/medicine"
import { toDateInputValue, formatDisplayDate } from "@/lib/format"
import {
  analysisRecommendation,
  analysisTypeOptions,
  famachaColor,
  famachaDiagnosis,
  labelAnalysisType,
} from "@/lib/labels/analysis"
import {
  PlusIcon,
  BeakerIcon,
  PencilSquareIcon,
  TrashIcon,
  ClipboardDocumentCheckIcon,
  CheckBadgeIcon,
  XCircleIcon,
  ClockIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline"

type TypeForm = {
  type: AnalysisType
  name: string
  description: string
  defaultUnit: string
  recommendedMedicineType: string
}


type ResultForm = {
  completedDate: string
  famachaScore: number | null
  resultValue: string
  diagnosis: string
  diagnosisTouched: boolean
  notes: string
  suggestedMedicineId: string
  suggestedMedicineTouched: boolean
}

type TreatmentSuggestion = {
  sheepId: string
  sheepTag: string
  medicineType: string
  medicineId: string
  medicineName: string
  message: string
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
  const router = useRouter()
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
  const [batchEntries, setBatchEntries] = useState<
    Record<string, { score: number | null; value: string; diagnosis: string; diagnosisTouched: boolean }>
  >({})
  const [savingBatch, setSavingBatch] = useState(false)
  const [batchError, setBatchError] = useState<string | null>(null)
  const [batchResult, setBatchResult] = useState<{ saved: number; needTreatment: number } | null>(null)

  const [resultTarget, setResultTarget] = useState<ApiAnalysis | null>(null)
  const [resultForm, setResultForm] = useState<ResultForm>({
    completedDate: today(),
    famachaScore: null,
    resultValue: "",
    diagnosis: "",
    diagnosisTouched: false,
    notes: "",
    suggestedMedicineId: "",
    suggestedMedicineTouched: false,
  })
  const [savingResult, setSavingResult] = useState(false)
  const [resultError, setResultError] = useState<string | null>(null)

  const [treatment, setTreatment] = useState<TreatmentSuggestion | null>(null)

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
    setBatchOpen(true)
  }

  function batchSelectScore(analysisId: string, score: number) {
    setBatchEntries((prev) => {
      const entry = prev[analysisId] ?? { score: null, value: "", diagnosis: "", diagnosisTouched: false }
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
      const entry = prev[analysisId] ?? { score: null, value: "", diagnosis: "", diagnosisTouched: false }
      return { ...prev, [analysisId]: { ...entry, value } }
    })
  }

  function batchSetDiagnosis(analysisId: string, diagnosis: string) {
    setBatchEntries((prev) => {
      const entry = prev[analysisId] ?? { score: null, value: "", diagnosis: "", diagnosisTouched: false }
      return { ...prev, [analysisId]: { ...entry, diagnosis, diagnosisTouched: true } }
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
    if (!batchTypeId) return setBatchError("Selecciona un tipo de análisis")
    if (!batchDate) return setBatchError("Indica la fecha")

    const toSave = batchRows.filter((a) => {
      const entry = batchEntries[a.id]
      if (!entry) return false
      return batchIsFamacha ? entry.score != null : entry.value.trim().length > 0
    })
    if (toSave.length === 0)
      return setBatchError("Ingresa al menos un resultado para guardar")

    setSavingBatch(true)
    try {
      let saved = 0
      let needTreatment = 0
      for (const a of toSave) {
        const entry = batchEntries[a.id]
        const completed = await markAnalysisCompleted(a, {
          completedDate: batchDate,
          famachaScore: batchIsFamacha ? entry.score : null,
          resultValue: batchIsFamacha ? String(entry.score) : entry.value.trim(),
          diagnosis: entry.diagnosis.trim() || null,
          notes: null,
        })
        saved++
        if (analysisRecommendation(completed).needsTreatment) needTreatment++
      }
      setBatchResult({ saved, needTreatment })
      await loadAnalyses()
      setBatchEntries({})
    } catch (err) {
      setBatchError(err instanceof Error ? err.message : "No se pudieron guardar los resultados")
    } finally {
      setSavingBatch(false)
    }
  }

  // --- Register result ---
  function openResult(a: ApiAnalysis) {
    const scheduled = toDateInputValue(a.scheduledDate)
    setResultTarget(a)
    setResultForm({
      completedDate: scheduled <= today() ? today() : scheduled,
      famachaScore: a.famachaScore ?? null,
      resultValue: a.resultValue ?? "",
      diagnosis: a.diagnosis ?? "",
      diagnosisTouched: !!a.diagnosis,
      notes: a.notes ?? "",
      suggestedMedicineId: "",
      suggestedMedicineTouched: false,
    })
    setResultError(null)
  }

  const resultIsFamacha = resultTarget?.analysisType?.type === AnalysisType.FAMACHA

  function selectScore(score: number) {
    setResultForm((prev) => ({
      ...prev,
      famachaScore: score,
      diagnosis: prev.diagnosisTouched ? prev.diagnosis : famachaDiagnosis(score),
    }))
  }

  // Live recommendation preview from the current result form.
  const livePreview = useMemo<ApiAnalysis | null>(() => {
    if (!resultTarget) return null
    return {
      ...resultTarget,
      famachaScore: resultForm.famachaScore,
      resultValue: resultForm.resultValue,
      diagnosis: resultForm.diagnosis,
    }
  }, [resultTarget, resultForm])
  const liveRecommendation = livePreview ? analysisRecommendation(livePreview) : null

  // Medicines matching the recommended type (fallback to the whole catalog),
  // used to suggest a concrete treatment from the diagnosis.
  const suggestedMeds = useMemo(() => {
    if (!liveRecommendation?.medicineType) return []
    const ofType = meds.filter((m) => m.type === liveRecommendation.medicineType)
    return ofType.length > 0 ? ofType : meds
  }, [meds, liveRecommendation?.medicineType])

  // Auto-select the first matching medicine when a treatment becomes recommended
  // and the user hasn't picked one manually.
  useEffect(() => {
    if (!liveRecommendation?.needsTreatment) return
    if (resultForm.suggestedMedicineTouched) return
    const first = suggestedMeds[0]?.id ?? ""
    if (first && resultForm.suggestedMedicineId !== first) {
      setResultForm((prev) =>
        prev.suggestedMedicineTouched ? prev : { ...prev, suggestedMedicineId: first },
      )
    }
  }, [liveRecommendation?.needsTreatment, suggestedMeds, resultForm.suggestedMedicineTouched, resultForm.suggestedMedicineId])

  async function confirmResult(e: React.FormEvent) {
    e.preventDefault()
    if (!resultTarget) return
    setResultError(null)
    if (resultIsFamacha && resultForm.famachaScore == null) {
      setResultError("Selecciona el puntaje FAMACHA")
      return
    }
    if (!resultIsFamacha && !resultForm.resultValue.trim()) {
      setResultError("Ingresa el resultado del análisis")
      return
    }
    setSavingResult(true)
    try {
      const saved = await markAnalysisCompleted(resultTarget, {
        completedDate: resultForm.completedDate,
        famachaScore: resultIsFamacha ? resultForm.famachaScore : null,
        resultValue: resultIsFamacha
          ? String(resultForm.famachaScore)
          : resultForm.resultValue.trim(),
        diagnosis: resultForm.diagnosis.trim() || null,
        notes: resultForm.notes.trim() || null,
      })
      const rec = analysisRecommendation(saved)
      const chosenMed =
        meds.find((m) => m.id === resultForm.suggestedMedicineId) ??
        (rec.medicineType ? meds.find((m) => m.type === rec.medicineType) : undefined)
      setResultTarget(null)
      await loadAnalyses()
      if (rec.needsTreatment && rec.medicineType) {
        setTreatment({
          sheepId: saved.sheepId,
          sheepTag: saved.sheep?.tag ?? sheepTag(saved.sheepId),
          medicineType: rec.medicineType,
          medicineId: chosenMed?.id ?? "",
          medicineName: chosenMed?.name ?? "",
          message: rec.message,
        })
      }
    } catch (err) {
      setResultError(err instanceof Error ? err.message : "No se pudo guardar el resultado")
    } finally {
      setSavingResult(false)
    }
  }

  function scheduleTreatment() {
    if (!treatment) return
    const qs = new URLSearchParams({
      scheduleSheep: treatment.sheepId,
      medType: treatment.medicineType,
      date: today(),
    })
    if (treatment.medicineId) qs.set("medId", treatment.medicineId)
    router.push(`/medicines?${qs.toString()}`)
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
                <BeakerIcon className="size-4 shrink-0 text-gray-400" aria-hidden="true" />
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
                      <StatusBadge color="yellow" icon={ClockIcon}>
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
                      title="Registrar resultado"
                      aria-label="Registrar resultado"
                    >
                      <CheckBadgeIcon className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      disabled={statusUpdating === a.id}
                      onClick={() => setStatus(a, AnalysisStatus.CANCELLED)}
                      className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-indigo-600 disabled:opacity-50"
                      title="Cancelar"
                      aria-label="Cancelar"
                    >
                      <XCircleIcon className="h-5 w-5" />
                    </button>
                  </>
                )}
                <button
                  onClick={() => setToDelete(a)}
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
        title="Análisis"
        description="Diagnósticos, programación y resultados (FAMACHA, coprológico, etc.)"
        action={
          tab === "types" ? (
            <button
              onClick={openNewType}
              className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
            >
              <PlusIcon className="h-5 w-5" aria-hidden="true" />
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
                  <ClipboardDocumentCheckIcon className="h-5 w-5" aria-hidden="true" />
                  Registrar resultados
                </button>
              )}
              <button
                onClick={() => openBulk()}
                disabled={types.length === 0 || sheep.length === 0}
                className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
              >
                <PlusIcon className="h-5 w-5" aria-hidden="true" />
                Programar análisis
              </button>
            </div>
          )
        }
      />

      {treatment && (
        <div className="mb-4 flex flex-col gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2 text-sm text-amber-800">
            <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <p>
              <strong>{treatment.sheepTag}:</strong> {treatment.message} Tratamiento sugerido:{" "}
              <strong>{treatment.medicineName || labelMedicineType(treatment.medicineType)}</strong>
              {treatment.medicineName ? ` (${labelMedicineType(treatment.medicineType)})` : ""}.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={scheduleTreatment}
              className="inline-flex items-center gap-1.5 rounded-md bg-amber-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-amber-500"
            >
              Programar tratamiento
              <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              onClick={() => setTreatment(null)}
              className="rounded-md p-1.5 text-amber-700 hover:bg-amber-100"
              aria-label="Descartar"
            >
              <XCircleIcon className="h-5 w-5" />
            </button>
          </div>
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
                icon={BeakerIcon}
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
                      <PencilSquareIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setTypeToDelete(t)}
                      className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      aria-label={`Eliminar ${t.name}`}
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
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <ClockIcon className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
              <p className="text-sm text-gray-600">
                Programa análisis aquí. Cuando obtengas el resultado, registra el{" "}
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
                icon={ClipboardDocumentCheckIcon}
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
                icon={ClipboardDocumentCheckIcon}
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
        description="Define un tipo de diagnóstico para programar y registrar resultados."
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

      {/* Batch result drawer — record results for many scheduled analyses at once */}
      <Drawer
        open={batchOpen}
        onClose={() => setBatchOpen(false)}
        title="Registrar resultados"
        description="Captura el resultado de cada oveja con análisis pendiente."
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
              {batchResult.saved} resultado(s) guardado(s).
              {batchResult.needTreatment > 0
                ? ` ${batchResult.needTreatment} requiere(n) tratamiento — revísalos en el historial para programarlo.`
                : ""}
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
                          {(batchIsFamacha ? entry?.score != null : !!entry?.value.trim()) && (
                            <TextInput
                              aria-label={`Diagnóstico de ${sheepTag(a.sheepId)}`}
                              value={entry?.diagnosis ?? ""}
                              onChange={(e) => batchSetDiagnosis(a.id, e.target.value)}
                              placeholder="Diagnóstico (opcional)"
                            />
                          )}
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

      {/* Result drawer */}
      <Drawer
        open={!!resultTarget}
        onClose={() => setResultTarget(null)}
        title="Registrar resultado"
        description={
          resultTarget
            ? `${resultTarget.analysisType?.name ?? typeName(resultTarget.analysisTypeId)} → ${sheepTag(resultTarget.sheepId)}`
            : undefined
        }
        footer={
          <>
            <button
              type="button"
              onClick={() => setResultTarget(null)}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="result-form"
              disabled={savingResult}
              className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-60"
            >
              {savingResult && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              )}
              Guardar resultado
            </button>
          </>
        }
      >
        <form id="result-form" onSubmit={confirmResult} className="flex flex-col gap-4">
          {resultError && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{resultError}</div>
          )}
          <Field label="Fecha del resultado" required htmlFor="result-date">
            <TextInput
              id="result-date"
              type="date"
              value={resultForm.completedDate}
              onChange={(e) => setResultForm({ ...resultForm, completedDate: e.target.value })}
              required
            />
          </Field>

          {resultIsFamacha ? (
            <Field label="Puntaje FAMACHA (1–5)" required>
              <div className="flex flex-wrap items-center gap-2">
                {SCORES.map((s) => {
                  const styles = scoreButton[s]
                  const active = resultForm.famachaScore === s
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => selectScore(s)}
                      aria-pressed={active}
                      className={`flex h-11 w-11 items-center justify-center rounded-md border text-sm font-semibold transition ${
                        active ? styles.active : `bg-white ${styles.idle}`
                      }`}
                    >
                      {s}
                    </button>
                  )
                })}
                <span className="self-center text-xs text-gray-400">1–2 anemia · 4–5 saludable</span>
              </div>
            </Field>
          ) : (
            <Field label="Resultado" required htmlFor="result-value">
              <TextInput
                id="result-value"
                value={resultForm.resultValue}
                onChange={(e) => setResultForm({ ...resultForm, resultValue: e.target.value })}
                placeholder={resultTarget?.analysisType?.defaultUnit ? `Ej. 320 ${resultTarget.analysisType.defaultUnit}` : "Resultado del análisis"}
                required
              />
            </Field>
          )}

          <Field label="Diagnóstico" htmlFor="result-diagnosis">
            <TextInput
              id="result-diagnosis"
              value={resultForm.diagnosis}
              onChange={(e) => setResultForm({ ...resultForm, diagnosis: e.target.value, diagnosisTouched: true })}
              placeholder="Interpretación del resultado"
            />
          </Field>

          {liveRecommendation?.needsTreatment && (
            <div className="flex flex-col gap-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800">
              <div className="flex items-start gap-2">
                <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                <p>{liveRecommendation.message}</p>
              </div>
              {suggestedMeds.length > 0 ? (
                <Field label="Tratamiento sugerido" htmlFor="result-suggested-med">
                  <Select
                    id="result-suggested-med"
                    value={resultForm.suggestedMedicineId}
                    onChange={(e) =>
                      setResultForm({
                        ...resultForm,
                        suggestedMedicineId: e.target.value,
                        suggestedMedicineTouched: true,
                      })
                    }
                  >
                    <option value="">Sin sugerencia específica</option>
                    {suggestedMeds.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} — {labelMedicineType(m.type)}
                      </option>
                    ))}
                  </Select>
                </Field>
              ) : (
                <p className="text-xs text-amber-700">
                  No hay medicamentos en el catálogo para sugerir. Podrás programarlo manualmente al
                  guardar.
                </p>
              )}
              <p className="text-xs text-amber-700">
                Al guardar podrás programar la aplicación con un clic.
              </p>
            </div>
          )}

          <Field label="Notas" htmlFor="result-notes">
            <Textarea
              id="result-notes"
              rows={3}
              value={resultForm.notes}
              onChange={(e) => setResultForm({ ...resultForm, notes: e.target.value })}
              placeholder="Observaciones del análisis"
            />
          </Field>
        </form>
      </Drawer>

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
