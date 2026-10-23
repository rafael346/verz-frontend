import { vi } from "vitest";

/** Roteador falso do Next, compartilhado entre o setup (vi.mock) e os testes. */
export const router = { push: vi.fn(), refresh: vi.fn() };
