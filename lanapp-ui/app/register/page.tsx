"use client"

import Link from "next/link"
import { AuthLayout } from "@/components/auth-layout"

export default function RegisterPage() {
  return (
    <AuthLayout>
      <h1 className="text-2xl font-semibold text-gray-900">Acceso por invitación</h1>
      <p className="mt-1 text-sm text-gray-500">
        Las cuentas de Lanapp se crean solo por invitación del administrador de la granja.
      </p>

      <div className="mt-8 space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-5 text-sm text-gray-700">
        <p>
          Si eres nuevo en el equipo, pide a un administrador que te invite desde la sección{" "}
          <strong>Usuarios</strong>. Recibirás un email con una contraseña temporal.
        </p>
        <p>
          Con ese email y contraseña, inicia sesión y el sistema te pedirá establecer tu contraseña
          definitiva.
        </p>
      </div>

      <Link
        href="/login"
        className="mt-8 flex w-full items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
      >
        Ir a iniciar sesión
      </Link>

      <p className="mt-6 text-center text-sm text-gray-500">
        ¿Olvidaste tu contraseña?{" "}
        <Link href="/forgot-password" className="font-semibold text-indigo-600 hover:text-indigo-500">
          Recuperar acceso
        </Link>
      </p>
    </AuthLayout>
  )
}
