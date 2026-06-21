"use client"

import { useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/use-auth"

type RequireRoleProps = {
  role: "admin"
  children: ReactNode
}

export function RequireRole({ role, children }: RequireRoleProps) {
  const { loading, isAdmin } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (role === "admin" && !isAdmin) {
      router.replace("/forbidden")
    }
  }, [loading, isAdmin, role, router])

  if (loading) {
    return <p className="text-sm text-gray-500">Cargando…</p>
  }

  if (role === "admin" && !isAdmin) {
    return null
  }

  return children
}
