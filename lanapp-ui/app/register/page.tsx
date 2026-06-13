"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AuthLayout } from "@/components/auth-layout"

export default function RegisterPage() {
  const router = useRouter()
  const [passwordFocused, setPasswordFocused] = useState(false)

  const fieldClass =
    "mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
  const labelClass = "block text-sm font-medium text-gray-700"

  return (
    <AuthLayout covered={passwordFocused}>
      <h1 className="text-2xl font-semibold text-gray-900">Crear cuenta</h1>
      <p className="mt-1 text-sm text-gray-500">Únete a la gestión de tu granja</p>

      <form
        className="mt-8 flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault()
          router.push("/dashboard")
        }}
      >
        <div>
          <label htmlFor="usuario" className={labelClass}>
            Usuario <span className="text-red-600">*</span>
          </label>
          <input id="usuario" type="text" required minLength={3} className={fieldClass} placeholder="mínimo 3 caracteres" />
        </div>

        <div>
          <label htmlFor="email" className={labelClass}>
            Email <span className="text-red-600">*</span>
          </label>
          <input id="email" type="email" required className={fieldClass} placeholder="tucorreo@ejemplo.com" />
        </div>

        <div>
          <label htmlFor="password" className={labelClass}>
            Contraseña <span className="text-red-600">*</span>
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            onFocus={() => setPasswordFocused(true)}
            onBlur={() => setPasswordFocused(false)}
            className={fieldClass}
            placeholder="••••••••"
          />
          <p className="mt-1 text-xs text-gray-500">Mínimo 8 caracteres, una mayúscula y un número.</p>
        </div>

        <div>
          <label htmlFor="confirm" className={labelClass}>
            Confirmar contraseña <span className="text-red-600">*</span>
          </label>
          <input id="confirm" type="password" required minLength={8} className={fieldClass} placeholder="••••••••" />
        </div>

        <button
          type="submit"
          className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          Crear cuenta
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">
          Inicia sesión
        </Link>
      </p>
    </AuthLayout>
  )
}
