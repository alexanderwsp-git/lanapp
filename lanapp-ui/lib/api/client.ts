/**
 * HTTP client for lanapp + auth APIs.
 * UI lives in this repo; web-app is retired — wire pages via lib/api/* and hooks.
 */

export type ApiEnvelope<T> = {
  success: boolean
  message: string
  data: T
  error: string | null
}

const API_PREFIX = process.env.NEXT_PUBLIC_API_PREFIX || "/api/v1"

function getHeaders(): HeadersInit {
  const headers: HeadersInit = { "Content-Type": "application/json" }
  if (typeof window === "undefined") return headers
  const token = localStorage.getItem("accessToken")
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<ApiEnvelope<T>> {
  const url = path.startsWith("http") ? path : `${API_PREFIX}/${path.replace(/^\//, "")}`
  const res = await fetch(url, {
    ...init,
    headers: { ...getHeaders(), ...init?.headers },
  })

  if (res.status === 204) {
    return { success: true, message: "OK", data: null as T, error: null }
  }

  const raw = await res.text()
  let body: ApiEnvelope<T>
  try {
    body = JSON.parse(raw) as ApiEnvelope<T>
  } catch {
    const hint =
      res.status === 429
        ? "Demasiadas solicitudes al API. Espera un momento y recarga, o reinicia `npm run dev:api`."
        : raw.includes("Internal Server") || res.status === 502 || res.status === 503
          ? "No se pudo conectar con el API. Ejecuta `npm run dev:api` en otra terminal (puerto 4001)."
          : raw.slice(0, 120) || `HTTP ${res.status}`
    throw new Error(hint)
  }

  if (!res.ok || body.success === false) {
    const err =
      typeof body.error === "string"
        ? body.error
        : Array.isArray(body.error)
          ? body.error.map((e: { message?: string }) => e.message).filter(Boolean).join("; ")
          : body.message
    throw new Error(err || `HTTP ${res.status}`)
  }
  return body
}

export const lanapp = {
  get: <T>(path: string) => apiFetch<T>(`lanapp/${path}`),
  post: <T>(path: string, data: unknown) =>
    apiFetch<T>(`lanapp/${path}`, { method: "POST", body: JSON.stringify(data) }),
  put: <T>(path: string, data: unknown) =>
    apiFetch<T>(`lanapp/${path}`, { method: "PUT", body: JSON.stringify(data) }),
  patch: <T>(path: string, data: unknown) =>
    apiFetch<T>(`lanapp/${path}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: <T>(path: string) => apiFetch<T>(`lanapp/${path}`, { method: "DELETE" }),
}
