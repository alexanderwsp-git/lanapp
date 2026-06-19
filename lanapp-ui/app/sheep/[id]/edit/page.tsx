import { redirect } from "next/navigation"

// Sheep editing now happens in a drawer on the detail page.
// Keep this route as a deep-link redirect for backwards compatibility.
export default async function EditSheepPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/sheep/${id}?edit=1`)
}
