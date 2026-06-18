/**
 * Backward-compatible re-exports. Prefer `@/lib/api/*` for data and `@/mocks/labels` for UI helpers.
 * @deprecated Import from `@/lib/api/reports` and `@/mocks/labels` instead.
 */
export { BREEDS, statusColor, famachaColor, type BadgeColor } from "@/mocks/labels"
export { seedReports as reportConfig, type ReportType } from "@/mocks/data/reports"

export const GESTATION_DAYS = 150

export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().split("T")[0]
}

export function calcDailyGain(
  currentWeight: number,
  currentDate: string,
  previousWeight: number,
  previousDate: string,
): number | null {
  const ms =
    new Date(`${currentDate}T12:00:00`).getTime() - new Date(`${previousDate}T12:00:00`).getTime()
  const daysDiff = Math.floor(ms / (1000 * 60 * 60 * 24))
  if (daysDiff <= 0) return null
  return Math.round(((currentWeight - previousWeight) / daysDiff) * 1000)
}
