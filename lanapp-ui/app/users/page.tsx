"use client"

import { useCallback, useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { InviteUserDrawer } from "@/components/invite-user-drawer"
import { RequireRole } from "@/components/require-role"
import { PageHeader } from "@/components/ui/page-header"
import { StatusBadge } from "@/components/ui/status-badge"
import { DataTable } from "@/components/ui/data-table"
import { PlusIcon } from "@heroicons/react/24/outline"
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

function UsersPageContent() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)

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

  return (
    <DashboardLayout>
      <PageHeader
        title="Usuarios"
        description="Gestiona el acceso del equipo de la granja"
        action={
          <button
            type="button"
            onClick={() => setInviteOpen(true)}
            className="flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            <PlusIcon className="h-4 w-4" aria-hidden="true" />
            Invitar usuario
          </button>
        }
      />

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <DataTable
        rows={usuarios}
        rowKey={(u) => u.id}
        loading={loading}
        empty={
          <p className="p-8 text-center text-sm text-gray-500">No hay usuarios con acceso a Lanapp</p>
        }
        columns={[
          {
            key: "user",
            header: "Usuario",
            className: "whitespace-nowrap",
            cell: (u) => (
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
                  {u.initials || "?"}
                </span>
                <span className="text-sm font-medium text-gray-900">{u.username || u.email}</span>
              </div>
            ),
          },
          { key: "email", header: "Email", className: "whitespace-nowrap", cell: (u) => u.email },
          {
            key: "role",
            header: "Rol",
            className: "whitespace-nowrap",
            cell: (u) => {
              const primaryRole = u.roles[0] ?? "operario"
              return (
                <StatusBadge color={rolColor[primaryRole] ?? "gray"}>
                  {rolLabel[primaryRole] ?? primaryRole}
                </StatusBadge>
              )
            },
          },
          {
            key: "status",
            header: "Estado",
            className: "whitespace-nowrap",
            cell: (u) => (
              <StatusBadge color={u.status === "Activo" ? "green" : "gray"}>{u.status}</StatusBadge>
            ),
          },
        ]}
      />

      <InviteUserDrawer
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvited={loadUsers}
      />
    </DashboardLayout>
  )
}

export default function UsersPage() {
  return (
    <RequireRole role="admin">
      <UsersPageContent />
    </RequireRole>
  )
}
