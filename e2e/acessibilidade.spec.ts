import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";

import type { Fixtures } from "./data";
import { expect, test } from "./fixtures";

const WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

/** Roda o axe e falha com a lista legível: regra, impacto, onde e por quê. */
async function expectAccessible(page: Page, where: string) {
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  const report = violations.map(
    (v) => `${v.id} (${v.impact}) — ${v.help}\n${v.nodes.map((n) => `    ${n.target.join(" ")}: ${n.failureSummary}`).join("\n")}`,
  );
  expect(report, `acessibilidade em ${where}`).toEqual([]);
}

// Os caminhos dependem dos dados da execução, que o globalSetup gera depois de os arquivos de teste serem lidos:
// por isso são funções, chamadas dentro do teste. Telas públicas abertas logadas: não somam às requisições de
// visitante da suíte (limite por IP, D30).
type Screen = { name: string; who: "ana" | "seller" | null; path: (f: Fixtures) => string; ready: string | RegExp };
const SCREENS: Screen[] = [
  { name: "início", who: "ana", path: () => "/", ready: /Ao vivo agora|Em breve na vitrine/ },
  { name: "vitrine", who: "ana", path: (f) => `/lotes?q=${f.run}`, ready: "Vitrine" },
  { name: "sala (licitante)", who: "ana", path: (f) => `/lotes/${f.lots.open}`, ready: "Seu lance" },
  { name: "carteira", who: "ana", path: () => "/carteira", ready: "Seu saldo" },
  { name: "meus arremates", who: "ana", path: () => "/arremates", ready: "Encerrados" },
  { name: "painel", who: "seller", path: () => "/painel", ready: "Seus lotes" },
  { name: "auditoria", who: "ana", path: (f) => `/lotes/${f.lots.sold}/auditoria`, ready: "Histórico íntegro" },
  { name: "comprovante", who: "ana", path: (f) => `/comprovante/${f.receipts.sold}`, ready: "Comprovante autêntico" },
  { name: "sala (visitante)", who: null, path: (f) => `/lotes/${f.lots.open}`, ready: "Entre para dar lances" },
  { name: "entrar", who: null, path: () => "/entrar", ready: "Entrar" },
  { name: "cadastro", who: null, path: () => "/cadastro", ready: "Criar conta" },
];

for (const scheme of ["light", "dark"] as const) {
  test.describe(`acessibilidade, tema ${scheme === "light" ? "claro" : "escuro"}`, () => {
    for (const screen of SCREENS) {
      test(screen.name, async ({ page: visitor, as, fixtures }) => {
        const page = screen.who ? await as(screen.who) : visitor;
        await page.emulateMedia({ colorScheme: scheme }); // o tema padrão segue o do sistema
        await page.goto(screen.path(fixtures));
        await expect(page.getByText(screen.ready).first()).toBeVisible();
        await expectAccessible(page, `${screen.name} (${scheme})`);
      });
    }
  });
}
