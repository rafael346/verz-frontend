import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { fakeApi, json, renderWithProviders } from "@/test/render";

import { HeroActions } from "./hero-actions";

describe("HeroActions", () => {
  it("convida o visitante a criar conta", async () => {
    fakeApi({});
    renderWithProviders(<HeroActions />);

    expect(await screen.findByRole("link", { name: "Criar conta para dar lances" })).toHaveAttribute("href", "/cadastro");
  });

  it("não pede para criar conta a quem já entrou", async () => {
    fakeApi({ "GET /api/auth/me/": () => json(200, { id: 1, email: "leo@example.com", role: "seller" }) });
    renderWithProviders(<HeroActions />);

    expect(await screen.findByRole("link", { name: "Ver a vitrine" })).toBeInTheDocument();
    expect(screen.queryByText("Criar conta para dar lances")).not.toBeInTheDocument();
  });
});
