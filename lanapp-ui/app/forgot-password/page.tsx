"use client"

import { useState } from "react"
import Link from "next/link"
import { AuthLayout } from "@/components/auth-layout"
import { forgotPassword } from "@/lib/auth/client"

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const form = new FormData(e.currentTarget)
    const username = String(form.get("email") || "").trim()
    try {
      await forgotPassword(username)
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar el código")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <h1 className="text-2xl font-semibold text-gray-900">Recuperar contraseña</h1>
      <p className="mt-1 text-sm text-gray-500">
        Te enviaremos un código a tu email
      </p>

      {sent ? (
        <div className="mt-8 space-y-4">
          <p className="text-sm text-gray-700">
            Si el usuario existe, recibirás un código por email. Usa ese código en la página de
            restablecimiento.
          </p>
          <Link
            href="/reset-password"
            className="inline-block text-sm font-semibold text-indigo-600 hover:text-indigo-500"
          >
            Ingresar código →
          </Link>
        </div>
      ) : (
        <form className="mt-8 flex flex-col gap-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="tu@correo.com"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {loading ? "Enviando…" : "Enviar código"}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-gray-500">
        <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">
          Volver al inicio de sesión
        </Link>
      </p>
    </AuthLayout>
  )
}
