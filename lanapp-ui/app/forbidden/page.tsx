"use client"

import Link from "next/link"
import { ShieldExclamationIcon } from "@heroicons/react/24/outline"
import { DashboardLayout } from "@/components/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"

export default function ForbiddenPage() {
  return (
    <DashboardLayout>
      <PageHeader title="Acceso restringido" description="No tienes permiso para ver esta página" />

      <div className="mx-auto max-w-md rounded-lg bg-white p-8 text-center shadow">
        <ShieldExclamationIcon className="mx-auto h-12 w-12 text-amber-500" aria-hidden="true" />
        <h2 className="mt-4 text-lg font-semibold text-gray-900">No tienes permiso</h2>
        <p className="mt-2 text-sm text-gray-600">
          Esta sección está reservada para administradores. Si crees que deberías tener acceso, contacta al
          responsable de la granja.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          Volver al dashboard
        </Link>
      </div>
    </DashboardLayout>
  )
}
