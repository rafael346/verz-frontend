import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

import { request } from "@playwright/test";

import { BACKEND_DIR, BASE_URL, type Fixtures } from "./data";

/** Antes da suíte: dados novos (e2e_fixtures) e o cookie de sessão de cada conta. */
export default async function globalSetup() {
  const api = await request.newContext({ baseURL: BASE_URL });
  const health = await api.get("/api/health/").catch(() => null);
  if (!health?.ok()) throw new Error(`A pilha não respondeu em ${BASE_URL}. Em verz-backend: docker compose up -d`);

  const out = execFileSync("docker", ["compose", "exec", "-T", "backend", "python", "manage.py", "e2e_fixtures"], {
    cwd: BACKEND_DIR,
    encoding: "utf8",
  });
  const data: Fixtures = JSON.parse(out);
  writeFileSync("e2e/.fixtures.json", JSON.stringify(data, null, 2));

  // Sessões criadas pelo próprio e2e_fixtures: nenhum login aqui (o limite é de 5 por minuto por IP).
  mkdirSync("e2e/.auth", { recursive: true });
  for (const [who, key] of Object.entries(data.sessions)) {
    const cookie = { name: "sessionid", value: key, domain: "localhost", path: "/", expires: -1, httpOnly: true, secure: false, sameSite: "Lax" as const };
    writeFileSync(`e2e/.auth/${who}.json`, JSON.stringify({ cookies: [cookie], origins: [] }));
  }
  await api.dispose();
}
