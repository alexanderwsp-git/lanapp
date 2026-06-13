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
