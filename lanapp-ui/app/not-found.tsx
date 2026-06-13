import Link from "next/link"

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6 text-center">
      <p className="text-5xl font-bold text-indigo-600">404</p>
      <h1 className="mt-4 text-2xl font-semibold text-gray-900">Página no encontrada</h1>
      <p className="mt-2 max-w-sm text-sm text-gray-500 text-pretty">
        Lo sentimos, no pudimos encontrar la página que estás buscando.
      </p>
      <Link
        href="/dashboard"
        className="mt-8 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
      >
        Volver al inicio
      </Link>
    </main>
  )
}
