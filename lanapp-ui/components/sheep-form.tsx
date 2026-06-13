"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Field, TextInput, Select, Textarea } from "@/components/ui/form-fields"
import {
  Gender,
  RecordType,
  SheepBreed,
  SheepCreateSchema,
  SheepStatus,
  SheepUpdateSchema,
  type SheepCreate,
  type SheepUpdate,
} from "@sheep/domain"
import { createSheep, updateSheep, updateSheepStatus } from "@/lib/api/sheep"
import { fetchLocations } from "@/lib/api/location"
import type { ApiLocation, ApiSheep } from "@/lib/api/types"
import { formatLastWeight, toDateInputValue } from "@/lib/format"
import {
  breedOptions,
  genderOptions,
  labelGender,
  labelRecordType,
  labelStatus,
  recordTypeOptions,
  statusOptions,
} from "@/lib/labels/sheep"

type FormState = {
  tag: string
  name: string
  gender: Gender
  breed: SheepBreed
  birthDate: string
  weight: string
  recordType: RecordType
  status: SheepStatus
  currentLocationId: string
  notes: string
}

function emptyForm(): FormState {
  return {
    tag: "",
    name: "",
    gender: Gender.FEMALE,
    breed: SheepBreed.SUFFOLK,
    birthDate: new Date().toISOString().split("T")[0],
    weight: "",
    recordType: RecordType.BORN,
    status: SheepStatus.ACTIVE,
    currentLocationId: "",
    notes: "",
  }
}

function formFromSheep(sheep: ApiSheep): FormState {
  return {
    tag: sheep.tag,
    name: sheep.name ?? "",
    gender: sheep.gender,
    breed: sheep.breed,
    birthDate: toDateInputValue(sheep.birthDate),
    weight: String(sheep.weight),
    recordType: sheep.recordType,
    status: sheep.status,
    currentLocationId: sheep.currentLocationId ?? sheep.currentLocation?.id ?? "",
    notes: sheep.notes ?? "",
  }
}

export function SheepForm({ initial, mode }: { initial?: ApiSheep; mode: "new" | "edit" }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [locations, setLocations] = useState<ApiLocation[]>([])
  const [form, setForm] = useState<FormState>(() => (initial ? formFromSheep(initial) : emptyForm()))
  const [initialStatus] = useState<SheepStatus | null>(initial?.status ?? null)

  useEffect(() => {
    fetchLocations()
      .then(setLocations)
      .catch(() => setLocations([]))
  }, [])

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const basePayload = {
      tag: form.tag.trim(),
      name: form.name.trim() || undefined,
      gender: form.gender,
      breed: form.breed,
      birthDate: form.birthDate,
      recordType: form.recordType,
      currentLocationId: form.currentLocationId || undefined,
      notes: form.notes.trim() || undefined,
    }

    if (mode === "new") {
      const parsed = SheepCreateSchema.safeParse({ ...basePayload, weight: Number(form.weight) })
      if (!parsed.success) {
        setError(parsed.error.errors[0]?.message ?? "Datos inválidos")
        return
      }

      setSaving(true)
      try {
        const created = await createSheep(parsed.data as SheepCreate)
        router.push(`/sheep/${created.id}`)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo crear la oveja")
      } finally {
        setSaving(false)
      }
      return
    }

    if (!initial) return

    const parsed = SheepUpdateSchema.safeParse(basePayload)
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? "Datos inválidos")
      return
    }

    setSaving(true)
    try {
      await updateSheep(initial.id, parsed.data as SheepUpdate)
      if (initialStatus !== null && form.status !== initialStatus) {
        await updateSheepStatus(initial.id, form.status)
      }
      router.push(`/sheep/${initial.id}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar los cambios")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg bg-white shadow">
      {error && (
        <div className="mx-6 mt-6 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      <div className="grid grid-cols-1 gap-x-6 gap-y-5 p-6 sm:grid-cols-2">
        <Field label="Arete" required htmlFor="tag">
          <TextInput
            id="tag"
            value={form.tag}
            onChange={(e) => setField("tag", e.target.value)}
            placeholder="SA-001"
            required
          />
        </Field>
        <Field label="Nombre" htmlFor="name">
          <TextInput
            id="name"
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
            placeholder="Blanca"
          />
        </Field>
        <Field label="Sexo" required htmlFor="gender">
          <Select
            id="gender"
            value={form.gender}
            onChange={(e) => setField("gender", e.target.value as Gender)}
          >
            {genderOptions.map((g) => (
              <option key={g} value={g}>
                {labelGender(g)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Raza" required htmlFor="breed">
          <Select
            id="breed"
            value={form.breed}
            onChange={(e) => setField("breed", e.target.value as SheepBreed)}
          >
            {breedOptions.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Fecha de nacimiento" required htmlFor="birthDate">
          <TextInput
            id="birthDate"
            type="date"
            value={form.birthDate}
            onChange={(e) => setField("birthDate", e.target.value)}
            required
          />
        </Field>
        {mode === "new" ? (
          <Field label="Peso inicial (kg)" required htmlFor="weight">
            <TextInput
              id="weight"
              type="number"
              step="0.1"
              min="0.1"
              value={form.weight}
              onChange={(e) => setField("weight", e.target.value)}
              placeholder="28.5"
              required
            />
          </Field>
        ) : (
          <Field label="Último peso (kg)" htmlFor="weight-readonly">
            <TextInput
              id="weight-readonly"
              value={initial ? formatLastWeight(initial).replace(" kg", "") : "—"}
              readOnly
              disabled
              className="bg-gray-50"
            />
          </Field>
        )}
        {mode === "edit" && (
          <Field label="Estado" required htmlFor="status">
            <Select
              id="status"
              value={form.status}
              onChange={(e) => setField("status", e.target.value as SheepStatus)}
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {labelStatus(s)}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field label="Tipo de registro" required htmlFor="recordType">
          <Select
            id="recordType"
            value={form.recordType}
            onChange={(e) => setField("recordType", e.target.value as RecordType)}
          >
            {recordTypeOptions.map((t) => (
              <option key={t} value={t}>
                {labelRecordType(t)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Ubicación" htmlFor="currentLocationId">
          <Select
            id="currentLocationId"
            value={form.currentLocationId}
            onChange={(e) => setField("currentLocationId", e.target.value)}
          >
            <option value="">Sin ubicación</option>
            {locations.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Notas" htmlFor="notes" className="sm:col-span-2">
          <Textarea
            id="notes"
            rows={3}
            value={form.notes}
            onChange={(e) => setField("notes", e.target.value)}
            placeholder="Observaciones..."
          />
        </Field>
      </div>
      {mode === "new" && (
        <p className="px-6 text-xs text-gray-500">
          Categoría y estado los calcula el servidor al guardar. El peso inicial se registra como
          primer pesaje en la pestaña Pesos.
        </p>
      )}
      {mode === "edit" && (
        <p className="px-6 text-xs text-gray-500">
          Para actualizar el peso, usa la pestaña Pesos en el detalle de la oveja.
        </p>
      )}
      <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
        <button
          type="button"
          onClick={() => router.push(mode === "edit" && initial ? `/sheep/${initial.id}` : "/sheep")}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
        >
          {saving && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          )}
          {mode === "new" ? "Crear oveja" : "Guardar cambios"}
        </button>
      </div>
    </form>
  )
}
