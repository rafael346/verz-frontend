import { alertOf, allowConsoleError, expect, test } from "./fixtures";

test("cadastro de licitante, sair e senha errada", async ({ page, fixtures }) => {
  const email = `e2e-${fixtures.run}-nova@example.test`;

  await page.goto("/cadastro");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(`senha-forte-${fixtures.run}`);
  await page.getByRole("radio", { name: /Licitante/ }).check();
  await page.getByRole("button", { name: "Criar conta" }).click();
  const header = page.getByRole("banner");
  await expect(header.getByText(email)).toBeVisible();
  await expect(header.getByText("Licitante", { exact: true })).toBeVisible();

  await header.getByRole("button", { name: "Sair" }).click();
  await expect(header.getByRole("link", { name: "Entrar" })).toBeVisible();

  // Um login de formulário só: o limite é de 5 por minuto por IP.
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill("senha-errada-123");
  allowConsoleError(page, 400); // a senha errada responde 400
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(alertOf(page)).toContainText("E-mail ou senha inválidos.");
});
