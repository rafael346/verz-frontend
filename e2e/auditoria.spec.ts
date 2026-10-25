import { allowConsoleError, expect, test } from "./fixtures";

test.describe("auditoria e comprovante públicos (visitante)", () => {
  test("conferem sem login; token inexistente vai para a página não encontrada", async ({ page, fixtures }) => {
    await page.goto(`/lotes/${fixtures.lots.sold}/auditoria`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Histórico íntegro");
    const bids = page.getByRole("list", { name: "Lances auditados" }).getByRole("listitem");
    await expect(bids).toHaveCount(1);
    await expect(bids.first()).toContainText("Confere");

    await page.goto(`/comprovante/${fixtures.receipts.sold}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Comprovante autêntico");
    await expect(page.getByRole("list", { name: "Verificações" }).getByText("Confere")).toHaveCount(3);

    allowConsoleError(page, 404);
    await page.goto("/comprovante/naoexiste123");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Esta página não está no catálogo.");
  });
});
