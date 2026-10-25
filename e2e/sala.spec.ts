import { alertOf, allowConsoleError, brl, expect, minimumBid, test, wallet } from "./fixtures";

test("lance ao vivo entre duas licitantes, saldo comprometido e recusas", async ({ as, fixtures }) => {
  const [ana, bia] = [await as("ana"), await as("bia")];
  for (const page of [ana, bia]) {
    await page.goto(`/lotes/${fixtures.lots.open}`);
    await expect(page.getByText("Atualizando em tempo real")).toBeVisible();
  }
  const before = await wallet(ana);
  const minimum = await minimumBid(ana, fixtures.lots.open);
  const available = (page: typeof ana) => page.getByText(/^Disponível/);

  await ana.getByRole("button", { name: "Dar lance" }).click(); // o campo já vem com o mínimo
  await expect(ana.getByText("Você está ganhando")).toBeVisible();
  await expect(available(ana)).toContainText(brl(before.available - minimum));
  // A outra ponta vê o lance sem recarregar.
  await expect(bia.locator("dl").first()).toContainText(brl(minimum));

  await bia.getByRole("button", { name: "Dar lance" }).click(); // mínimo novo: o anterior + incremento
  await expect(bia.getByText("Você está ganhando")).toBeVisible();
  await expect(ana.getByText("Você foi superado")).toBeVisible();
  await expect(available(ana)).toContainText(brl(before.available)); // superada: o comprometido volta

  for (const page of [ana, bia]) allowConsoleError(page, 400); // as recusas respondem 400
  await bia.getByRole("button", { name: "Dar lance" }).click();
  await expect(alertOf(bia)).toContainText("já está ganhando");

  const amount = ana.getByLabel("Seu lance");
  await amount.fill("1,00");
  await ana.getByRole("button", { name: "Dar lance" }).click();
  await expect(alertOf(ana)).toContainText("abaixo do mínimo");

  await amount.fill("999.999,00");
  await ana.getByRole("button", { name: "Dar lance" }).click();
  await expect(alertOf(ana)).toContainText("Saldo disponível insuficiente");
});
