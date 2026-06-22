import { SheepCategory } from "@sheep/domain"
import { getMockStore } from "../store"
import type { DashboardSummary } from "@/lib/api/reports"

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const store = getMockStore()
  const pregnant = store.sheep.filter((s) => s.isPregnant)
  const maltonas = store.sheep.filter(
    (s) =>
      s.category === SheepCategory.CORDERA_DESTETADA ||
      s.category === SheepCategory.BORREGA,
  )
  const quarantine = store.sheep.filter((s) => s.status === "Quarantine")
  const famachaAlerts = store.analyses.filter(
    (a) => a.status === "Completed" && a.famachaScore != null && a.famachaScore >= 3,
  )

  return {
    totalSheep: store.sheep.length,
    pregnantCount: pregnant.length,
    maltonasCount: maltonas.length,
    quarantineCount: quarantine.length,
    healthAlertCount: famachaAlerts.length,
    generatedAt: new Date().toISOString(),
  }
}
