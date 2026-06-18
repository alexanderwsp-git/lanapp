"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { SheepCategory } from "@sheep/domain"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { fetchLocationById } from "@/lib/api/location"
import { fetchSheep } from "@/lib/api/sheep"
import type { ApiLocation, ApiSheep } from "@/lib/api/types"
import { labelCategory, labelStatus, statusColor } from "@/lib/labels/sheep"
import { MapPinIcon, Squares2X2Icon } from "@heroicons/react/24/outline"

export default function LocationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [location, setLocation] = useState<ApiLocation | null>(null)
  const [assigned, setAssigned] = useState<ApiSheep[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    Promise.all([fetchLocationById(id), fetchSheep({ locationId: id, limit: 200 })])
      .then(([loc, sheepResult]) => {
        if (!cancelled) {
          setLocation(loc)
          setAssigned(sheepResult.items)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setLocation(null)
          setAssigned([])
          setError(err instanceof Error ? err.message : "No se pudo cargar la ubicación")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) {
    return (
      <DashboardLayout>
        <p className="text-sm text-gray-500">Cargando ubicación…</p>
      </DashboardLayout>
    )
  }

  if (error || !location) {
    return (
      <DashboardLayout>
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error ?? "Ubicación no encontrada"}
          <Link href="/locations" className="ml-2 font-semibold underline">
            Volver
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <Breadcrumb items={[{ label: "Ubicaciones", href: "/locations" }, { label: location.name }]} />

      <div className="rounded-lg bg-white p-6 shadow">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-50">
            <MapPinIcon className="h-6 w-6 text-indigo-600" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{location.name}</h1>
            <p className="text-sm text-gray-500">{location.address}</p>
          </div>
        </div>
        <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Latitud", value: location.latitude != null ? String(location.latitude) : "—" },
            { label: "Longitud", value: location.longitude != null ? String(location.longitude) : "—" },
            { label: "Ovejas asignadas", value: String(assigned.length) },
            { label: "Descripción", value: location.description || "—" },
          ].map((item) => (
            <div key={item.label}>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">{item.label}</dt>
              <dd className="mt-1 text-sm font-medium text-gray-900">{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <h2 className="mt-8 text-base font-semibold text-gray-900">Ovejas en esta ubicación</h2>
      <div className="mt-3 overflow-hidden rounded-lg bg-white shadow">
        {assigned.length === 0 ? (
          <EmptyState icon={Squares2X2Icon} title="Sin ovejas" description="No hay ovejas asignadas a este potrero." />
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {["Arete", "Nombre", "Categoría", "Estado"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {assigned.map((s) => {
                const statusLabel = labelStatus(s.status)
                return (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-indigo-600">
                      <Link href={`/sheep/${s.id}`}>{s.tag}</Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{s.name ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{labelCategory(s.category as SheepCategory)}</td>
                    <td className="px-4 py-3 text-sm">
                      <StatusBadge color={statusColor[statusLabel] ?? statusColor[s.status] ?? "gray"}>
                        {statusLabel}
                      </StatusBadge>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </DashboardLayout>
  )
}
