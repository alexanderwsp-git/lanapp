import { redirect } from "next/navigation"

// Sheep creation now happens in a drawer on the inventory page.
// Keep this route as a deep-link redirect for backwards compatibility.
export default function NewSheepPage() {
  redirect("/sheep?new=1")
}
