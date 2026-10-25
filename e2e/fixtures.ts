import { execFileSync } from "node:child_process";

import { test as base, expect, type Page } from "@playwright/test";

import { BACKEND_DIR, data, type Fixtures } from "./data";

type Who = keyof Fixtures["accounts"];

const consoleErrors = new WeakMap<Page, string[]>();
const allowed = new WeakMap<Page, RegExp[]>();

function watch(page: Page): Page {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  consoleErrors.set(page, errors);
  return page;
}

/** O que eu conferia à mão em toda tela: console limpo e nada de rolagem horizontal. */
async function assertHealthy(page: Page) {
  const expected = allowed.get(page) ?? [];
  const errors = (consoleErrors.get(page) ?? []).filter((text) => !expected.some((pattern) => pattern.test(text)));
  expect(errors, "erros no console").toEqual([]);
  if (page.isClosed() || page.url() === "about:blank") return;
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, "rolagem horizontal").toBeLessThanOrEqual(0);
}

/**
 * O teste provoca de propósito uma resposta de erro (404 de página inexistente, 400 de lance recusado): o Chromium
 * registra "Failed to load resource" no console, e só esse erro é aceito.
 */
export function allowConsoleError(page: Page, status: 400 | 404) {
  allowed.set(page, [...(allowed.get(page) ?? []), new RegExp(`status of ${status}`)]);
}

/** Lote com relógio, criado quando o teste começa (um criado no início da suíte já poderia ter acabado). */
export function timedLot(kind: "prorrogacao" | "liquidacao"): number {
  const out = execFileSync(
    "docker",
    ["compose", "exec", "-T", "backend", "python", "manage.py", "e2e_fixtures", "--timed", kind, "--run", data().run],
    { cwd: BACKEND_DIR, encoding: "utf8" },
  );
  return JSON.parse(out).lot;
}

export const test = base.extend<{ as: (who: Who) => Promise<Page>; fixtures: Fixtures }>({
  fixtures: async ({}, use) => use(data()),
  page: async ({ page }, use) => {
    await use(watch(page));
    await assertHealthy(page);
  },
  /** Página logada com o cookie salvo no globalSetup; cada uma é conferida no fim do teste. */
  as: async ({ browser }, use, testInfo) => {
    const opened: Page[] = [];
    const { viewport, isMobile, hasTouch, deviceScaleFactor, userAgent, locale, timezoneId, baseURL } = testInfo.project.use;
    await use(async (who) => {
      const context = await browser.newContext({
        storageState: `e2e/.auth/${who}.json`,
        viewport, isMobile, hasTouch, deviceScaleFactor, userAgent, locale, timezoneId, baseURL,
      });
      const page = watch(await context.newPage());
      opened.push(page);
      return page;
    });
    for (const page of opened) await assertHealthy(page);
    for (const page of opened) await page.context().close();
  },
});

export { expect };

/** Saldo pela API, com a sessão da página (funciona antes de a página navegar). */
export async function wallet(page: Page): Promise<{ balance: number; committed: number; available: number }> {
  const raw = await (await page.request.get("/api/wallet/")).json();
  return { balance: Number(raw.balance), committed: Number(raw.committed), available: Number(raw.available) };
}

/** Lance mínimo atual do lote, pela API (o mesmo lote pode já ter lances de outro projeto da suíte). */
export async function minimumBid(page: Page, lot: number): Promise<number> {
  return Number((await (await page.request.get(`/api/lots/${lot}/`)).json()).min_next_bid);
}

/** Avisos da página, sem o anunciador de rota do Next (que também é role="alert"). */
export const alertOf = (page: Page) => page.locator('[role="alert"]:not(#__next-route-announcer__)');

/** "R$ 1.234,56" como o site escreve (o Intl usa espaço não separável depois do "R$"). */
export const brl = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
