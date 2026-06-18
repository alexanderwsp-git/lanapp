import type { Paginated } from "@/lib/api/types"

export function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `mock-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function paginate<T>(items: T[], page: number, limit: number): Paginated<T> {
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const start = (page - 1) * limit
  return {
    items: items.slice(start, start + limit),
    total,
    page,
    limit,
    totalPages,
  }
}

export function daysBetween(from: string, to: string): number {
  const ms =
    new Date(`${to}T12:00:00`).getTime() - new Date(`${from}T12:00:00`).getTime()
  return Math.floor(ms / (1000 * 60 * 60 * 24))
}

export function calcDailyGain(
  currentWeight: number,
  currentDate: string,
  previousWeight: number,
  previousDate: string,
): number | null {
  const daysDiff = daysBetween(previousDate, currentDate)
  if (daysDiff <= 0) return null
  return Math.round(((currentWeight - previousWeight) / daysDiff) * 1000)
}

export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}
