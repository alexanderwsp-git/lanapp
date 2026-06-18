/**
 * Mock data layer for Lanapp UI.
 *
 * Structure:
 * - `data/`       — hero fixtures (stable demo scenarios)
 * - `factories/`  — Faker builders for extra volume (@sheep/domain enums)
 * - `generate.ts` — merges heroes + generated extras into a store snapshot
 * - `handlers/`   — mock API implementations (via resolveApi when USE_MOCKS=true)
 * - `store.ts`    — in-memory mutable store (CRUD while mocks are enabled)
 *
 * Env (when NEXT_PUBLIC_USE_MOCKS=true):
 * - NEXT_PUBLIC_MOCK_SEED=42
 * - NEXT_PUBLIC_MOCK_EXTRA_SHEEP=40
 * - NEXT_PUBLIC_MOCK_WEIGHTS_PER_SHEEP=2
 */

export { resetMockStore, getMockStore } from "./store"
