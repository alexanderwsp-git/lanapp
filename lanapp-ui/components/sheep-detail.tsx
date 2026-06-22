"use client"

import { useEffect, useRef, useState } from "react"
import {
  PencilSquareIcon,
  ClipboardDocumentListIcon,
  ScaleIcon,
} from "@heroicons/react/24/outline"
import { Gender } from "@sheep/domain"
import { StatusBadge } from "@/components/ui/status-badge"
import { DataTable } from "@/components/ui/data-table"
import { SheepPesosTab } from "@/components/sheep-pesos-tab"
import { SheepMontasTab } from "@/components/sheep-montas-tab"
import { SheepReproStats } from "@/components/sheep-repro-stats"
import { SheepMedicineTab } from "@/components/sheep-medicine-tab"
import { SheepAnalysisTab } from "@/components/sheep-analysis-tab"
import { SheepWeaningAction } from "@/components/sheep-weaning-action"
import { SheepWeightSummary } from "@/components/sheep-weight-summary"
import { SheepGenealogy } from "@/components/sheep-genealogy"
import { SheepFormDrawer } from "@/components/sheep-form-drawer"
import { SheepMedicineSummary } from "@/components/sheep-medicine-summary"
import { SheepAnalysisSummary } from "@/components/sheep-analysis-summary"
import { SwitchField } from "@/components/ui/switch"
import type { ApiAnalysis } from "@/lib/analysis/types"
import type { ApiSheepFamily } from "@/lib/api/sheep"
import type { ApiMedicineApplication, ApiSheep } from "@/lib/api/types"
import { updateSheep } from "@/lib/api/sheep"
import type { ApiWeaningRecord } from "@/lib/api/weaning"
import type { ApiWeight } from "@/lib/api/weight"
import { formatDisplayDate, formatAgeDays, formatDailyGain, formatLastWeight } from "@/lib/format"
import { reproductorStatus } from "@/lib/reproductor-status"
import {
  labelCategory,
  labelGender,
  labelRecordType,
  labelStatus,
  statusColor,
} from "@/lib/labels/sheep"

const TABS = [
  { id: "general", label: "General" },
  { id: "peso", label: "Pesos" },
  { id: "montas", label: "Montas" },
  { id: "medicina", label: "Medicina" },
  { id: "analisis", label: "Análisis" },
] as const

export function SheepDetail({
  sheep,
  family,
  weaningRecords,
  weightRecords,
  weightError,
  setWeightRecords,
  medicineApplications,
  analyses,
  offspring,
  onRefreshSheep,
  onRefreshFamily,
  onRefreshWeaning,
  onRefreshWeights,
  onRefreshMedicine,
  onRefreshAnalyses,
}: {
  sheep: ApiSheep
  family: ApiSheepFamily | null
  weaningRecords: ApiWeaningRecord[]
  weightRecords: ApiWeight[]
  weightError: string | null
  setWeightRecords: React.Dispatch<React.SetStateAction<ApiWeight[]>>
  medicineApplications: ApiMedicineApplication[]
  analyses: ApiAnalysis[]
  offspring: ApiSheep[]
  onRefreshSheep: () => Promise<void>
  onRefreshFamily: () => Promise<void>
  onRefreshWeaning: () => Promise<void>
  onRefreshWeights: () => Promise<void>
  onRefreshMedicine: () => Promise<void>
  onRefreshAnalyses: () => Promise<void>
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("general")
  const [editOpen, setEditOpen] = useState(false)
  const [reproSaving, setReproSaving] = useState(false)
  const [reproError, setReproError] = useState<string | null>(null)
  const reproStatsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("edit") === "1") {
      setEditOpen(true)
      window.history.replaceState(null, "", `/sheep/${sheep.id}`)
    }
  }, [sheep.id])

  const statusLabel = labelStatus(sheep.status)
  const locationName = sheep.currentLocation?.name ?? "—"
  const repro = reproductorStatus(sheep)

  async function handleWeaned() {
    await Promise.all([onRefreshWeaning(), onRefreshSheep()])
  }

  async function handleMedicineUpdated() {
    await Promise.all([onRefreshMedicine(), onRefreshSheep()])
  }

  async function handleAnalysisUpdated() {
    await Promise.all([onRefreshAnalyses(), onRefreshSheep()])
  }

  async function toggleBreedingRam(checked: boolean) {
    setReproError(null)
    setReproSaving(true)
    try {
      await updateSheep(sheep.id, { isBreedingRam: checked })
      await onRefreshSheep()
    } catch (err) {
      setReproError(err instanceof Error ? err.message : "No se pudo actualizar el reproductor")
    } finally {
      setReproSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{sheep.name || sheep.tag}</h2>
            <p className="mt-1 text-sm text-gray-500">
              Arete {sheep.tag} · {sheep.breed}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <SheepWeaningAction
              sheep={sheep}
              weaningRecords={weaningRecords}
              weaningLoading={false}
              onWeaned={handleWeaned}
            />
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              <PencilSquareIcon className="h-5 w-5" aria-hidden="true" />
              Editar
            </button>
          </div>
        </div>
        <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">Categoría</dt>
            <dd className="mt-1">
              <StatusBadge color="indigo">{labelCategory(sheep.category)}</StatusBadge>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">Estado</dt>
            <dd className="mt-1">
              <StatusBadge color={statusColor[statusLabel] ?? statusColor[sheep.status] ?? "gray"}>
                {statusLabel}
              </StatusBadge>
            </dd>
          </div>
          {[
            { label: "Sexo", value: labelGender(sheep.gender) },
            { label: "Último peso", value: formatLastWeight(sheep) },
            { label: "Nacimiento", value: formatDisplayDate(sheep.birthDate) },
            { label: "Edad", value: formatAgeDays(sheep.birthDate) },
            { label: "Ubicación", value: locationName },
          ].map((item) => (
            <div key={item.label}>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">{item.label}</dt>
              <dd className="mt-1 text-sm font-medium text-gray-900">{item.value}</dd>
            </div>
          ))}
        </dl>
        {sheep.isPregnant && (
          <div className="mt-4 rounded-md bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-700">
            Oveja preñada
            {sheep.pregnancyConfirmedAt
              ? ` · confirmada ${formatDisplayDate(sheep.pregnancyConfirmedAt)}`
              : ""}
          </div>
        )}
        {repro && (
          <div className="mt-4 rounded-md border border-gray-200 bg-gray-50 px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-gray-400">Reproductor</span>
              <StatusBadge color={repro.badgeColor}>{repro.label}</StatusBadge>
              {sheep.breedingRamMarkedAt && (
                <span className="text-xs text-gray-500">
                  Marcado {formatDisplayDate(sheep.breedingRamMarkedAt)}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-600">{repro.hint}</p>
            {sheep.gender === Gender.MALE && (
              <div className="mt-3 border-t border-gray-200 pt-3">
                <SwitchField
                  label="Marcar como reproductor"
                  description="Carnero seleccionado para monta. Aplica categoría Reproductor cuando tenga ≥12 meses."
                  checked={sheep.isBreedingRam === true}
                  onChange={toggleBreedingRam}
                  disabled={reproSaving}
                  aria-label="Marcar como reproductor"
                />
                {reproError && (
                  <p className="mt-2 text-sm text-red-600">{reproError}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex gap-6" aria-label="Pestañas">
            {TABS.map((t) => (
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
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-6">
          {tab === "general" && (
            <div className="flex flex-col gap-6">
              <SheepWeightSummary records={weightRecords} loading={false} compact />

              <div className="rounded-lg bg-white p-6 shadow">
                <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900">
                  <ClipboardDocumentListIcon className="h-5 w-5 text-gray-400" />
                  Información de registro
                </h3>
                <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">Tipo de registro</dt>
                    <dd className="mt-1 text-sm text-gray-900">{labelRecordType(sheep.recordType)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">Notas</dt>
                    <dd className="mt-1 text-sm text-gray-900">{sheep.notes || "Sin notas registradas."}</dd>
                  </div>
                </dl>
              </div>

              <SheepGenealogy sheep={sheep} family={family} loading={false} />

              <div className="rounded-lg bg-white p-6 shadow">
                <SheepMedicineSummary
                  sheepId={sheep.id}
                  applications={medicineApplications}
                  onViewTab={() => setTab("medicina")}
                />
              </div>

              <div className="rounded-lg bg-white p-6 shadow">
                <SheepAnalysisSummary
                  sheepId={sheep.id}
                  records={analyses}
                  onViewTab={() => setTab("analisis")}
                />
              </div>

              <div className="rounded-lg bg-white p-6 shadow">
                <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900">
                  <ScaleIcon className="h-5 w-5 text-gray-400" />
                  Historial de destete
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Registro oficial de destete. El mismo peso también aparece en la pestaña Pesos.
                </p>
                <div className="mt-4">
                  <DataTable
                    bare
                    hideFooter
                    rows={weaningRecords}
                    rowKey={(r) => r.id}
                    loading={false}
                    loadingText="Cargando destetes…"
                    empty={<p className="text-sm text-gray-500">Sin registro de destete.</p>}
                    columns={[
                      { key: "date", header: "Fecha", className: "whitespace-nowrap text-gray-900", cell: (r) => formatDisplayDate(r.weaningDate) },
                      { key: "weight", header: "Peso destete (kg)", className: "whitespace-nowrap", cell: (r) => Number(r.weaningWeight) },
                      {
                        key: "gain",
                        header: "Ganancia prom. (g/día)",
                        className: "whitespace-nowrap",
                        cell: (r) => formatDailyGain(r.dailyGain != null ? Number(r.dailyGain) : null),
                      },
                      { key: "lot", header: "Lote", className: "whitespace-nowrap", cell: (r) => r.lotId || "—" },
                      { key: "notes", header: "Notas", cell: (r) => r.notes || "—" },
                    ]}
                  />
                </div>
              </div>

              <div ref={reproStatsRef}>
                <SheepReproStats
                  sheep={sheep}
                  offspring={offspring}
                  loadWhenVisible
                  visibleRef={reproStatsRef}
                />
              </div>
            </div>
          )}

          {tab === "peso" && (
            <SheepPesosTab
              sheep={sheep}
              records={weightRecords}
              loading={false}
              loadError={weightError}
              reload={onRefreshWeights}
              setRecords={setWeightRecords}
            />
          )}

          {tab === "montas" && (
            <SheepMontasTab
              sheep={sheep}
              offspring={offspring}
              onUpdated={onRefreshSheep}
            />
          )}

          {tab === "medicina" && (
            <SheepMedicineTab
              sheep={sheep}
              applications={medicineApplications}
              onUpdated={handleMedicineUpdated}
            />
          )}

          {tab === "analisis" && (
            <SheepAnalysisTab
              sheep={sheep}
              analyses={analyses}
              medicineApplications={medicineApplications}
              onUpdated={handleAnalysisUpdated}
            />
          )}
        </div>
      </div>

      <SheepFormDrawer
        open={editOpen}
        onClose={() => setEditOpen(false)}
        mode="edit"
        initial={sheep}
        onSaved={async () => {
          await Promise.all([onRefreshFamily(), onRefreshSheep()])
        }}
      />
    </div>
  )
}
