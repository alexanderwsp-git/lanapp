import type { ReactNode } from "react"
import Image from "next/image"

export function AuthLayout({
  children,
  covered = false,
}: {
  children: ReactNode
  covered?: boolean
}) {
  return (
    <div className="flex min-h-screen bg-white">
      {/* Form side */}
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-indigo-50">
              <Image src="/sheep-mascot.png" alt="" width={36} height={36} className="object-contain" />
            </div>
            <span className="text-xl font-bold text-gray-900">Lanapp</span>
          </div>
          {children}
        </div>
      </div>

      {/* Decorative panel */}
      <div className="relative hidden w-1/2 items-center justify-center bg-indigo-600 lg:flex">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-indigo-800" />
        <div className="relative z-10 flex flex-col items-center px-12 text-center">
          <div className="flex h-56 w-56 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20">
            <Image
              src={covered ? "/sheep-mascot-covered.png" : "/sheep-mascot.png"}
              alt="Mascota oveja de Lanapp"
              width={180}
              height={180}
              className="object-contain transition-all duration-300"
            />
          </div>
          <h2 className="mt-8 text-2xl font-semibold text-white text-balance">
            Granja San Alfonso
          </h2>
          <p className="mt-2 max-w-xs text-sm text-indigo-100 text-pretty">
            Gestiona tu rebaño, potreros y sanidad ovina desde un solo lugar.
          </p>
        </div>
      </div>
    </div>
  )
}
