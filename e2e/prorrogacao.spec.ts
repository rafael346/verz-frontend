import { expect, test, timedLot } from "./fixtures";

test("lance nos últimos 2 minutos prorroga o pregão para quem está assistindo", async ({ as }) => {
  const lot = timedLot("prorrogacao"); // termina em 90 s
  const [ana, bia] = [await as("ana"), await as("bia")];
  for (const page of [ana, bia]) {
    await page.goto(`/lotes/${lot}`);
    await expect(page.getByText("Atualizando em tempo real")).toBeVisible();
  }
  await expect(ana.getByText("Um lance agora prorroga o pregão.")).toBeVisible();

  await bia.getByRole("button", { name: "Dar lance" }).click();

  await expect(ana.getByRole("status").filter({ hasText: "Pregão prorrogado até" })).toBeVisible();
  // O fim andou 2 minutos: sai da janela de urgência.
  await expect(ana.getByText("Um lance agora prorroga o pregão.")).toBeHidden();
});
