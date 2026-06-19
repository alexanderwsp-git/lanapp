import type { ComponentType, ReactNode, SVGProps } from "react"

export function PageHeader({
  title,
  description,
  action,
  icon: Icon,
}: {
  title: string
  description?: string
  action?: ReactNode
  icon?: ComponentType<SVGProps<SVGSVGElement>>
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        {Icon && (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
            <Icon className="h-6 w-6 text-indigo-600" aria-hidden="true" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 text-balance">{title}</h1>
          {description && <p className="mt-1 text-sm text-gray-500 text-pretty">{description}</p>}
        </div>
      </div>
      {action && <div className="flex items-center gap-3">{action}</div>}
    </div>
  )
}
