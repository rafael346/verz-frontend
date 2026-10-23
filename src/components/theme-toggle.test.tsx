import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { fakeApi, renderWithProviders } from "@/test/render";
import { ThemeToggle } from "./theme-toggle";

describe("ThemeToggle", () => {
  it("troca para o tema escuro e marca a opção escolhida", async () => {
    fakeApi({});
    renderWithProviders(<ThemeToggle />);

    await userEvent.click(screen.getByRole("button", { name: "Escuro" }));

    await waitFor(() => expect(document.documentElement).toHaveClass("dark"));
    expect(screen.getByRole("button", { name: "Escuro" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Claro" })).toHaveAttribute("aria-pressed", "false");
  });
});
