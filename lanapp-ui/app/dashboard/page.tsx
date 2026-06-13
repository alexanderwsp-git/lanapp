import { DashboardLayout } from "@/components/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { StatCard } from "@/components/ui/stat-card"
import { StatusBadge } from "@/components/ui/status-badge"
import Link from "next/link"
import {
  Squares2X2Icon,
  HeartIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
  ArrowRightIcon,
  BellAlertIcon,
} from "@heroicons/react/24/outline"
import { sheepData, breedingData, weaningAlerts, statusColor, sheepDisplay } from "@/lib/mock-data"

export default function DashboardPage() {
  const total = sheepData.length
  const prenadas = sheepData.filter((s) => s.categoria.includes("preñada") || s.categoria === "Oveja preñada").length
  const maltonas = sheepData.filter((s) => s.categoria.includes("destetad")).length
  const proximasMontas = breedingData.filter((b) => b.status !== "Cancelado" && b.result === "Pendiente")

  return (
    <DashboardLayout>
      <PageHeader
        title="Dashboard"
        description="Resumen general de Granja San Alfonso"
        action={
          <Link
            href="/sheep"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            Ver ovejas
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total ovejas" value={total} icon={Squares2X2Icon} hint="Rebaño activo" />
        <StatCard label="Preñadas" value={prenadas} icon={HeartIcon} hint="En gestación" />
        <StatCard label="Maltonas" value={maltonas} icon={SparklesIcon} hint="Destetadas" />
        <StatCard
          label="Alertas destete"
          value={weaningAlerts.length}
          icon={ExclamationTriangleIcon}
          hint="Listas para destetar"
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Próximas montas */}
        <div className="rounded-lg bg-white p-6 shadow lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Montas pendientes de revisión</h2>
            <Link
              href="/planner"
              className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              Ver planificador
              <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <ul className="mt-4 flex flex-col divide-y divide-gray-100">
            {proximasMontas.map((b) => (
              <li key={b.id} className="flex items-center gap-4 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
                  <CalendarDaysIcon className="h-5 w-5 text-indigo-600" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">{sheepDisplay(b.eweId)}</p>
                      <p className="truncate text-xs text-gray-500">Carnero: {b.ramId ? sheepDisplay(b.ramId) : "Sin asignar"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-700">{b.matingDate}</p>
                      <StatusBadge color={statusColor[b.result]}>{b.result}</StatusBadge>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Alertas de destete */}
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Alertas de destete</h2>
            <Link href="/weaning" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
              Ver
            </Link>
          </div>
          <ul className="mt-4 flex flex-col gap-3">
            {weaningAlerts.map((w) => (
              <li key={w.id} className="flex items-center gap-3 rounded-md bg-yellow-50 p-3">
                <BellAlertIcon className="h-5 w-5 shrink-0 text-yellow-600" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {w.arete} · {w.nombre}
                  </p>
                  <p className="text-xs text-gray-600">
                    {w.edadDias} días · {w.peso} kg
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </DashboardLayout>
  )
}
