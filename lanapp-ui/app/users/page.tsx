import { DashboardLayout } from "@/components/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { StatusBadge } from "@/components/ui/status-badge"
import { PlusIcon } from "@heroicons/react/24/outline"

type Usuario = {
  id: string
  nombre: string
  email: string
  rol: "Administrador" | "Operario" | "Veterinario"
  estado: "Activo" | "Inactivo"
  iniciales: string
}

const usuarios: Usuario[] = [
  { id: "1", nombre: "Alfonso Suárez", email: "alfonso@sanalfonso.ec", rol: "Administrador", estado: "Activo", iniciales: "AS" },
  { id: "2", nombre: "María Caiza", email: "maria@sanalfonso.ec", rol: "Veterinario", estado: "Activo", iniciales: "MC" },
  { id: "3", nombre: "Jorge Tenesaca", email: "jorge@sanalfonso.ec", rol: "Operario", estado: "Activo", iniciales: "JT" },
  { id: "4", nombre: "Lucía Pérez", email: "lucia@sanalfonso.ec", rol: "Operario", estado: "Inactivo", iniciales: "LP" },
]

const rolColor: Record<Usuario["rol"], "indigo" | "blue" | "gray"> = {
  Administrador: "indigo",
  Veterinario: "blue",
  Operario: "gray",
}

export default function UsersPage() {
  return (
    <DashboardLayout>
      <PageHeader
        title="Usuarios"
        description="Gestiona el acceso del equipo de la granja"
        action={
          <button className="flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
            <PlusIcon className="h-4 w-4" aria-hidden="true" />
            Invitar usuario
          </button>
        }
      />

      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {["Usuario", "Email", "Rol", "Estado"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {usuarios.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
                        {u.iniciales}
                      </span>
                      <span className="text-sm font-medium text-gray-900">{u.nombre}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{u.email}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <StatusBadge color={rolColor[u.rol]}>{u.rol}</StatusBadge>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <StatusBadge color={u.estado === "Activo" ? "green" : "gray"}>{u.estado}</StatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  )
}
