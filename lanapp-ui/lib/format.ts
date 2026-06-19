/** ISO date string → YYYY-MM-DD for display and date inputs. */
export function toDateInputValue(value: string | Date | undefined | null): string {
  if (!value) return ""
  const s = typeof value === "string" ? value : value.toISOString()
  return s.slice(0, 10)
}

/** Age in whole days from birth to reference date (matches backend category engine). */
export function ageInDays(
  birthDate: string | Date,
  referenceDate: Date = new Date(),
): number {
  const birth = new Date(birthDate)
  return Math.floor((referenceDate.getTime() - birth.getTime()) / 86_400_000)
}

export function formatAgeDays(birthDate: string | Date | undefined | null): string {
  if (!birthDate) return "—"
  const days = ageInDays(birthDate)
  if (days < 0) return "—"
  return `${days} d`
}

/** Shift an ISO date (YYYY-MM-DD) by whole days. */
export function shiftDateIso(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** ISO date → localized short date for tables (e.g. 12 jun 2026). */
export function formatDisplayDate(value: string | Date | undefined | null): string {
  if (!value) return "—"
  const d = typeof value === "string" ? new Date(value) : value
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("es-EC", { day: "numeric", month: "short", year: "numeric" })
}

/** ISO date → relative phrase in Spanish (e.g. "hoy", "hace 3 días", "hace 2 meses"). */
export function formatRelativeDate(value: string | Date | undefined | null): string {
  if (!value) return ""
  const d = typeof value === "string" ? new Date(value) : value
  if (Number.isNaN(d.getTime())) return ""
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000)
  if (days < 0) return formatDisplayDate(d)
  if (days === 0) return "hoy"
  if (days === 1) return "ayer"
  if (days < 30) return `hace ${days} días`
  const months = Math.floor(days / 30)
  if (months < 12) return `hace ${months} ${months === 1 ? "mes" : "meses"}`
  const years = Math.floor(days / 365)
  return `hace ${years} ${years === 1 ? "año" : "años"}`
}

/** Coerce API decimal strings to a finite number. */
export function toKg(value: unknown): number | null {
  if (value == null || value === "") return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

/** Numeric kg for table cells where the column header already says (kg). */
export function displayKgValue(value: unknown): string {
  const kg = toKg(value)
  return kg != null ? String(kg) : "—"
}

/** Average daily gain (g/día) between consecutive pesajes by date. */
export function computeDailyGainBetween(
  currentWeight: number,
  currentDate: string | Date,
  previousWeight: number,
  previousDate: string | Date,
): number | null {
  const daysDiff = Math.floor(
    (new Date(currentDate).getTime() - new Date(previousDate).getTime()) / 86_400_000,
  )
  if (daysDiff <= 0) return null
  return ((currentWeight - previousWeight) / daysDiff) * 1000
}

/** Map weight record id → ganancia vs the prior pesaje by fecha (not DB insert order). */
export function dailyGainByWeightId(records: { id: string; weight: number | string; measurementDate: string }[]): Map<string, number | null> {
  const sorted = [...records].sort(
    (a, b) => new Date(a.measurementDate).getTime() - new Date(b.measurementDate).getTime(),
  )
  const map = new Map<string, number | null>()
  sorted.forEach((r, i) => {
    if (i === 0) {
      map.set(r.id, null)
      return
    }
    const prev = sorted[i - 1]
    map.set(
      r.id,
      computeDailyGainBetween(
        Number(r.weight),
        r.measurementDate,
        Number(prev.weight),
        prev.measurementDate,
      ),
    )
  })
  return map
}

export function formatDailyGain(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—"
  const rounded = Math.round(value * 10) / 10
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}

/** Latest pesaje from weight table, or registration snapshot on sheep.weight. */
export function formatLastWeight(sheep: {
  latestWeight?: number | string | null
  weight?: number | string | null
}): string {
  const kg = toKg(sheep.latestWeight) ?? toKg(sheep.weight)
  return kg != null ? `${kg} kg` : "—"
}

