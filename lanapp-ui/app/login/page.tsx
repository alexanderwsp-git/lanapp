"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { AuthLayout } from "@/components/auth-layout"
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline"
import { login, setNewPassword as completeNewPassword } from "@/lib/auth/client"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get("next") || "/dashboard"

  const [passwordFocused, setPasswordFocused] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [newPasswordMode, setNewPasswordMode] = useState<{
    username: string
    session: string
  } | null>(null)
  const [newPassword, setNewPassword] = useState("")

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const form = new FormData(e.currentTarget)
    const username = String(form.get("usuario") || "").trim()
    const password = String(form.get("password") || "")

    try {
      const result = await login(username, password)
      if (result.type === "new_password") {
        setNewPasswordMode({ username: result.username, session: result.session })
        return
      }
      router.push(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión")
    } finally {
      setLoading(false)
    }
  }

  async function handleNewPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!newPasswordMode) return
    setError(null)
    setLoading(true)
    try {
      await completeNewPassword(newPasswordMode.username, newPassword, newPasswordMode.session)
      router.push(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo establecer la contraseña")
    } finally {
      setLoading(false)
    }
  }

  if (newPasswordMode) {
    return (
      <AuthLayout>
        <h1 className="text-2xl font-semibold text-gray-900">Nueva contraseña</h1>
        <p className="mt-1 text-sm text-gray-500">Debes cambiar tu contraseña temporal</p>
        <form className="mt-8 flex flex-col gap-5" onSubmit={handleNewPassword}>
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
              Nueva contraseña
            </label>
            <input
              id="new-password"
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {loading ? "Guardando…" : "Guardar y continuar"}
          </button>
        </form>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout covered={passwordFocused && !showPassword}>
      <h1 className="text-2xl font-semibold text-gray-900">Iniciar sesión</h1>
      <p className="mt-1 text-sm text-gray-500">Bienvenido de vuelta a Lanapp</p>

      <form className="mt-8 flex flex-col gap-5" onSubmit={handleLogin}>
        <div>
          <label htmlFor="usuario" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="usuario"
            name="usuario"
            type="email"
            required
            autoComplete="username"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
            placeholder="tu@correo.com"
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
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <Link href="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
        >
          {loading ? "Ingresando…" : "Iniciar sesión"}
        </button>
      </form>
    </AuthLayout>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthLayout><p className="text-sm text-gray-500">Cargando…</p></AuthLayout>}>
      <LoginForm />
    </Suspense>
  )
}
