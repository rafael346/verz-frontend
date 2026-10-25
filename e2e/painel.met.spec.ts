import { expect, test } from "./fixtures";

// Depende do Met no ar: roda à parte (npm run e2e:met), para a suíte principal não cair junto com o museu.
test("leiloeiro busca no Met e cria um lote @met", async ({ as }) => {
  const seller = await as("seller");
  await seller.goto("/painel");
  await seller.getByRole("searchbox", { name: "Buscar no acervo do Met" }).fill("sunflowers");
  await seller.getByRole("button", { name: "Buscar obras" }).click();
  await seller.getByRole("button", { name: /^Escolher Sunflowers/ }).first().click({ timeout: 45_000 });

  const form = seller.getByRole("form", { name: "Condições do lote" });
  await form.getByLabel("Lance inicial").fill("1.000,00");
  await form.getByLabel("Incremento mínimo").fill("50");
  await form.getByRole("button", { name: "Criar lote" }).click();

  const created = seller.getByRole("status").filter({ hasText: /Lote \d+ criado/ });
  await expect(created).toBeVisible({ timeout: 45_000 });
  const id = (await created.innerText()).match(/Lote (\d+)/)![1];
  await expect(seller.getByRole("listitem").filter({ hasText: `Lote ${id}` })).toContainText("Sunflowers");
});
