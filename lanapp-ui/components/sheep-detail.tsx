"use client"

import { useState } from "react"
import Link from "next/link"
import { Gender } from "@sheep/domain"
import { StatusBadge } from "@/components/ui/status-badge"
import { ClipboardDocumentListIcon } from "@heroicons/react/24/outline"
import { SheepPesosTab } from "@/components/sheep-pesos-tab"
import { SheepMontasTab } from "@/components/sheep-montas-tab"
import { SheepFamachaTab } from "@/components/sheep-famacha-tab"
import type { ApiSheep } from "@/lib/api/types"
import { toDateInputValue } from "@/lib/format"
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

export function SheepDetail({ sheep }: { sheep: ApiSheep }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("general")
  const statusLabel = labelStatus(sheep.status)
  const locationName = sheep.currentLocation?.name ?? "—"

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900">{sheep.name || sheep.tag}</h2>
              <StatusBadge color={statusColor[statusLabel] ?? statusColor[sheep.status] ?? "gray"}>
                {statusLabel}
              </StatusBadge>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Arete {sheep.tag} · {sheep.breed} · {labelCategory(sheep.category)}
            </p>
          </div>
          <Link
            href={`/sheep/${sheep.id}/edit`}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Editar
          </Link>
        </div>
        <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Sexo", value: labelGender(sheep.gender) },
            { label: "Peso actual", value: `${Number(sheep.weight)} kg` },
            { label: "Nacimiento", value: toDateInputValue(sheep.birthDate) || "—" },
            { label: "Ubicación", value: locationName },
          ].map((item) => (
            <div key={item.label}>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">{item.label}</dt>
              <dd className="mt-1 text-sm font-medium text-gray-900">{item.value}</dd>
            </div>
          ))}
        </dl>
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
          )}

          {tab === "peso" && <SheepPesosTab />}

          {tab === "montas" && (
            <SheepMontasTab sheepId={sheep.id} gender={sheep.gender as Gender} />
          )}

          {tab === "famacha" && <SheepFamachaTab />}
        </div>
      </div>
    </div>
  )
}
