"use client"

import { useMemo, useState } from "react"
import { Select, TextInput } from "@/components/ui/form-fields"
import { labelCategory } from "@/lib/labels/sheep"
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline"
import type { ApiSheep, ApiLocation } from "@/lib/api/types"

type Pregnancy = "" | "pregnant" | "not"

/**
 * Shared filtering for sheep-selection lists (planner ewes, bulk medicine sheep).
 * Derives the available category/breed options from the provided list so the
 * controls only show values that can actually match.
 */
export function useSheepFilter(sheep: ApiSheep[], locations: ApiLocation[]) {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("")
  const [breed, setBreed] = useState("")
  const [locationId, setLocationId] = useState("")
  const [pregnancy, setPregnancy] = useState<Pregnancy>("")

  const categoryOptions = useMemo(
    () => Array.from(new Set(sheep.map((s) => s.category))).sort(),
    [sheep],
  )
  const breedOptions = useMemo(
    () => Array.from(new Set(sheep.map((s) => s.breed))).sort(),
    [sheep],
  )
  const hasPregnancyData = useMemo(() => sheep.some((s) => s.isPregnant != null), [sheep])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return sheep.filter((s) => {
      if (q && !(s.tag.toLowerCase().includes(q) || (s.name ?? "").toLowerCase().includes(q)))
        return false
      if (category && s.category !== category) return false
      if (breed && s.breed !== breed) return false
      if (locationId && s.currentLocationId !== locationId) return false
      if (pregnancy === "pregnant" && !s.isPregnant) return false
      if (pregnancy === "not" && s.isPregnant) return false
      return true
    })
  }, [sheep, search, category, breed, locationId, pregnancy])

  const activeCount = [search.trim(), category, breed, locationId, pregnancy].filter(Boolean).length

  function reset() {
    setSearch("")
    setCategory("")
    setBreed("")
    setLocationId("")
    setPregnancy("")
  }

  const controls = (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <MagnifyingGlassIcon
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          aria-hidden="true"
        />
        <TextInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por arete o nombre"
          aria-label="Buscar por arete o nombre"
          className="pl-9"
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Filtrar por categoría"
        >
          <option value="">Todas las categorías</option>
          {categoryOptions.map((c) => (
            <option key={c} value={c}>
              {labelCategory(c)}
            </option>
          ))}
        </Select>
        <Select
          value={locationId}
          onChange={(e) => setLocationId(e.target.value)}
          aria-label="Filtrar por potrero"
        >
          <option value="">Todos los potreros</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </Select>
        <Select
          value={breed}
          onChange={(e) => setBreed(e.target.value)}
          aria-label="Filtrar por raza"
        >
          <option value="">Todas las razas</option>
          {breedOptions.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </Select>
        {hasPregnancyData && (
          <Select
            value={pregnancy}
            onChange={(e) => setPregnancy(e.target.value as Pregnancy)}
            aria-label="Filtrar por preñez"
          >
            <option value="">Preñez (todas)</option>
            <option value="pregnant">Preñadas</option>
            <option value="not">Vacías</option>
          </Select>
        )}
      </div>
      {activeCount > 0 && (
        <button
          type="button"
          onClick={reset}
          className="inline-flex w-fit items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          <XMarkIcon className="h-4 w-4" aria-hidden="true" />
          Limpiar filtros ({activeCount})
        </button>
      )}
    </div>
  )

  return { filtered, controls, reset, activeCount }
}
