"use client"

import { useState, type ReactNode } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  ChevronDownIcon,
  UserCircleIcon,
  ArrowRightStartOnRectangleIcon,
} from "@heroicons/react/24/outline"
import { SidebarContent } from "@/components/sidebar-content"

export function DashboardLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-gray-900/50"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 w-72 shadow-xl">
            <button
              type="button"
              className="absolute right-0 top-4 -mr-12 flex h-10 w-10 items-center justify-center rounded-full text-white"
              onClick={() => setMobileOpen(false)}
            >
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              <span className="sr-only">Cerrar menú</span>
            </button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-gray-200 lg:block">
        <SidebarContent />
      </aside>

      <div className="lg:pl-72">
        {/* Top header */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-gray-200 bg-white px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-ml-1 rounded-md p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
            <span className="sr-only">Abrir menú</span>
          </button>

          <div className="flex flex-1 items-center justify-end gap-2">
            <button
              type="button"
              className="relative rounded-full p-2 text-gray-500 hover:bg-gray-100"
            >
              <BellIcon className="h-6 w-6" aria-hidden="true" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-600 ring-2 ring-white" />
              <span className="sr-only">Notificaciones</span>
            </button>

            <div className="relative">
              <button
                type="button"
                className="flex items-center gap-2 rounded-full p-1 pr-2 hover:bg-gray-100"
                onClick={() => setUserMenuOpen((v) => !v)}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
                  AS
                </span>
                <span className="hidden text-sm font-medium text-gray-700 sm:block">Alfonso S.</span>
                <ChevronDownIcon className="hidden h-4 w-4 text-gray-400 sm:block" aria-hidden="true" />
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} aria-hidden="true" />
                  <div className="absolute right-0 z-20 mt-2 w-48 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                    <Link
                      href="/users"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <UserCircleIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                      Perfil
                    </Link>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50"
                      onClick={() => {
                        setUserMenuOpen(false)
                        router.push("/login")
                      }}
                    >
                      <ArrowRightStartOnRectangleIcon className="h-5 w-5" aria-hidden="true" />
                      Cerrar sesión
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}
