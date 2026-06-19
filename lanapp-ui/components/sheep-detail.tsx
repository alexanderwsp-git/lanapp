"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  PencilSquareIcon,
  ClipboardDocumentListIcon,
  ScaleIcon,
  BeakerIcon,
  ArrowRightCircleIcon,
} from "@heroicons/react/24/outline"
  import { StatusBadge } from "@/components/ui/status-badge"
  import { DataTable } from "@/components/ui/data-table"
import { SheepPesosTab } from "@/components/sheep-pesos-tab"
import { SheepMontasTab } from "@/components/sheep-montas-tab"
import { SheepReproStats } from "@/components/sheep-repro-stats"
import { SheepFamachaTab } from "@/components/sheep-famacha-tab"
import { SheepGenealogy } from "@/components/sheep-genealogy"
import { SheepFormDrawer } from "@/components/sheep-form-drawer"
import type { ApiSheep, ApiMedicineApplication } from "@/lib/api/types"
import { fetchWeaningRecordsBySheep, type ApiWeaningRecord } from "@/lib/api/weaning"
import { fetchMedicineApplicationsBySheep } from "@/lib/api/medicine"
import { labelMedicineStatus, labelMedicineType, medicineStatusColor } from "@/lib/labels/medicine"
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
  { id: "famacha", label: "FAMACHA" },
] as const

export function SheepDetail({ sheep, onRefresh }: { sheep: ApiSheep; onRefresh?: () => void | Promise<void> }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("general")
  const [weaningRecords, setWeaningRecords] = useState<ApiWeaningRecord[]>([])
  const [weaningLoading, setWeaningLoading] = useState(true)
  const [medApps, setMedApps] = useState<ApiMedicineApplication[]>([])
  const [medLoading, setMedLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)

  // Support deep-link redirects from the legacy /sheep/[id]/edit route.
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

  useEffect(() => {
    let cancelled = false
    setWeaningLoading(true)
    fetchWeaningRecordsBySheep(sheep.id)
      .then((records) => {
        if (!cancelled) setWeaningRecords(records)
      })
      .catch(() => {
        if (!cancelled) setWeaningRecords([])
      })
      .finally(() => {
        if (!cancelled) setWeaningLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [sheep.id])

  useEffect(() => {
    let cancelled = false
    setMedLoading(true)
    fetchMedicineApplicationsBySheep(sheep.id)
      .then((apps) => {
        if (!cancelled) {
          const sorted = [...apps].sort(
            (a, b) => new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime(),
          )
          setMedApps(sorted)
        }
      })
      .catch(() => {
        if (!cancelled) setMedApps([])
      })
      .finally(() => {
        if (!cancelled) setMedLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [sheep.id])

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
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            <PencilSquareIcon className="h-5 w-5" aria-hidden="true" />
            Editar
          </button>
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
              {sheep.isBreedingRam && (
                <span className="text-xs text-gray-500">Flag activo en Editar</span>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-600">{repro.hint}</p>
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

              <SheepGenealogy sheep={sheep} />

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
                    loading={weaningLoading}
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

              <div className="rounded-lg bg-white p-6 shadow">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900">
                    <BeakerIcon className="h-5 w-5 text-gray-400" />
                    Historial de medicina
                  </h3>
                  <Link
                    href="/medicines"
                    className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    Programar aplicación
                    <ArrowRightCircleIcon className="h-4 w-4" />
                  </Link>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Aplicaciones de fármacos y vacunas registradas para esta oveja.
                </p>
                <div className="mt-4">
                  <DataTable
                    bare
                    hideFooter
                    rows={medApps}
                    rowKey={(a) => a.id}
                    loading={medLoading}
                    loadingText="Cargando aplicaciones…"
                    empty={<p className="text-sm text-gray-500">Sin aplicaciones registradas.</p>}
                    columns={[
                      { key: "date", header: "Fecha", className: "whitespace-nowrap text-gray-900", cell: (a) => formatDisplayDate(a.applicationDate) },
                      { key: "medicine", header: "Medicamento", className: "whitespace-nowrap", cell: (a) => a.medicine?.name || "—" },
                      {
                        key: "type",
                        header: "Tipo",
                        className: "whitespace-nowrap",
                        cell: (a) => (a.medicine?.type ? labelMedicineType(a.medicine.type) : "—"),
                      },
                      {
                        key: "status",
                        header: "Estado",
                        className: "whitespace-nowrap",
                        cell: (a) => (
                          <StatusBadge color={medicineStatusColor[a.status] ?? "gray"}>
                            {labelMedicineStatus(a.status)}
                          </StatusBadge>
                        ),
                      },
                      { key: "notes", header: "Notas", cell: (a) => a.notes || "—" },
                    ]}
                  />
                </div>
              </div>
            </div>
          )}

          {tab === "peso" && <SheepPesosTab sheepId={sheep.id} />}

          {tab === "montas" && (
            <div className="flex flex-col gap-6">
              <SheepReproStats sheep={sheep} />
              <SheepMontasTab sheep={sheep} onUpdated={onRefresh} />
            </div>
          )}

          {tab === "famacha" && <SheepFamachaTab sheepId={sheep.id} />}
        </div>
      </div>

      <SheepFormDrawer
        open={editOpen}
        onClose={() => setEditOpen(false)}
        mode="edit"
        initial={sheep}
        onSaved={() => onRefresh?.()}
      />
    </div>
  )
}
