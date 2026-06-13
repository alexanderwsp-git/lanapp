import { notFound } from "next/navigation"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { getUbicacion, sheepData, statusColor } from "@/lib/mock-data"
import { MapPinIcon, Squares2X2Icon } from "@heroicons/react/24/outline"

export default async function LocationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const u = getUbicacion(id)
  if (!u) notFound()

  const assigned = sheepData.filter((s) => s.ubicacion === u.nombre)

  return (
    <DashboardLayout>
      <Breadcrumb items={[{ label: "Ubicaciones", href: "/locations" }, { label: u.nombre }]} />

      <div className="rounded-lg bg-white p-6 shadow">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-50">
            <MapPinIcon className="h-6 w-6 text-indigo-600" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{u.nombre}</h1>
            <p className="text-sm text-gray-500">{u.direccion}</p>
          </div>
        </div>
        <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Latitud", value: u.latitud },
            { label: "Longitud", value: u.longitud },
            { label: "Ovejas asignadas", value: assigned.length.toString() },
            { label: "Descripción", value: u.descripcion || "—" },
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
              {assigned.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-indigo-600">
                    <Link href={`/sheep/${s.id}`}>{s.arete}</Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{s.nombre}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{s.categoria}</td>
                  <td className="px-4 py-3 text-sm">
                    <StatusBadge color={statusColor[s.estado]}>{s.estado}</StatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DashboardLayout>
  )
}
