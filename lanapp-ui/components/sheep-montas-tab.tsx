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
  sheepDisplay,
  statusColor,
  addDays,
  GESTATION_DAYS,
  type MatingRecord,
} from "@/lib/mock-data"
import { HeartIcon } from "@heroicons/react/24/outline"

const today = () => new Date().toISOString().split("T")[0]

type EcoResult = "Preñada" | "Vacía" | "Revisar"

export function SheepMontasTab({ sheepId, gender }: { sheepId: string; gender: Gender }) {
  const isFemale = gender === Gender.FEMALE

  // Only montas that involve this animal (as female or male).
  const [rows, setRows] = useState<MatingRecord[]>(() =>
    seedMatings.filter((m) => m.femaleId === sheepId || m.maleId === sheepId),
  )

  // Register form.
  const [partner, setPartner] = useState("")
  const [matingDate, setMatingDate] = useState(today())
  const [notes, setNotes] = useState("")

  // ECO modal.
  const [ecoFor, setEcoFor] = useState<MatingRecord | null>(null)
  const [ecoResult, setEcoResult] = useState<EcoResult>("Preñada")
  const [checkDate, setCheckDate] = useState(today())
  const [nextCheckDate, setNextCheckDate] = useState("")
  const [ecoNotes, setEcoNotes] = useState("")

  // Parto modal.
  const [partoFor, setPartoFor] = useState<MatingRecord | null>(null)
  const [deliveryDate, setDeliveryDate] = useState(today())
  const [partoNotes, setPartoNotes] = useState("")

  const partnerLabel = isFemale ? "Seleccionar carnero" : "Seleccionar oveja"

  // Partner options: opposite sex, excluding self.
  const partnerOptions: ComboboxOption[] = useMemo(() => {
    const want = isFemale ? "Macho" : "Hembra"
    return sheepData
      .filter((s) => s.sexo === want && s.id !== sheepId)
      .map((s) => ({ value: s.id, label: s.arete, sublabel: s.nombre }))
  }, [isFemale, sheepId])

  // Expected birth helper text under the mating date.
  const expectedBirth = useMemo(
    () => (matingDate ? addDays(matingDate, GESTATION_DAYS) : ""),
    [matingDate],
  )

  function partnerOf(row: MatingRecord) {
    return isFemale ? row.maleId : row.femaleId
  }

  function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (!partner || !matingDate) return
    // Derive male/female ids from the current animal's sex.
    const femaleId = isFemale ? sheepId : partner
    const maleId = isFemale ? partner : sheepId
    setRows((prev) => [
      {
        id: `m-${Date.now()}`,
        femaleId,
        maleId,
        matingDate,
        status: "Pendiente",
        notes: notes.trim() || undefined,
        expectedBirthDate: addDays(matingDate, GESTATION_DAYS),
      },
      ...prev,
    ])
    setPartner("")
    setMatingDate(today())
    setNotes("")
  }

  function setStatus(id: string, status: MatingRecord["status"]) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
  }

  function openEco(row: MatingRecord) {
    setEcoFor(row)
    setEcoResult("Preñada")
    setCheckDate(today())
    setNextCheckDate("")
    setEcoNotes("")
  }

  function handleEcoSave(e: React.FormEvent) {
    e.preventDefault()
    if (!ecoFor || !checkDate) return
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== ecoFor.id) return r
        const summary = `${ecoResult} · ${checkDate}`
        if (ecoResult === "Preñada") {
          return {
            ...r,
            status: "Efectiva",
            ecoSummary: summary,
            expectedBirthDate: addDays(r.matingDate, GESTATION_DAYS),
            nextCheckDate: undefined,
          }
        }
        if (ecoResult === "Vacía") {
          return { ...r, status: "Inefectiva", ecoSummary: summary, nextCheckDate: undefined }
        }
        // Revisar — keep pending, optionally schedule recheck.
        return { ...r, status: "Pendiente", ecoSummary: summary, nextCheckDate: nextCheckDate || undefined }
      }),
    )
    setEcoFor(null)
  }

  function openParto(row: MatingRecord) {
    setPartoFor(row)
    setDeliveryDate(today())
    setPartoNotes("")
  }

  function handlePartoSave(e: React.FormEvent) {
    e.preventDefault()
    if (!partoFor || !deliveryDate) return
    setRows((prev) => prev.map((r) => (r.id === partoFor.id ? { ...r, partoDate: deliveryDate } : r)))
    setPartoFor(null)
  }

  // Show "en lactancia" banner if any monta has a parto registered.
  const hasParto = rows.some((r) => r.partoDate)

  return (
    <div className="flex flex-col gap-4">
      {hasParto && isFemale && (
        <div className="rounded-md bg-pink-50 px-4 py-3 text-sm font-medium text-pink-700">
          Oveja en lactancia
        </div>
      )}

      {/* Register form */}
      <form onSubmit={handleRegister} className="rounded-lg bg-white p-4 shadow">
        <div className="flex flex-wrap items-start gap-4">
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
            <TextInput
              id="fecha-monta"
              type="date"
              value={matingDate}
              onChange={(e) => setMatingDate(e.target.value)}
            />
            {expectedBirth && (
              <p className="mt-1 text-xs text-gray-500">Parto esperado (~150 días): {expectedBirth}</p>
            )}
          </Field>
          <Field label="Notas (opcional)" htmlFor="monta-notes" className="w-64">
            <TextInput id="monta-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
          <button
            type="submit"
            disabled={!partner || !matingDate}
            className="mt-7 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            Registrar monta
          </button>
        </div>
      </form>

      {/* History table */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        {rows.length === 0 ? (
          <EmptyState
            icon={HeartIcon}
            title="Sin montas"
            description="No hay montas registradas para esta oveja."
          />
        ) : (
          <div className="overflow-x-auto">
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
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">{m.matingDate}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{sheepDisplay(partnerOf(m))}</td>
                    <td className="px-4 py-3 text-sm">
                      <StatusBadge color={statusColor[m.status]}>{m.status}</StatusBadge>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {m.ecoSummary && <div>ECO: {m.ecoSummary}</div>}
                      {m.expectedBirthDate && m.status === "Efectiva" && !m.partoDate && (
                        <div>Parto esperado: {m.expectedBirthDate}</div>
                      )}
                      {m.nextCheckDate && <div>Próximo chequeo: {m.nextCheckDate}</div>}
                      {m.partoDate && <div>Parto: {m.partoDate}</div>}
                      {m.status === "Inefectiva" && (
                        <div className="mt-1 text-amber-700">Aplicar Vitasel y programar segunda monta</div>
                      )}
                      {!m.ecoSummary && !m.partoDate && !m.expectedBirthDate && "—"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex flex-wrap gap-2">
                        {m.status === "Pendiente" && (
                          <>
                            <button
                              type="button"
                              onClick={() => setStatus(m.id, "Efectiva")}
                              className="text-xs font-medium text-green-700 hover:underline"
                            >
                              Marcar efectiva
                            </button>
                            <button
                              type="button"
                              onClick={() => setStatus(m.id, "Inefectiva")}
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
          </div>
        )}
      </div>

      {/* ECO modal */}
      <Modal
        open={ecoFor !== null}
        onClose={() => setEcoFor(null)}
        title="Chequeo de preñez (ECO)"
        description={ecoFor ? `Monta del ${ecoFor.matingDate} · ${sheepDisplay(partnerOf(ecoFor))}` : undefined}
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
              {(["Preñada", "Vacía", "Revisar"] as EcoResult[]).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setEcoResult(opt)}
                  className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium ${
                    ecoResult === opt
                      ? opt === "Preñada"
                        ? "border-pink-300 bg-pink-50 text-pink-700"
                        : opt === "Revisar"
                          ? "border-yellow-300 bg-yellow-50 text-yellow-800"
                          : "border-gray-400 bg-gray-100 text-gray-800"
                      : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Fecha chequeo" htmlFor="eco-date" required>
            <TextInput id="eco-date" type="date" value={checkDate} onChange={(e) => setCheckDate(e.target.value)} />
          </Field>
          {ecoResult === "Revisar" && (
            <Field label="Próximo chequeo" htmlFor="eco-next">
              <TextInput
                id="eco-next"
                type="date"
                value={nextCheckDate}
                onChange={(e) => setNextCheckDate(e.target.value)}
              />
            </Field>
          )}
          {ecoResult === "Vacía" && (
            <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Aplicar Vitasel y programar segunda monta.
            </p>
          )}
          <Field label="Notas" htmlFor="eco-notes">
            <Textarea
              id="eco-notes"
              rows={2}
              value={ecoNotes}
              onChange={(e) => setEcoNotes(e.target.value)}
            />
          </Field>
        </form>
      </Modal>

      {/* Parto modal */}
      <Modal
        open={partoFor !== null}
        onClose={() => setPartoFor(null)}
        title="Registrar parto"
        description={partoFor ? `Monta del ${partoFor.matingDate} · ${sheepDisplay(partnerOf(partoFor))}` : undefined}
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
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
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
