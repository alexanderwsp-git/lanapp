"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { StatCard } from "@/components/ui/stat-card"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { EmptyState } from "@/components/ui/empty-state"
import { StatusBadge } from "@/components/ui/status-badge"
import { weaningAlerts, type WeaningAlert } from "@/lib/mock-data"
import { BellAlertIcon, CheckCircleIcon, ScaleIcon } from "@heroicons/react/24/outline"

export default function WeaningPage() {
  const [rows, setRows] = useState<WeaningAlert[]>(weaningAlerts)
  const [toWean, setToWean] = useState<WeaningAlert | null>(null)
  const [processing, setProcessing] = useState(false)

  function confirmWean() {
    if (!toWean) return
    setProcessing(true)
    setTimeout(() => {
      setRows((prev) => prev.filter((r) => r.id !== toWean.id))
      setProcessing(false)
      setToWean(null)
    }, 700)
  }

  const avgWeight = rows.length ? (rows.reduce((acc, r) => acc + r.peso, 0) / rows.length).toFixed(1) : "0"

  return (
    <DashboardLayout>
      <PageHeader
        title="Alertas de destete"
        description="Corderos que superan el umbral de 70 días listos para destetar"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Alertas activas" value={rows.length} icon={BellAlertIcon} hint="Listos para destetar" />
        <StatCard label="Peso promedio" value={`${avgWeight} kg`} icon={ScaleIcon} hint="De los corderos en alerta" />
        <StatCard label="Umbral destete" value="70 días" icon={CheckCircleIcon} hint="Configurable en Ajustes" />
      </div>

      <div className="mt-6 overflow-hidden rounded-lg bg-white shadow">
        {rows.length === 0 ? (
          <EmptyState
            icon={CheckCircleIcon}
            title="Sin alertas de destete"
            description="No hay corderos pendientes de destete en este momento."
          />
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {["Arete", "Nombre", "Edad (días)", "Peso (kg)", "Estado", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((w) => (
                <tr key={w.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">{w.arete}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{w.nombre}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{w.edadDias}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{w.peso}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <StatusBadge color="yellow">Pendiente destete</StatusBadge>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button
                      onClick={() => setToWean(w)}
                      className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
                    >
                      <CheckCircleIcon className="h-4 w-4" aria-hidden="true" />
                      Destetar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmDialog
        open={!!toWean}
        title="Confirmar destete"
        message={`¿Marcar a ${toWean?.arete} (${toWean?.nombre}) como destetado? Pasará a categoría maltón/maltona.`}
        confirmLabel="Destetar"
        loading={processing}
        onConfirm={confirmWean}
        onClose={() => setToWean(null)}
      />
    </DashboardLayout>
  )
}
