import type { ReportConfig, ReportType } from "@/mocks/data/reports"
import * as mock from "@/mocks/handlers/reports"
import * as mockDashboard from "@/mocks/handlers/dashboard"
import * as real from "./real/reports"
import { resolveApi } from "./resolve"

export type DashboardSummary = {
  totalSheep: number
  pregnantCount: number
  maltonasCount: number
  quarantineCount: number
  healthAlertCount: number
  generatedAt?: string
}

export type { ReportConfig, ReportType }

export const { fetchReport, fetchDashboardSummary } = resolveApi(
  real,
  { ...mock, fetchDashboardSummary: mockDashboard.fetchDashboardSummary },
)
