import { expect, test } from "./fixtures";

test.describe("vitrine (visitante)", () => {
  test("lista, filtra pela URL e abre a sala do lote", async ({ page, fixtures }) => {
    const title = `Obra de teste ${fixtures.run}`;

    await page.goto(`/lotes?q=${fixtures.run}`);
    const card = page.getByRole("link", { name: title }).and(page.locator(`[href="/lotes/${fixtures.lots.open}"]`));
    await expect(card).toBeVisible();
    // O cancelado e o agendado não aparecem entre os ao vivo; o agendado tem a aba dele.
    await page.goto(`/lotes?fase=agendados&q=${fixtures.run}`);
    await expect(page.locator(`[href="/lotes/${fixtures.lots.scheduled}"]`)).toBeVisible();
    await expect(page.locator(`[href="/lotes/${fixtures.lots.open}"]`)).toHaveCount(0);

    await page.goto(`/lotes?q=nada-${fixtures.run}`);
    await expect(page.getByText(/Nada encontrado para/)).toBeVisible();
    await expect(page.getByRole("link", { name: "Limpar a busca" })).toBeVisible();

    await page.goto(`/lotes?q=${fixtures.run}`);
    await page.locator(`[href="/lotes/${fixtures.lots.open}"]`).click();
    await expect(page).toHaveURL(new RegExp(`/lotes/${fixtures.lots.open}$`));
    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
    await expect(page.getByRole("link", { name: "Entre para dar lances" })).toHaveAttribute("href", "/entrar");
  });
});
