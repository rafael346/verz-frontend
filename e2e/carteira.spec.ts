import { brl, expect, test, wallet } from "./fixtures";

// Bia: nesta suíte o total dela só muda por depósito (não arremata nada), então a conta é exata.
test("depósito pelo atalho atualiza o total e o disponível", async ({ as }) => {
  const bia = await as("bia");
  await bia.goto("/carteira");
  const before = await wallet(bia);
  const summary = bia.getByRole("region", { name: "Saldo" });
  await expect(summary).toContainText(brl(before.balance));

  await bia.getByRole("button", { name: "R$ 500" }).click();
  await bia.getByRole("button", { name: "Depositar" }).click();

  await expect(bia.getByRole("status")).toContainText(`Depósito de ${brl(500)} feito`);
  await expect(summary).toContainText(brl(before.balance + 500));
  await expect(summary).toContainText(brl(before.available + 500));
});
