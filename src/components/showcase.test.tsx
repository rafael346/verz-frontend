import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { readShowcaseParams } from "@/lib/lots";

import { Pagination, ShowcaseEmpty, ShowcaseToolbar } from "./showcase";

describe("ShowcaseToolbar", () => {
  it("marca a fase atual e mantém a busca ao trocar de aba", () => {
    render(<ShowcaseToolbar state={readShowcaseParams({ fase: "agendados", q: "gogh" })} />);

    expect(screen.getByRole("link", { name: "Agendados" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Encerrados" })).toHaveAttribute("href", "/lotes?fase=encerrados&q=gogh");
    expect(screen.getByRole("searchbox", { name: "Buscar no catálogo" })).toHaveValue("gogh");
  });
});

describe("Pagination", () => {
  it("some quando tudo cabe numa página", () => {
    const { container } = render(<Pagination state={readShowcaseParams({})} count={20} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("leva para a página anterior e a próxima mantendo fase e busca", () => {
    render(<Pagination state={readShowcaseParams({ fase: "encerrados", q: "elmo", pagina: "2" })} count={61} />);

    expect(screen.getByText("Página 2 de 4")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Anteriores" })).toHaveAttribute("href", "/lotes?fase=encerrados&q=elmo");
    expect(screen.getByRole("link", { name: "Próximos" })).toHaveAttribute(
      "href",
      "/lotes?fase=encerrados&q=elmo&pagina=3",
    );
  });
});

describe("ShowcaseEmpty", () => {
  it("com busca, explica e oferece limpar", () => {
    render(<ShowcaseEmpty state={readShowcaseParams({ q: "zzz" })} />);

    expect(screen.getByText("Nada encontrado para “zzz”.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Limpar a busca" })).toHaveAttribute("href", "/lotes");
  });

  it("sem lotes ao vivo, aponta para os agendados", () => {
    render(<ShowcaseEmpty state={readShowcaseParams({})} />);

    expect(screen.getByRole("link", { name: "Ver os lotes agendados" })).toHaveAttribute("href", "/lotes?fase=agendados");
  });
});
