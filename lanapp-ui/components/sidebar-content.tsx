"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  HomeIcon,
  Squares2X2Icon,
  MapPinIcon,
  CalendarDaysIcon,
  BeakerIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  BellAlertIcon,
  UsersIcon,
} from "@heroicons/react/24/outline"
import type { ComponentType, SVGProps } from "react"

type NavItem = {
  label: string
  href: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
}

const primaryNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: HomeIcon },
  { label: "Ovejas", href: "/sheep", icon: Squares2X2Icon },
  { label: "Ubicaciones", href: "/locations", icon: MapPinIcon },
  { label: "Planificador", href: "/planner", icon: CalendarDaysIcon },
  { label: "Alertas destete", href: "/weaning", icon: BellAlertIcon },
  { label: "Medicamentos", href: "/medicines", icon: BeakerIcon },
]

const reportsNav: NavItem[] = [
  { label: "Maltonas", href: "/reports/maltonas", icon: ChartBarIcon },
  { label: "Preñadas", href: "/reports/prenadas", icon: ChartBarIcon },
  { label: "Montas", href: "/reports/montas", icon: ChartBarIcon },
  { label: "Reproductores", href: "/reports/reproductores", icon: ChartBarIcon },
  { label: "FAMACHA", href: "/reports/famacha", icon: ChartBarIcon },
]

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      className={`group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-indigo-600 text-white"
          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
      }`}
    >
      <Icon
        className={`h-5 w-5 shrink-0 ${active ? "text-white" : "text-gray-400 group-hover:text-gray-500"}`}
        aria-hidden="true"
      />
      {item.label}
    </Link>
  )
}

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/")

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex h-16 items-center gap-3 border-b border-gray-200 px-6">
        <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-indigo-50">
          <Image src="/sheep-mascot.png" alt="" width={32} height={32} className="object-contain" />
        </div>
        <span className="text-lg font-bold text-gray-900">Lanapp</span>
      </div>

      <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-6" onClick={onNavigate}>
        <div className="flex flex-col gap-1">
          {primaryNav.map((item) => (
            <NavLink key={item.href} item={item} active={isActive(item.href)} />
          ))}
        </div>

        <div className="flex flex-col gap-1">
          <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Reportes ovejas
          </p>
          {reportsNav.map((item) => (
            <NavLink key={item.href} item={item} active={isActive(item.href)} />
          ))}
        </div>
      </nav>

      <div className="flex flex-col gap-1 border-t border-gray-200 p-4">
        <NavLink
          item={{ label: "Usuarios", href: "/users", icon: UsersIcon }}
          active={isActive("/users")}
        />
        <NavLink
          item={{ label: "Configuración", href: "/settings", icon: Cog6ToothIcon }}
          active={isActive("/settings")}
        />
      </div>
    </div>
  )
}
