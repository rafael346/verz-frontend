import { expect, test, wallet } from "./fixtures";

const REASON = "A obra precisa de restauro antes da venda.";
const lotLabel = (id: number) => `Lote ${String(id).padStart(3, "0")}`;

test("cancelar com lances libera o comprometido; cancelar um arremate estorna", async ({ as, fixtures }) => {
  const [seller, ana, bia] = [await as("seller"), await as("ana"), await as("bia")];
  await bia.goto(`/lotes/${fixtures.lots.disputed}`);
  await expect(bia.getByText("Atualizando em tempo real")).toBeVisible();
  const biaBefore = await wallet(bia); // a Bia lidera o lote disputado (R$ 1.050,00)

  await seller.goto("/painel");
  const disputed = seller.getByRole("listitem").filter({ hasText: lotLabel(fixtures.lots.disputed) });
  await disputed.getByRole("button", { name: "Cancelar lote" }).click();
  await expect(disputed).toContainText("O valor reservado de quem está ganhando será liberado.");
  await disputed.getByLabel(/Motivo/).fill(REASON);
  await disputed.getByRole("button", { name: "Sim, cancelar" }).click();
  await expect(disputed).toContainText(`Cancelado: ${REASON}`);

  await expect(bia.getByText(`Este lote foi cancelado pelo leiloeiro: ${REASON}`)).toBeVisible();
  await expect(bia.getByRole("button", { name: "Dar lance" })).toHaveCount(0);
  expect((await wallet(bia)).committed).toBe(biaBefore.committed - 1050);

  const anaBefore = await wallet(ana);
  const sold = seller.getByRole("listitem").filter({ hasText: lotLabel(fixtures.lots.sold_to_cancel) });
  await sold.getByRole("button", { name: "Cancelar lote" }).click();
  await expect(sold).toContainText("R$ 800,00 voltam para o arrematante e saem do seu saldo.");
  await sold.getByLabel(/Motivo/).fill("Arrematante pediu desistência.");
  await sold.getByRole("button", { name: "Sim, cancelar" }).click();
  await expect(sold).toContainText("R$ 800,00 estornados ao arrematante");
  expect((await wallet(ana)).balance).toBe(anaBefore.balance + 800);

  await ana.goto(`/comprovante/${fixtures.receipts.sold_to_cancel}`);
  await expect(ana.getByRole("heading", { level: 1 })).toHaveText("Arremate cancelado");
  await ana.goto(`/lotes/${fixtures.lots.sold_to_cancel}/auditoria`);
  await expect(ana.getByRole("heading", { level: 1 })).toHaveText("Histórico íntegro");
});
