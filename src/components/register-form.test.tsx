import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { RegisterForm } from "./register-form";
import { fakeApi, json, push, renderWithProviders } from "@/test/render";

async function fill(email = "leo@example.com") {
  await userEvent.type(screen.getByLabelText("E-mail"), email);
  await userEvent.type(screen.getByLabelText("Senha"), "senha-forte-123");
}

describe("RegisterForm", () => {
  it("cria a conta com o papel escolhido", async () => {
    const calls = fakeApi({
      "POST /api/auth/register/": () => json(201, { id: 2, email: "leo@example.com", role: "seller" }),
    });
    renderWithProviders(<RegisterForm />);

    await fill();
    await userEvent.click(screen.getByLabelText(/Leiloeiro/));
    await userEvent.click(screen.getByRole("button", { name: "Criar conta" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/"));
    expect(calls.find((c) => c.key === "POST /api/auth/register/")?.body).toEqual({
      email: "leo@example.com",
      password: "senha-forte-123",
      role: "seller",
    });
  });

  it("começa como licitante", () => {
    fakeApi({});
    renderWithProviders(<RegisterForm />);

    expect(screen.getByLabelText(/Licitante/)).toBeChecked();
  });

  it("pede uma senha de pelo menos 10 caracteres antes de enviar", async () => {
    const calls = fakeApi({});
    renderWithProviders(<RegisterForm />);

    await userEvent.type(screen.getByLabelText("E-mail"), "leo@example.com");
    await userEvent.type(screen.getByLabelText("Senha"), "curta");
    await userEvent.click(screen.getByRole("button", { name: "Criar conta" }));

    const password = screen.getByLabelText("Senha");
    expect(password).toHaveAccessibleDescription("A senha precisa ter pelo menos 10 caracteres.");
    expect(password).toHaveFocus();
    expect(calls.filter((c) => c.key.startsWith("POST"))).toEqual([]);
  });

  it("mostra o erro do servidor junto ao campo", async () => {
    fakeApi({ "POST /api/auth/register/": () => json(400, { email: ["Este e-mail já está cadastrado."] }) });
    renderWithProviders(<RegisterForm />);

    await fill();
    await userEvent.click(screen.getByRole("button", { name: "Criar conta" }));

    const email = screen.getByLabelText("E-mail");
    await waitFor(() => expect(email).toHaveAttribute("aria-invalid", "true"));
    expect(email).toHaveAccessibleDescription("Este e-mail já está cadastrado.");
  });
});
