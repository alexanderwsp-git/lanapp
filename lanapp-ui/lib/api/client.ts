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

export type FetchOptions = {
  signal?: AbortSignal
}

import { refreshSessionIfNeeded, forceLogout } from '@/lib/auth/client'
import { getAccessToken, isSkipAuthEnabled } from '@/lib/auth/session'

const API_PREFIX = process.env.NEXT_PUBLIC_API_PREFIX || "/api/v1"

let handling401 = false

const inflightGets = new Map<string, Promise<ApiEnvelope<unknown>>>()

async function fetchWithAuth(url: string, init?: RequestInit): Promise<Response> {
  if (!isSkipAuthEnabled()) {
    await refreshSessionIfNeeded()
  }

  const res = await fetch(url, {
    ...init,
    headers: { ...getHeaders(), ...init?.headers },
  })

  if (res.status === 401 && !isSkipAuthEnabled() && !handling401) {
    handling401 = true
    const refreshed = await refreshSessionIfNeeded()
    if (refreshed && getAccessToken()) {
      handling401 = false
      return fetch(url, {
        ...init,
        headers: { ...getHeaders(), ...init?.headers },
      })
    }
    handling401 = false
    void forceLogout()
  }

  return res
}

function getHeaders(): HeadersInit {
  const headers: HeadersInit = { "Content-Type": "application/json" }
  if (typeof window === "undefined") return headers
  const token = localStorage.getItem("accessToken")
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

function resolveUrl(path: string): string {
  return path.startsWith("http") ? path : `${API_PREFIX}/${path.replace(/^\//, "")}`
}

async function apiFetchInternal<T>(url: string, init?: RequestInit): Promise<ApiEnvelope<T>> {
  const res = await fetchWithAuth(url, init)

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
    const detail =
      typeof body.error === "string" &&
      body.error !== "Invalid request parameters" &&
      body.message &&
      body.message !== "Request failed"
        ? body.message
        : null
    const err =
      detail ??
      (typeof body.error === "string"
        ? body.error
        : Array.isArray(body.error)
          ? body.error.map((e: { message?: string }) => e.message).filter(Boolean).join("; ")
          : body.message)
    throw new Error(err || `HTTP ${res.status}`)
  }
  return body
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<ApiEnvelope<T>> {
  const url = resolveUrl(path)
  const method = (init?.method ?? "GET").toUpperCase()

  if (method === "GET") {
    const existing = inflightGets.get(url)
    if (existing) return existing as Promise<ApiEnvelope<T>>

    // Shared in-flight GETs must not carry a consumer AbortSignal — Strict Mode
    // would abort the first mount and break deduped callers on the second mount.
    const { signal: _signal, ...initWithoutSignal } = init ?? {}
    const promise = apiFetchInternal<T>(
      url,
      Object.keys(initWithoutSignal).length > 0 ? initWithoutSignal : undefined,
    ).finally(() => {
      if (inflightGets.get(url) === promise) inflightGets.delete(url)
    })
    inflightGets.set(url, promise as Promise<ApiEnvelope<unknown>>)
    return promise
  }

  return apiFetchInternal<T>(url, init)
}

export const lanapp = {
  get: <T>(path: string, options?: FetchOptions) =>
    apiFetch<T>(`lanapp/${path}`, options?.signal ? { signal: options.signal } : undefined),
  post: <T>(path: string, data: unknown) =>
    apiFetch<T>(`lanapp/${path}`, { method: "POST", body: JSON.stringify(data) }),
  put: <T>(path: string, data: unknown) =>
    apiFetch<T>(`lanapp/${path}`, { method: "PUT", body: JSON.stringify(data) }),
  patch: <T>(path: string, data: unknown) =>
    apiFetch<T>(`lanapp/${path}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: <T>(path: string) => apiFetch<T>(`lanapp/${path}`, { method: "DELETE" }),
}
