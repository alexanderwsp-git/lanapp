"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { SheepDetail } from "@/components/sheep-detail"
import { fetchSheepById } from "@/lib/api/sheep"
import type { ApiSheep } from "@/lib/api/types"

export default function SheepDetailPage({ params }: { params: Promise<{ id: string }> }) {
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
          { label: loading ? "…" : sheep?.tag ?? "No encontrada" },
        ]}
      />

      {loading && <p className="text-sm text-gray-500">Cargando oveja…</p>}

      {error && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
          <Link href="/sheep" className="ml-2 font-semibold underline">
            Volver al inventario
          </Link>
        </div>
      )}

      {!loading && !error && sheep && <SheepDetail sheep={sheep} />}
    </DashboardLayout>
  )
}
