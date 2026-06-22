"use client"

import { use } from "react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { SheepDetail } from "@/components/sheep-detail"
import { useSheepDetailPage } from "@/lib/hooks/use-sheep-detail-page"

export default function SheepDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const detail = useSheepDetailPage(id)

  return (
    <DashboardLayout>
      <Breadcrumb
        items={[
          { label: "Ovejas", href: "/sheep" },
          { label: detail.loading ? "…" : detail.sheep?.tag ?? "No encontrada" },
        ]}
      />

      {detail.loading && <p className="text-sm text-gray-500">Cargando oveja…</p>}

      {detail.error && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {detail.error}
          <Link href="/sheep" className="ml-2 font-semibold underline">
            Volver al inventario
          </Link>
        </div>
      )}

      {!detail.loading && !detail.error && detail.sheep && (
        <SheepDetail
          sheep={detail.sheep}
          family={detail.family}
          weaningRecords={detail.weaningRecords}
          weightRecords={detail.weightRecords}
          weightError={detail.weightError}
          setWeightRecords={detail.setWeightRecords}
          medicineApplications={detail.medicineApplications}
          analyses={detail.analyses}
          offspring={detail.offspring}
          onRefreshSheep={detail.reloadSheep}
          onRefreshFamily={detail.reloadFamily}
          onRefreshWeaning={detail.reloadWeaning}
          onRefreshWeights={detail.reloadWeights}
          onRefreshMedicine={detail.reloadMedicine}
          onRefreshAnalyses={detail.reloadAnalyses}
        />
      )}
    </DashboardLayout>
  )
}
