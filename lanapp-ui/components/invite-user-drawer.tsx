"use client"

import { useEffect, useState } from "react"
import { Drawer } from "@/components/ui/drawer"
import { Field, TextInput } from "@/components/ui/form-fields"
import { LANAPP_ROLES, type LanappRole } from "@/lib/auth/constants"
import { getAccessToken } from "@/lib/auth/session"

const rolLabel: Record<string, string> = {
  admin: "Administrador",
  veterinario: "Veterinario",
  operario: "Operario",
}

type InviteUserDrawerProps = {
  open: boolean
  onClose: () => void
  onInvited: () => void
}

export function InviteUserDrawer({ open, onClose, onInvited }: InviteUserDrawerProps) {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<LanappRole>("operario")
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setEmail("")
    setRole("operario")
    setError(null)
  }, [open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const token = getAccessToken()
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ email: email.trim().toLowerCase(), role }),
      })
      const body = await res.json()
      if (!res.ok || !body.success) {
        throw new Error(body.error || "No se pudo invitar al usuario")
      }
      onInvited()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Invitar usuario"
      description="Cognito enviará un email con contraseña temporal"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="invite-user-form"
            disabled={saving}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {saving ? "Enviando…" : "Enviar invitación"}
          </button>
        </>
      }
    >
      <form id="invite-user-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Email" required htmlFor="invite-email">
          <TextInput
            id="invite-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="usuario@ejemplo.com"
          />
        </Field>
        <Field label="Rol" required htmlFor="invite-role">
          <select
            id="invite-role"
            required
            value={role}
            onChange={(e) => setRole(e.target.value as LanappRole)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
          >
            {LANAPP_ROLES.map((r) => (
              <option key={r} value={r}>
                {rolLabel[r]}
              </option>
            ))}
          </select>
        </Field>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </Drawer>
  )
}
