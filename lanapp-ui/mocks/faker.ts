import { fakerES as faker } from "@faker-js/faker"

const seed = Number(process.env.NEXT_PUBLIC_MOCK_SEED ?? 42)

faker.seed(Number.isFinite(seed) ? seed : 42)

export { faker }
