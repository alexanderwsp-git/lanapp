/** UI label constants — not API data, shared by components and legacy mock-data re-exports. */
export const BREEDS = [
  "Suffolk",
  "Hampshire",
  "Dorset",
  "Katahdin",
  "Dorper",
  "Pelibuey",
  "Santa Inés",
  "Morada Nova",
  "Blackbelly",
  "Rambouillet",
  "Merino",
  "Corriedale",
  "Texel",
  "Criolla",
] as const

export type BadgeColor = "indigo" | "green" | "yellow" | "red" | "gray" | "blue" | "pink"

export const statusColor: Record<string, BadgeColor> = {
  Activo: "green",
  Inactivo: "gray",
  Vendido: "blue",
  Fallecido: "gray",
  Cuarentena: "yellow",
  Programado: "blue",
  Aplicado: "green",
  Cancelado: "gray",
  Omitido: "red",
  Pendiente: "yellow",
  Efectiva: "green",
  Inefectiva: "red",
  Preñada: "pink",
  Vacía: "gray",
  Revisar: "yellow",
  Active: "green",
  Inactive: "red",
}

export function famachaColor(score: number): BadgeColor {
  if (score <= 2) return "red"
  if (score === 3) return "yellow"
  return "green"
}
