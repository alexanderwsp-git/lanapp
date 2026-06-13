"use client"

import { type ReactNode, useEffect } from "react"
import { XMarkIcon } from "@heroicons/react/24/outline"

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children?: ReactNode
  footer?: ReactNode
  size?: "sm" | "md" | "lg"
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    if (open) document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!open) return null

  const sizeClass = size === "sm" ? "max-w-sm" : size === "lg" ? "max-w-2xl" : "max-w-lg"

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div className="absolute inset-0 bg-gray-900/50 transition-opacity" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative w-full ${sizeClass} rounded-lg bg-white shadow-xl`}
      >
        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-2 rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
          >
            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">Cerrar</span>
          </button>
        </div>
        {children && <div className="px-6 py-5">{children}</div>}
        {footer && <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">{footer}</div>}
      </div>
    </div>
  )
}
