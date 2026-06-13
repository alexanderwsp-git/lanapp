import type { ComponentType, SVGProps } from "react"

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
}: {
  label: string
  value: string | number
  icon: ComponentType<SVGProps<SVGSVGElement>>
  hint?: string
}) {
  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
          {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
          <Icon className="h-5 w-5 text-indigo-600" aria-hidden="true" />
        </div>
      </div>
    </div>
  )
}
