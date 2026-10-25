import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BackendError } from "@/lib/server-api";

import { Unavailable } from "./unavailable";

describe("Unavailable", () => {
  it("servidor fora: diz isso e oferece tentar de novo", () => {
    render(<Unavailable what="A sala deste lote" error={new BackendError(0)} retryHref="/lotes/7" />);

    expect(screen.getByRole("alert")).toHaveTextContent("A sala deste lote está indisponível no momento.");
    expect(screen.getByRole("link", { name: "Tentar de novo" })).toHaveAttribute("href", "/lotes/7");
  });

  it("limite de visitas (429): não culpa o servidor, pede para esperar", () => {
    render(<Unavailable what="A vitrine" error={new BackendError(429)} retryHref="/lotes" />);

    expect(screen.getByRole("alert")).toHaveTextContent("Muitas páginas abertas em sequência");
    expect(screen.getByRole("alert")).not.toHaveTextContent("servidor");
  });
});
