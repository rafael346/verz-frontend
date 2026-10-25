import { expect, test, timedLot } from "./fixtures";

test("o lote acaba, o worker liquida e o comprovante chega", async ({ as }) => {
  test.setTimeout(90_000); // 20 s de pregão + a volta do worker + a navegação até o comprovante
  const lot = timedLot("liquidacao"); // termina em 20 s, com lance da Ana
  const ana = await as("ana");
  await ana.goto(`/lotes/${lot}`);
  await expect(ana.getByText("Você está ganhando")).toBeVisible();

  // Ao vivo, sem recarregar: o fim, a liquidação pelo worker e o resultado.
  await expect(ana.getByText("Você arrematou este lote")).toBeVisible({ timeout: 60_000 });
  await ana.getByRole("link", { name: "Ver o comprovante em Meus arremates" }).click();

  const row = ana.getByRole("listitem").filter({ hasText: `Lote ${String(lot).padStart(3, "0")}` });
  await expect(row).toContainText("Arrematado por R$");
  await row.getByRole("link", { name: "Ver comprovante" }).click();
  await expect(ana.getByRole("heading", { level: 1 })).toHaveText("Comprovante autêntico");
  await expect(ana.getByRole("list", { name: "Verificações" }).getByText("Confere")).toHaveCount(3);
});
