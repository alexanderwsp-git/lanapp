"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { SheepForm } from "@/components/sheep-form"
import { fetchSheepById } from "@/lib/api/sheep"
import type { ApiSheep } from "@/lib/api/types"

export default function EditSheepPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [sheep, setSheep] = useState<ApiSheep | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchSheepById(id)
      .then((data) => {
        if (!cancelled) setSheep(data)
      })
      .catch((err) => {
        if (!cancelled) {
          setSheep(null)
          setError(err instanceof Error ? err.message : "No se pudo cargar la oveja")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  return (
    <DashboardLayout>
      <Breadcrumb
        items={[
          { label: "Ovejas", href: "/sheep" },
          { label: loading ? "…" : sheep?.tag ?? "No encontrada", href: sheep ? `/sheep/${sheep.id}` : undefined },
          { label: "Editar" },
        ]}
      />

      {loading && <p className="text-sm text-gray-500">Cargando…</p>}

      {error && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
          <Link href="/sheep" className="ml-2 font-semibold underline">
            Volver al inventario
          </Link>
        </div>
      )}

      {!loading && !error && sheep && (
        <>
          <PageHeader
            title={`Editar ${sheep.tag}`}
            description={sheep.name ? `Modifica los datos de ${sheep.name}` : "Modifica los datos del animal"}
          />
          <SheepForm mode="edit" initial={sheep} />
        </>
      )}
    </DashboardLayout>
  )
}
