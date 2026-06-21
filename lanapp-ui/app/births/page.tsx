"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Gender, SheepCategory } from "@sheep/domain"
import { DashboardLayout } from "@/components/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { StatCard } from "@/components/ui/stat-card"
import { EmptyState } from "@/components/ui/empty-state"
import { DataTable } from "@/components/ui/data-table"
import { StatusBadge } from "@/components/ui/status-badge"
import { Drawer } from "@/components/ui/drawer"
import { Field, TextInput, Textarea } from "@/components/ui/form-fields"
import { fetchSheep } from "@/lib/api/sheep"
import { fetchMatingsBySheep, type ApiMating } from "@/lib/api/mating"
import {
  fetchPregnancyChecksByMating,
  recordDelivery,
  type ApiPregnancyCheck,
} from "@/lib/api/pregnancy-check"
import type { ApiSheep } from "@/lib/api/types"
import { matingActions } from "@/lib/mating-actions"
import { formatDisplayDate } from "@/lib/format"
import { labelCategory } from "@/lib/labels/sheep"
import { SunIcon, UserGroupIcon } from "@heroicons/react/24/outline"

const today = () => new Date().toISOString().split("T")[0]

type PregnantRow = {
  sheep: ApiSheep
  mating: ApiMating
  checks: ApiPregnancyCheck[]
}

function isPregnantEwe(s: ApiSheep): boolean {
  return (
    s.gender === Gender.FEMALE &&
    (s.isPregnant ||
      s.category === SheepCategory.OVEJA_PRENADA ||
      s.category === SheepCategory.BORREGA_PRENADA)
  )
}

export default function BirthsPage() {
  const [rows, setRows] = useState<PregnantRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [target, setTarget] = useState<PregnantRow | null>(null)
  const [deliveryDate, setDeliveryDate] = useState(today())
  const [notes, setNotes] = useState("")
  const [offspringBorn, setOffspringBorn] = useState("")
  const [offspringAlive, setOffspringAlive] = useState("")
  const [offspringLost, setOffspringLost] = useState("")
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const res = await fetchSheep({ page: 1, limit: 300, gender: Gender.FEMALE })
      const pregnant = res.items.filter(isPregnantEwe)
      const loaded: PregnantRow[] = []
      for (const sheep of pregnant) {
        const matings = await fetchMatingsBySheep(sheep.id)
        for (const mating of matings) {
          const checks = await fetchPregnancyChecksByMating(mating.id)
          if (matingActions(checks).canDeliver) {
            loaded.push({ sheep, mating, checks })
            break
          }
        }
      }
      setRows(loaded)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "No se pudieron cargar las preñadas")
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const withPartner = useMemo(
    () =>
      rows.map((r) => ({
        ...r,
        partnerTag: r.mating.male?.tag ?? r.mating.maleId,
      })),
    [rows],
  )

  function openDrawer(row: PregnantRow) {
    setTarget(row)
    setDeliveryDate(today())
    setNotes("")
    setOffspringBorn("")
    setOffspringAlive("")
    setOffspringLost("")
    setFormError(null)
    setDrawerOpen(true)
  }

  function parseCount(value: string): number | undefined {
    const trimmed = value.trim()
    if (!trimmed) return undefined
    const n = Number.parseInt(trimmed, 10)
    return Number.isFinite(n) && n >= 0 ? n : undefined
  }

  async function submitBirth(e: React.FormEvent) {
    e.preventDefault()
    if (!target || !deliveryDate) return
    setFormError(null)

    const born = parseCount(offspringBorn)
    const alive = parseCount(offspringAlive)
    const lost = parseCount(offspringLost)
    if (offspringBorn.trim() && born === undefined) {
      setFormError("Crías nacidas debe ser un número entero ≥ 0")
      return
    }
    if (offspringAlive.trim() && alive === undefined) {
      setFormError("Crías vivas debe ser un número entero ≥ 0")
      return
    }
    if (offspringLost.trim() && lost === undefined) {
      setFormError("Crías perdidas debe ser un número entero ≥ 0")
      return
    }

    setSaving(true)
    try {
      await recordDelivery(target.mating.id, {
        deliveryDate,
        notes: notes.trim() || "Parto registrado",
        offspringBorn: born,
        offspringAlive: alive,
        offspringLost: lost,
      })
      setDrawerOpen(false)
      await load()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "No se pudo registrar el parto")
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Partos"
        description="Ovejas preñadas listas para registrar el nacimiento"
      />

      {loadError && (
        <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
          <button type="button" onClick={load} className="ml-2 font-semibold underline">
            Reintentar
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          label="Preñadas pendientes"
          value={rows.length}
          icon={UserGroupIcon}
          hint="Con monta confirmada y sin parto"
        />
        <StatCard
          label="Registro"
          value="Extendido"
          icon={SunIcon}
          hint="Incluye conteo de crías (opcional)"
        />
      </div>

      <div className="mt-6">
        <DataTable
          rows={withPartner}
          rowKey={(r) => r.sheep.id}
          loading={loading}
          loadingText="Cargando preñadas..."
          empty={
            <EmptyState
              icon={SunIcon}
              title="Sin partos pendientes"
              description="No hay ovejas preñadas con monta confirmada pendiente de parto."
            />
          }
          columns={[
            {
              key: "tag",
              header: "Madre",
              className: "whitespace-nowrap font-medium text-gray-900",
              cell: (r) => r.sheep.tag,
            },
            {
              key: "name",
              header: "Nombre",
              className: "whitespace-nowrap",
              cell: (r) => r.sheep.name || "—",
            },
            {
              key: "category",
              header: "Categoría",
              className: "whitespace-nowrap",
              cell: (r) => <StatusBadge color="indigo">{labelCategory(r.sheep.category)}</StatusBadge>,
            },
            {
              key: "mating",
              header: "Monta",
              className: "whitespace-nowrap",
              cell: (r) => formatDisplayDate(r.mating.matingDate),
            },
            {
              key: "ram",
              header: "Reproductor",
              className: "whitespace-nowrap",
              cell: (r) => r.partnerTag,
            },
            {
              key: "expected",
              header: "Parto estimado",
              className: "whitespace-nowrap",
              cell: (r) =>
                r.mating.expectedBirthDate
                  ? formatDisplayDate(r.mating.expectedBirthDate)
                  : "—",
            },
            {
              key: "actions",
              header: "",
              align: "right",
              className: "whitespace-nowrap",
              cell: (r) => (
                <button
                  type="button"
                  onClick={() => openDrawer(r)}
                  title="Registrar parto"
                  aria-label="Registrar parto"
                  className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-indigo-600"
                >
                  <SunIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              ),
            },
          ]}
        />
      </div>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Registrar parto"
        description={
          target
            ? `${target.sheep.tag}${target.sheep.name ? ` · ${target.sheep.name}` : ""} · monta ${formatDisplayDate(target.mating.matingDate)}`
            : undefined
        }
        footer={
          <>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="birth-form"
              disabled={saving}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {saving ? "Guardando…" : "Guardar parto"}
            </button>
          </>
        }
      >
        <form id="birth-form" onSubmit={submitBirth} className="flex flex-col gap-4">
          {formError && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</div>
          )}
          <Field label="Fecha parto" htmlFor="birth-date" required>
            <TextInput
              id="birth-date"
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              required
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Crías nacidas" htmlFor="offspring-born">
              <TextInput
                id="offspring-born"
                type="number"
                min="0"
                step="1"
                value={offspringBorn}
                onChange={(e) => setOffspringBorn(e.target.value)}
                placeholder="Ej. 2"
              />
            </Field>
            <Field label="Crías vivas" htmlFor="offspring-alive">
              <TextInput
                id="offspring-alive"
                type="number"
                min="0"
                step="1"
                value={offspringAlive}
                onChange={(e) => setOffspringAlive(e.target.value)}
                placeholder="Ej. 2"
              />
            </Field>
            <Field label="Crías perdidas" htmlFor="offspring-lost">
              <TextInput
                id="offspring-lost"
                type="number"
                min="0"
                step="1"
                value={offspringLost}
                onChange={(e) => setOffspringLost(e.target.value)}
                placeholder="Ej. 0"
              />
            </Field>
          </div>
          <Field label="Notas" htmlFor="birth-notes">
            <Textarea
              id="birth-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Parto simple, gemelos sanos"
            />
          </Field>
          <p className="text-xs text-gray-500">
            Registra cada cría en{" "}
            <Link href="/sheep" className="font-medium text-indigo-600 hover:text-indigo-500">
              Nueva oveja
            </Link>{" "}
            con la misma fecha de nacimiento. Opcional:{" "}
            <Link href="/planner" className="font-medium text-indigo-600 hover:text-indigo-500">
              programar nueva monta
            </Link>{" "}
            en el planificador.
          </p>
        </form>
      </Drawer>
    </DashboardLayout>
  )
}
