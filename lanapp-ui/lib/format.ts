/** ISO date string → YYYY-MM-DD for display and date inputs. */
export function toDateInputValue(value: string | Date | undefined | null): string {
  if (!value) return ""
  const s = typeof value === "string" ? value : value.toISOString()
  return s.slice(0, 10)
}

/** ISO date → localized short date for tables (e.g. 12 jun 2026). */
export function formatDisplayDate(value: string | Date | undefined | null): string {
  if (!value) return "—"
  const d = typeof value === "string" ? new Date(value) : value
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("es-EC", { day: "numeric", month: "short", year: "numeric" })
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

