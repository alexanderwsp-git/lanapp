import type { ComponentType, ReactNode, SVGProps } from "react"

/**
 * Paleta central de colores para los badges de estado.
 * Cambia aqui el estilo y se aplica en toda la app.
 */
export type BadgeColor =
  | "indigo"
  | "green"
  | "yellow"
  | "red"
  | "gray"
  | "blue"
  | "pink"
  | "violet"

// Color del punto indicador a la izquierda del texto.
const dotMap: Record<BadgeColor, string> = {
  indigo: "bg-indigo-500",
  green: "bg-green-500",
  yellow: "bg-amber-500",
  red: "bg-red-500",
  gray: "bg-gray-400",
  blue: "bg-blue-500",
  pink: "bg-pink-500",
  violet: "bg-violet-500",
}

// Color del icono opcional (reemplaza al punto cuando se provee).
const iconColorMap: Record<BadgeColor, string> = {
  indigo: "text-indigo-500",
  green: "text-green-600",
  yellow: "text-amber-500",
  red: "text-red-500",
  gray: "text-gray-400",
  blue: "text-blue-500",
  pink: "text-pink-500",
  violet: "text-violet-500",
}

export function StatusBadge({
  children,
  color = "gray",
  icon: Icon,
}: {
  children: ReactNode
  color?: BadgeColor
  /** Si se provee, reemplaza el punto indicador por este icono. */
  icon?: ComponentType<SVGProps<SVGSVGElement>>
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 py-0.5 text-xs font-medium text-gray-700">
      {Icon ? (
        <Icon className={`h-3.5 w-3.5 shrink-0 ${iconColorMap[color]}`} aria-hidden="true" />
      ) : (
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotMap[color]}`} aria-hidden="true" />
      )}
      {children}
    </span>
  )
}
