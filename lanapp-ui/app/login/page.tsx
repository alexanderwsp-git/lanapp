"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AuthLayout } from "@/components/auth-layout"
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline"

export default function LoginPage() {
  const router = useRouter()
  const [passwordFocused, setPasswordFocused] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  return (
    <AuthLayout covered={passwordFocused && !showPassword}>
      <h1 className="text-2xl font-semibold text-gray-900">Iniciar sesión</h1>
      <p className="mt-1 text-sm text-gray-500">Bienvenido de vuelta a Lanapp</p>

      <form
        className="mt-8 flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault()
          router.push("/dashboard")
        }}
      >
        <div>
          <label htmlFor="usuario" className="block text-sm font-medium text-gray-700">
            Usuario
          </label>
          <input
            id="usuario"
            name="usuario"
            type="text"
            required
            autoComplete="username"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
            placeholder="tu_usuario"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Contraseña
          </label>
          <div className="relative mt-1">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 text-sm text-gray-900 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? (
                <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
              ) : (
                <EyeIcon className="h-5 w-5" aria-hidden="true" />
              )}
              <span className="sr-only">Mostrar contraseña</span>
            </button>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
          />
          Recordarme
        </label>

        <button
          type="submit"
          className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          Iniciar sesión
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        ¿No tienes cuenta?{" "}
        <Link href="/register" className="font-semibold text-indigo-600 hover:text-indigo-500">
          Regístrate
        </Link>
      </p>
    </AuthLayout>
  )
}
