/** ISO date string → YYYY-MM-DD for display and date inputs. */
export function toDateInputValue(value: string | Date | undefined | null): string {
  if (!value) return ""
  const s = typeof value === "string" ? value : value.toISOString()
  return s.slice(0, 10)
}
