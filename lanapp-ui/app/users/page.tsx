"use client"

import { useCallback, useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { StatusBadge } from "@/components/ui/status-badge"
import { PlusIcon } from "@heroicons/react/24/outline"
import { LANAPP_ROLES, type LanappRole } from "@/lib/auth/constants"
import { getAccessToken } from "@/lib/auth/session"

type Usuario = {
  id: string
  email: string
  username: string
  roles: string[]
  status: string
  initials: string
}

const rolLabel: Record<string, string> = {
  admin: "Administrador",
  veterinario: "Veterinario",
  operario: "Operario",
}

const rolColor: Record<string, "indigo" | "blue" | "gray"> = {
  admin: "indigo",
  veterinario: "blue",
  operario: "gray",
}

export default function UsersPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const token = getAccessToken()
      const res = await fetch("/api/admin/users", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const body = await res.json()
      if (!res.ok || !body.success) {
        throw new Error(body.error || "No se pudieron cargar los usuarios")
      }
      setUsuarios(body.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  async function handleInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setInviteError(null)
    setInviteLoading(true)
    const form = new FormData(e.currentTarget)
    const email = String(form.get("email") || "").trim()
    const role = String(form.get("role") || "") as LanappRole
    const preferredUsername = String(form.get("preferredUsername") || "").trim()

    try {
      const token = getAccessToken()
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          email,
          role,
          preferredUsername: preferredUsername || undefined,
        }),
      })
      const body = await res.json()
      if (!res.ok || !body.success) {
        throw new Error(body.error || "No se pudo invitar al usuario")
      }
      setShowInvite(false)
      await loadUsers()
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Error")
    } finally {
      setInviteLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Usuarios"
        description="Gestiona el acceso del equipo de la granja"
        action={
          <button
            type="button"
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            <PlusIcon className="h-4 w-4" aria-hidden="true" />
            Invitar usuario
          </button>
        }
      />

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {["Usuario", "Email", "Rol", "Estado"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                    Cargando…
                  </td>
                </tr>
              ) : usuarios.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                    No hay usuarios con acceso a Lanapp
                  </td>
                </tr>
              ) : (
                usuarios.map((u) => {
                  const primaryRole = u.roles[0] ?? "operario"
                  return (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
                            {u.initials || "?"}
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {u.username || u.email}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{u.email}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <StatusBadge color={rolColor[primaryRole] ?? "gray"}>
                          {rolLabel[primaryRole] ?? primaryRole}
                        </StatusBadge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <StatusBadge color={u.status === "Activo" ? "green" : "gray"}>
                          {u.status}
                        </StatusBadge>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900">Invitar usuario</h2>
            <p className="mt-1 text-sm text-gray-500">
              Cognito enviará un email con contraseña temporal
            </p>
            <form className="mt-6 flex flex-col gap-4" onSubmit={handleInvite}>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  name="email"
                  type="email"
                  required
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Usuario (opcional)
                </label>
                <input
                  name="preferredUsername"
                  type="text"
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="maria.t"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Rol</label>
                <select
                  name="role"
                  required
                  defaultValue="operario"
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  {LANAPP_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {rolLabel[r]}
                    </option>
                  ))}
                </select>
              </div>
              {inviteError && <p className="text-sm text-red-600">{inviteError}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInvite(false)}
                  className="rounded-md px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
                >
                  {inviteLoading ? "Enviando…" : "Enviar invitación"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
