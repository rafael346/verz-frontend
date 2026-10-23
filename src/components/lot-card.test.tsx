import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { Lot } from "@/lib/lots";

import { LotCard } from "./lot-card";

const base: Lot = {
  id: 12,
  title: "Girassóis",
  artist: "Vincent van Gogh",
  date: "1887",
  medium: "Óleo sobre tela",
  dimensions: "43 x 61 cm",
  culture: "",
  department: "European Paintings",
  source_url: "",
  image_url: "/api/lots/12/image/",
  starting_bid: "100.00",
  min_increment: "10.00",
  starts_at: "2026-10-23T12:00:00Z",
  ends_at: "2026-10-23T18:00:00Z",
  phase: "live",
  current_bid: null,
  bid_count: 0,
  min_next_bid: "100.00",
};

describe("LotCard", () => {
  it("mostra número, obra, artista e imagem descrita", () => {
    render(<LotCard lot={base} />);

    expect(screen.getByText("Lote 012")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Girassóis" })).toBeInTheDocument();
    expect(screen.getByText("Vincent van Gogh")).toBeInTheDocument();
    const image = screen.getByRole("img", { name: "Girassóis, Vincent van Gogh" });
    expect(image).toHaveAttribute("src", "/api/lots/12/image/");
    expect(image).toHaveAttribute("loading", "lazy");
    expect(image).toHaveAttribute("width");
  });

  it("ao vivo sem lances mostra o lance inicial e quando termina", () => {
    render(<LotCard lot={base} />);

    expect(screen.getByText("Lance inicial")).toBeInTheDocument();
    expect(screen.getByText("R$ 100,00")).toBeInTheDocument();
    expect(screen.getByText("Termina")).toBeInTheDocument();
  });

  it("ao vivo com lances mostra o lance atual e quantos lances houve", () => {
    render(<LotCard lot={{ ...base, current_bid: "1250.00", bid_count: 3 }} />);

    expect(screen.getByText("Lance atual")).toBeInTheDocument();
    expect(screen.getByText("R$ 1.250,00")).toBeInTheDocument();
    expect(screen.getByText("3 lances")).toBeInTheDocument();
  });

  it("agendado mostra quando abre", () => {
    render(<LotCard lot={{ ...base, phase: "scheduled" }} />);

    expect(screen.getByText("Abre")).toBeInTheDocument();
  });

  it("encerrado mostra o lance final, ou que fechou sem lances", () => {
    const { rerender } = render(<LotCard lot={{ ...base, phase: "ended", current_bid: "300.00", bid_count: 1 }} />);
    expect(screen.getByText("Lance final")).toBeInTheDocument();
    expect(screen.getByText("1 lance")).toBeInTheDocument();

    rerender(<LotCard lot={{ ...base, phase: "ended" }} />);
    expect(screen.getByText("Encerrado sem lances")).toBeInTheDocument();
  });

  it("não quebra com obra sem artista nem técnica", () => {
    render(<LotCard lot={{ ...base, artist: "", medium: "", date: "" }} />);

    expect(screen.getByRole("img", { name: "Girassóis" })).toBeInTheDocument();
    expect(screen.getByText("Autoria desconhecida")).toBeInTheDocument();
  });
});
