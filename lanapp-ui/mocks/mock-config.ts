/** Number of Faker-generated sheep added on top of hero fixtures. */
export function getMockExtraSheepCount(): number {
  const raw = process.env.NEXT_PUBLIC_MOCK_EXTRA_SHEEP
  if (raw == null || raw === "") return 40
  const n = Number.parseInt(raw, 10)
  return Number.isFinite(n) && n >= 0 ? n : 40
}

/** Weight history rows per generated sheep (0–6). */
export function getMockWeightsPerSheep(): number {
  const raw = process.env.NEXT_PUBLIC_MOCK_WEIGHTS_PER_SHEEP
  if (raw == null || raw === "") return 2
  const n = Number.parseInt(raw, 10)
  return Number.isFinite(n) && n >= 0 ? Math.min(n, 6) : 2
}
