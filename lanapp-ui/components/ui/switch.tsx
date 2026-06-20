"use client"

export type SwitchProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  "aria-label": string
  id?: string
}

export function Switch({ checked, onChange, disabled, "aria-label": ariaLabel, id }: SwitchProps) {
  return (
    <div
      className={`group relative inline-flex w-11 shrink-0 rounded-full bg-gray-200 p-0.5 inset-ring inset-ring-gray-900/5 outline-offset-2 outline-indigo-600 transition-colors duration-200 ease-in-out has-checked:bg-indigo-600 has-focus-visible:outline-2 ${disabled ? "opacity-50" : ""}`}
    >
      <span className="size-5 rounded-full bg-white shadow-xs ring-1 ring-gray-900/5 transition-transform duration-200 ease-in-out group-has-checked:translate-x-5" />
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        aria-label={ariaLabel}
        className="absolute inset-0 size-full appearance-none focus:outline-hidden disabled:cursor-not-allowed"
      />
    </div>
  )
}

export function SwitchField({
  label,
  description,
  ...switchProps
}: { label: string; description?: string } & SwitchProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        {description ? <p className="text-xs text-gray-500">{description}</p> : null}
      </div>
      <Switch {...switchProps} />
    </div>
  )
}
