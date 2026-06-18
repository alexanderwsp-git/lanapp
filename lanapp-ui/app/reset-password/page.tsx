"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AuthLayout } from "@/components/auth-layout"
import { resetPassword } from "@/lib/auth/client"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const form = new FormData(e.currentTarget)
    const username = String(form.get("email") || "").trim()
    const code = String(form.get("code") || "").trim()
    const newPassword = String(form.get("password") || "")

    try {
      await resetPassword(username, code, newPassword)
      router.push("/login")
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo restablecer la contraseña")
    } finally {
      setLoading(false)
    }
  }

  const fieldClass =
    "mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"

  return (
    <AuthLayout>
      <h1 className="text-2xl font-semibold text-gray-900">Restablecer contraseña</h1>
      <p className="mt-1 text-sm text-gray-500">Ingresa el código que recibiste por email</p>

      <form className="mt-8 flex flex-col gap-5" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input id="email" name="email" type="email" required className={fieldClass} />
        </div>
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-gray-700">
            Código
          </label>
          <input id="code" name="code" type="text" required className={fieldClass} />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Nueva contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            className={fieldClass}
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
        >
          {loading ? "Guardando…" : "Restablecer contraseña"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">
          Volver al inicio de sesión
        </Link>
      </p>
    </AuthLayout>
  )
}
