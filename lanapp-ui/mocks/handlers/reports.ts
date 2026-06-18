import { seedReports, type ReportConfig, type ReportType } from "../data/reports"

export type { ReportType, ReportConfig }

export async function fetchReport(reportType: ReportType): Promise<ReportConfig> {
  return { ...seedReports[reportType], rows: [...seedReports[reportType].rows] }
}
