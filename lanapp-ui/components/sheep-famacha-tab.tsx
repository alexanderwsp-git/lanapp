"use client"

import { useMemo, useState } from "react"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Field, TextInput, Textarea } from "@/components/ui/form-fields"
import { famachaColor, famachaHistory as seedFamacha, type FamachaRecord } from "@/lib/mock-data"
import { ChartBarIcon } from "@heroicons/react/24/outline"

const today = () => new Date().toISOString().split("T")[0]

const SCORES = [1, 2, 3, 4, 5]

// Tailwind classes per FAMACHA score button (red = anemia risk, green = healthy).
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

export function SheepFamachaTab() {
  const [records, setRecords] = useState<FamachaRecord[]>(() => [...seedFamacha])
  const [score, setScore] = useState<number | null>(null)
  const [fecha, setFecha] = useState(today())
  const [notas, setNotas] = useState("")

  const rows = useMemo(() => [...records].sort((a, b) => b.fecha.localeCompare(a.fecha)), [records])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (score === null || !fecha) return
    setRecords((prev) => [{ id: `f-${Date.now()}`, fecha, puntaje: score, notas }, ...prev])
    setScore(null)
    setFecha(today())
    setNotas("")
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Create form */}
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
              disabled={score === null || !fecha}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              Guardar
            </button>
          </div>
        </div>
      </form>

      {/* History table */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        {rows.length === 0 ? (
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
                  <td className="px-4 py-3 text-sm text-gray-900">{f.fecha}</td>
                  <td className="px-4 py-3 text-sm">
                    <StatusBadge color={famachaColor(f.puntaje)}>{f.puntaje}</StatusBadge>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{f.notas || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
