import { readFileSync } from "node:fs";

export const BASE_URL = "http://localhost:8080";
export const BACKEND_DIR = process.env.VERZ_BACKEND_DIR ?? "../verz-backend";

/** O que o `e2e_fixtures` do backend devolve: contas da execução e os lotes de cada cenário. */
export type Fixtures = {
  run: string;
  password: string;
  accounts: Record<"seller" | "ana" | "bia", string>;
  sessions: Record<"seller" | "ana" | "bia", string>;
  lots: Record<"open" | "disputed" | "scheduled" | "sold" | "sold_to_cancel", number>;
  receipts: Record<"sold" | "sold_to_cancel", string>;
};

export const data = (): Fixtures => JSON.parse(readFileSync("e2e/.fixtures.json", "utf8"));
