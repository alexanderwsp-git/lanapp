"use client"

import { useMemo, useState } from "react"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Modal } from "@/components/ui/modal"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import { Field, TextInput, Textarea } from "@/components/ui/form-fields"
import { Gender } from "@sheep/domain"
import {
  matingHistory as seedMatings,
  sheepData,
  statusColor,
  type MatingRecord,
} from "@/lib/mock-data"
import { HeartIcon } from "@heroicons/react/24/outline"

const today = () => new Date().toISOString().split("T")[0]

type Row = MatingRecord & { eco?: string; parto?: string }

export function SheepMontasTab({ sheepId, gender }: { sheepId: string; gender: Gender }) {
  const [rows, setRows] = useState<Row[]>(() => [...seedMatings])
  const [partner, setPartner] = useState("")
  const [fecha, setFecha] = useState(today())

  const [ecoFor, setEcoFor] = useState<Row | null>(null)
  const [isPregnant, setIsPregnant] = useState(true)
  const [ecoDate, setEcoDate] = useState(today())
  const [ecoNotes, setEcoNotes] = useState("")

  const [partoFor, setPartoFor] = useState<Row | null>(null)
  const [partoDate, setPartoDate] = useState(today())
  const [partoNotes, setPartoNotes] = useState("")

  const isFemale = gender === Gender.FEMALE
  const partnerLabel = isFemale ? "Seleccionar carnero" : "Seleccionar oveja"

  // Partner options: opposite sex, excluding self.
  const partnerOptions: ComboboxOption[] = useMemo(() => {
    const want = isFemale ? "Macho" : "Hembra"
    return sheepData
      .filter((s) => s.sexo === want && s.id !== sheepId)
      .map((s) => ({ value: s.id, label: s.arete, sublabel: s.nombre }))
  }, [isFemale, sheepId])

  function partnerDisplay(id: string) {
    const s = sheepData.find((x) => x.id === id)
    return s ? `${s.arete} ${s.nombre}` : id
  }

  function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (!partner || !fecha) return
    setRows((prev) => [
      { id: `m-${Date.now()}`, fecha, pareja: partnerDisplay(partner), estado: "Pendiente" },
      ...prev,
    ])
    setPartner("")
    setFecha(today())
  }

  function setEstado(id: string, estado: MatingRecord["estado"]) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, estado } : r)))
  }

  function openEco(row: Row) {
    setEcoFor(row)
    setIsPregnant(true)
    setEcoDate(today())
    setEcoNotes("")
  }

  function handleEcoSave(e: React.FormEvent) {
    e.preventDefault()
    if (!ecoFor) return
    setRows((prev) =>
      prev.map((r) =>
        r.id === ecoFor.id
          ? {
              ...r,
              estado: isPregnant ? "Efectiva" : "Inefectiva",
              eco: `${isPregnant ? "Preñada" : "Vacía"} · ${ecoDate}`,
            }
          : r,
      ),
    )
    setEcoFor(null)
  }

  function openParto(row: Row) {
    setPartoFor(row)
    setPartoDate(today())
    setPartoNotes("")
  }

  function handlePartoSave(e: React.FormEvent) {
    e.preventDefault()
    if (!partoFor) return
    setRows((prev) =>
      prev.map((r) => (r.id === partoFor.id ? { ...r, parto: partoDate } : r)),
    )
    setPartoFor(null)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Register form */}
      <form onSubmit={handleRegister} className="rounded-lg bg-white p-4 shadow">
        <div className="flex flex-wrap items-end gap-4">
          <Field label={partnerLabel} htmlFor="partner" required className="w-64">
            <Combobox
              id="partner"
              options={partnerOptions}
              value={partner}
              onChange={setPartner}
              placeholder={partnerLabel}
              searchPlaceholder="Buscar por arete o nombre…"
            />
          </Field>
          <Field label="Fecha monta" htmlFor="fecha-monta" required className="w-48">
            <TextInput id="fecha-monta" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </Field>
          <button
            type="submit"
            disabled={!partner || !fecha}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            Registrar monta
          </button>
        </div>
      </form>

      {/* History table */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        {rows.length === 0 ? (
          <EmptyState icon={HeartIcon} title="Sin montas" description="No hay montas registradas para esta oveja." />
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {["Fecha", "Pareja", "Estado", "Diagnóstico", "Acciones"].map((h) => (
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
              {rows.map((m) => (
                <tr key={m.id}>
                  <td className="px-4 py-3 text-sm text-gray-900">{m.fecha}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{m.pareja}</td>
                  <td className="px-4 py-3 text-sm">
                    <StatusBadge color={statusColor[m.estado]}>{m.estado}</StatusBadge>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {m.eco && <div>ECO: {m.eco}</div>}
                    {m.parto && <div>Parto: {m.parto}</div>}
                    {!m.eco && !m.parto && "—"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex flex-wrap gap-2">
                      {m.estado === "Pendiente" && (
                        <>
                          <button
                            type="button"
                            onClick={() => setEstado(m.id, "Efectiva")}
                            className="text-xs font-medium text-green-700 hover:underline"
                          >
                            Marcar efectiva
                          </button>
                          <button
                            type="button"
                            onClick={() => setEstado(m.id, "Inefectiva")}
                            className="text-xs font-medium text-red-700 hover:underline"
                          >
                            Marcar inefectiva
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => openEco(m)}
                        className="text-xs font-medium text-indigo-600 hover:underline"
                      >
                        ECO
                      </button>
                      <button
                        type="button"
                        onClick={() => openParto(m)}
                        className="text-xs font-medium text-indigo-600 hover:underline"
                      >
                        Registrar parto
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ECO modal */}
      <Modal
        open={ecoFor !== null}
        onClose={() => setEcoFor(null)}
        title="Chequeo de preñez (ECO)"
        description={ecoFor ? `Monta del ${ecoFor.fecha} · ${ecoFor.pareja}` : undefined}
        footer={
          <>
            <button
              type="button"
              onClick={() => setEcoFor(null)}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="eco-form"
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Guardar chequeo
            </button>
          </>
        }
      >
        <form id="eco-form" onSubmit={handleEcoSave} className="flex flex-col gap-4">
          <Field label="Resultado" required>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsPregnant(true)}
                className={`flex-1 rounded-md border px-4 py-2 text-sm font-medium ${
                  isPregnant
                    ? "border-pink-300 bg-pink-50 text-pink-700"
                    : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                Preñada
              </button>
              <button
                type="button"
                onClick={() => setIsPregnant(false)}
                className={`flex-1 rounded-md border px-4 py-2 text-sm font-medium ${
                  !isPregnant
                    ? "border-gray-400 bg-gray-100 text-gray-800"
                    : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                Vacía
              </button>
            </div>
          </Field>
          <Field label="Fecha chequeo" htmlFor="eco-date" required>
            <TextInput id="eco-date" type="date" value={ecoDate} onChange={(e) => setEcoDate(e.target.value)} />
          </Field>
          <Field label="Notas" htmlFor="eco-notes">
            <Textarea
              id="eco-notes"
              rows={2}
              value={ecoNotes}
              onChange={(e) => setEcoNotes(e.target.value)}
              placeholder={isPregnant ? "ECO positivo" : "Vacía — aplicar Vitasel"}
            />
          </Field>
        </form>
      </Modal>

      {/* Parto modal */}
      <Modal
        open={partoFor !== null}
        onClose={() => setPartoFor(null)}
        title="Registrar parto"
        description={partoFor ? `Monta del ${partoFor.fecha} · ${partoFor.pareja}` : undefined}
        footer={
          <>
            <button
              type="button"
              onClick={() => setPartoFor(null)}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="parto-form"
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Guardar parto
            </button>
          </>
        }
      >
        <form id="parto-form" onSubmit={handlePartoSave} className="flex flex-col gap-4">
          <Field label="Fecha parto" htmlFor="parto-date" required>
            <TextInput
              id="parto-date"
              type="date"
              value={partoDate}
              onChange={(e) => setPartoDate(e.target.value)}
            />
          </Field>
          <Field label="Notas" htmlFor="parto-notes">
            <Textarea
              id="parto-notes"
              rows={2}
              value={partoNotes}
              onChange={(e) => setPartoNotes(e.target.value)}
              placeholder="Parto simple, cordero sano"
            />
          </Field>
        </form>
      </Modal>
    </div>
  )
}
