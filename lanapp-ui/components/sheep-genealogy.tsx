"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Gender } from "@sheep/domain"
import { UsersIcon } from "@heroicons/react/24/outline"
import { fetchSheep } from "@/lib/api/sheep"
import type { ApiSheep } from "@/lib/api/types"
import { labelCategory } from "@/lib/labels/sheep"

type NodeRole = "father" | "mother" | "self" | "child"

function SheepNode({
  sheep,
  role,
  highlight = false,
}: {
  sheep: ApiSheep
  role: NodeRole
  highlight?: boolean
}) {
  const genderColor =
    sheep.gender === Gender.MALE
      ? "border-blue-200 bg-blue-50"
      : "border-pink-200 bg-pink-50"
  const dotColor = sheep.gender === Gender.MALE ? "bg-blue-500" : "bg-pink-500"

  return (
    <Link
      href={`/sheep/${sheep.id}`}
      className={`group flex min-w-[8.5rem] items-center gap-2 rounded-lg border px-3 py-2 transition ${
        highlight
          ? "border-indigo-300 bg-indigo-50 ring-2 ring-indigo-200"
          : `${genderColor} hover:border-indigo-300 hover:ring-2 hover:ring-indigo-100`
      }`}
    >
      <span className={`h-2 w-2 shrink-0 rounded-full ${dotColor}`} aria-hidden="true" />
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-gray-900">
          {sheep.name || sheep.tag}
        </span>
        <span className="block truncate text-xs text-gray-500">
          {sheep.tag} · {labelCategory(sheep.category)}
        </span>
      </span>
    </Link>
  )
}

function EmptyNode({ label }: { label: string }) {
  return (
    <div className="flex min-w-[8.5rem] items-center gap-2 rounded-lg border border-dashed border-gray-200 px-3 py-2">
      <span className="h-2 w-2 shrink-0 rounded-full bg-gray-300" aria-hidden="true" />
      <span className="text-sm text-gray-400">{label}</span>
    </div>
  )
}

export function SheepGenealogy({ sheep }: { sheep: ApiSheep }) {
  const [all, setAll] = useState<ApiSheep[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchSheep({ limit: 500 })
      .then((res) => {
        if (!cancelled) setAll(res.items)
      })
      .catch(() => {
        if (!cancelled) setAll([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [sheep.id])

  const byId = useMemo(() => new Map(all.map((s) => [s.id, s])), [all])

  const mother = sheep.motherId ? byId.get(sheep.motherId) : undefined
  const father = sheep.fatherId ? byId.get(sheep.fatherId) : undefined
  const children = useMemo(
    () => all.filter((s) => s.motherId === sheep.id || s.fatherId === sheep.id),
    [all, sheep.id],
  )

  const hasParents = Boolean(mother || father)
  const hasFamily = hasParents || children.length > 0

  if (loading) {
    return (
      <div className="rounded-lg bg-white p-6 shadow">
        <p className="text-sm text-gray-500">Cargando genealogía…</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900">
        <UsersIcon className="h-5 w-5 text-gray-400" />
        Genealogía
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        Padres e hijos registrados de esta oveja. Toca una tarjeta para abrir su ficha.
      </p>

      {!hasFamily ? (
        <div className="mt-4 rounded-md border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center">
          <p className="text-sm text-gray-500">
            Sin parentesco registrado. Esta oveja no tiene padres ni crías vinculadas.
          </p>
        </div>
      ) : (
        <div className="mt-6 flex flex-col items-center gap-0">
          {/* Padres */}
          <div className="flex flex-col items-center">
            <span className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
              Padres
            </span>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {father ? <SheepNode sheep={father} role="father" /> : <EmptyNode label="Padre no registrado" />}
              {mother ? <SheepNode sheep={mother} role="mother" /> : <EmptyNode label="Madre no registrada" />}
            </div>
          </div>

          {/* Conector hacia self */}
          <div className="h-6 w-px bg-gray-200" aria-hidden="true" />

          {/* Oveja actual */}
          <div className="flex flex-col items-center">
            <SheepNode sheep={sheep} role="self" highlight />
          </div>

          {/* Hijos */}
          {children.length > 0 && (
            <>
              <div className="h-6 w-px bg-gray-200" aria-hidden="true" />
              <div className="flex flex-col items-center">
                <span className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                  {children.length === 1 ? "Cría" : `Crías (${children.length})`}
                </span>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {children.map((c) => (
                    <SheepNode key={c.id} sheep={c} role="child" />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Leyenda */}
      <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-gray-100 pt-4">
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="h-2 w-2 rounded-full bg-pink-500" aria-hidden="true" />
          Hembra
        </span>
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="h-2 w-2 rounded-full bg-blue-500" aria-hidden="true" />
          Macho
        </span>
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="h-2 w-2 rounded-full bg-indigo-500" aria-hidden="true" />
          Oveja actual
        </span>
      </div>
    </div>
  )
}
