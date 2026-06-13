"use client"

import { useMemo, useRef, useState, useEffect } from "react"
import { ChevronUpDownIcon, CheckIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline"

export type ComboboxOption = { value: string; label: string; sublabel?: string }

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Seleccionar…",
  searchPlaceholder = "Buscar…",
  emptyMessage = "Sin resultados",
  id,
}: {
  options: ComboboxOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  id?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [])

  const selected = options.find((o) => o.value === value)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter(
      (o) => o.label.toLowerCase().includes(q) || (o.sublabel?.toLowerCase().includes(q) ?? false),
    )
  }, [options, query])

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        id={id}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-left text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      >
        <span className={selected ? "text-gray-900" : "text-gray-400"}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
          <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2">
            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
            />
          </div>
          <ul className="max-h-56 overflow-auto py-1" role="listbox">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-500">{emptyMessage}</li>
            ) : (
              filtered.map((o) => (
                <li key={o.value}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(o.value)
                      setOpen(false)
                      setQuery("")
                    }}
                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                      o.value === value ? "bg-indigo-50 text-indigo-700" : "text-gray-900"
                    }`}
                    role="option"
                    aria-selected={o.value === value}
                  >
                    <span>
                      <span className="font-medium">{o.label}</span>
                      <span className={`ml-2 text-gray-500 ${o.sublabel ? "" : "hidden"}`}>
                        {o.sublabel ?? "\u00a0"}
                      </span>
                    </span>
                    <CheckIcon
                      className={`h-4 w-4 text-indigo-600 ${o.value === value ? "" : "invisible"}`}
                      aria-hidden="true"
                    />
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
