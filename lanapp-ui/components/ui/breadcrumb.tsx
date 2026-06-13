import Link from "next/link"
import { ChevronRightIcon } from "@heroicons/react/24/outline"

export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Migas de pan" className="mb-4">
      <ol className="flex items-center gap-1 text-sm">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRightIcon className="h-4 w-4 text-gray-300" aria-hidden="true" />}
            {item.href ? (
              <Link href={item.href} className="font-medium text-gray-500 hover:text-gray-700">
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-gray-900">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
