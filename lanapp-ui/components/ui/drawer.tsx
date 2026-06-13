"use client"

import { type ReactNode, useEffect } from "react"
import { XMarkIcon } from "@heroicons/react/24/outline"

export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children?: ReactNode
  footer?: ReactNode
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    if (open) document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-gray-900/50 transition-opacity" onClick={onClose} aria-hidden="true" />
      <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
        <div
          role="dialog"
          aria-modal="true"
          className="flex w-screen max-w-md flex-col bg-white shadow-xl"
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
          {children && <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>}
          {footer && <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">{footer}</div>}
        </div>
      </div>
    </div>
  )
}
