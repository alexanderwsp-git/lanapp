"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Field, TextInput, Textarea } from "@/components/ui/form-fields"
import { createHealthCheck, fetchHealthChecksBySheep, type HealthCheckCreatePayload } from "@/lib/api/health-check"
import { formatDisplayDate } from "@/lib/format"
import { ChartBarIcon } from "@heroicons/react/24/outline"

const today = () => new Date().toISOString().split("T")[0]
const SCORES = [1, 2, 3, 4, 5]

const scoreButton: Record<number, { active: string; idle: string }> = {
  1: { active: "border-red-500 bg-red-600 text-white", idle: "border-red-200 text-red-700 hover:bg-red-50" },
  2: { active: "border-red-400 bg-red-500 text-white", idle: "border-red-200 text-red-700 hover:bg-red-50" },
  3: {
    active: "border-yellow-400 bg-yellow-400 text-yellow-900",
    idle: "border-yellow-200 text-yellow-700 hover:bg-yellow-50",
  },
  4: { active: "border-green-400 bg-green-500 text-white", idle: "border-green-200 text-green-700 hover:bg-green-50" },
  5: { active: "border-green-500 bg-green-600 text-white", idle: "border-green-200 text-green-700 hover:bg-green-50" },
}

function famachaColor(score: number): "red" | "yellow" | "green" | "gray" {
  if (score <= 2) return "red"
  if (score === 3) return "yellow"
  if (score >= 4) return "green"
  return "gray"
}

export function SheepFamachaTab({ sheepId }: { sheepId: string }) {
  const [records, setRecords] = useState<Awaited<ReturnType<typeof fetchHealthChecksBySheep>>>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [score, setScore] = useState<number | null>(null)
  const [fecha, setFecha] = useState(today())
  const [notas, setNotas] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      setRecords(await fetchHealthChecksBySheep(sheepId))
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "No se pudieron cargar los chequeos")
      setRecords([])
    } finally {
      setLoading(false)
    }
  }, [sheepId])

  useEffect(() => {
    load()
  }, [load])

  const rows = useMemo(
    () => [...records].sort((a, b) => b.checkDate.localeCompare(a.checkDate)),
    [records],
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (score === null || !fecha) return
    setSaving(true)
    try {
      await createHealthCheck({
        sheepId,
        checkDate: fecha,
        famachaScore: score,
        notes: notas.trim() || undefined,
      } satisfies HealthCheckCreatePayload)
      setScore(null)
      setFecha(today())
      setNotas("")
      await load()
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "No se pudo guardar el chequeo")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {loadError && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
          <button type="button" onClick={load} className="ml-2 font-semibold underline">
            Reintentar
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="rounded-lg bg-white p-4 shadow">
        <div className="flex flex-col gap-4">
          <Field label="Puntaje FAMACHA (1–5)" required>
            <div className="flex gap-2">
              {SCORES.map((s) => {
                const styles = scoreButton[s]
                const active = score === s
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setScore(s)}
                    aria-pressed={active}
                    className={`flex h-11 w-11 items-center justify-center rounded-md border text-sm font-semibold transition ${
                      active ? styles.active : `bg-white ${styles.idle}`
                    }`}
                  >
                    {s}
                  </button>
                )
              })}
              <span className="self-center text-xs text-gray-400">1–2 anemia (rojo) · 4–5 saludable (verde)</span>
            </div>
          </Field>

          <div className="flex flex-wrap items-end gap-4">
            <Field label="Fecha chequeo" htmlFor="famacha-fecha" required className="w-48">
              <TextInput
                id="famacha-fecha"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </Field>
            <Field label="Notas" htmlFor="famacha-notas" className="min-w-[16rem] flex-1">
              <Textarea
                id="famacha-notas"
                rows={1}
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Observaciones del chequeo"
              />
            </Field>
            <button
              type="submit"
              disabled={score === null || !fecha || saving}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {saving ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </div>
      </form>

      <div className="overflow-hidden rounded-lg bg-white shadow">
        {loading ? (
          <p className="p-8 text-center text-sm text-gray-500">Cargando chequeos…</p>
        ) : rows.length === 0 ? (
          <EmptyState icon={ChartBarIcon} title="Sin chequeos" description="No hay registros FAMACHA." />
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {["Fecha", "Puntaje", "Notas"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((f) => (
                <tr key={f.id}>
                  <td className="px-4 py-3 text-sm text-gray-900">{formatDisplayDate(f.checkDate)}</td>
                  <td className="px-4 py-3 text-sm">
                    <StatusBadge color={famachaColor(f.famachaScore)}>{f.famachaScore}</StatusBadge>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{f.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
