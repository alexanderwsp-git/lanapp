"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { isAuthenticatedClient } from "@/lib/auth/session"
import { useAuth } from "@/lib/auth/use-auth"

const rolLabel: Record<string, string> = {
  admin: "Administrador",
  veterinario: "Veterinario",
  operario: "Operario",
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !isAuthenticatedClient()) {
      router.replace("/login?next=/profile")
    }
  }, [loading, router])

  return (
    <DashboardLayout>
      <PageHeader
        title="Mi perfil"
        description="Datos de tu cuenta en Lanapp"
      />

      {loading ? (
        <p className="text-sm text-gray-500">Cargando…</p>
      ) : !user ? (
        <p className="text-sm text-gray-500">No hay sesión activa.</p>
      ) : (
        <div className="mx-auto max-w-lg rounded-lg bg-white p-6 shadow">
          <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-lg font-semibold text-white">
              {user.initials}
            </span>
            <div>
              <p className="text-lg font-semibold text-gray-900">{user.displayName}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>

          <dl className="mt-6 divide-y divide-gray-100">
            <div className="flex justify-between py-3 text-sm">
              <dt className="text-gray-500">Email</dt>
              <dd className="font-medium text-gray-900">{user.email}</dd>
            </div>
            <div className="flex justify-between py-3 text-sm">
              <dt className="text-gray-500">Usuario (login)</dt>
              <dd className="font-medium text-gray-900">{user.username}</dd>
            </div>
            <div className="flex justify-between py-3 text-sm">
              <dt className="text-gray-500">Rol</dt>
              <dd className="font-medium text-gray-900">
                {rolLabel[user.roles[0] ?? "operario"] ?? user.roles[0]}
              </dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/forgot-password"
              className="inline-flex justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cambiar contraseña
            </Link>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
