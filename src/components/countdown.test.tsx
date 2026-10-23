import { act, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { clockTime } from "@/lib/format";

import { Countdown } from "./countdown";

const NOW = new Date("2026-10-23T17:00:00Z").getTime();
const inSeconds = (s: number) => new Date(NOW + s * 1000).toISOString();

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});
afterEach(() => vi.useRealTimers());

describe("Countdown", () => {
  it("no servidor mostra o horário fixo de Brasília (sem erro de hidratação)", () => {
    const html = renderToString(<Countdown to={inSeconds(3600)} />);

    expect(html).toContain(clockTime(inSeconds(3600)));
    expect(html).not.toContain(" min");
  });

  it("no navegador mostra o tempo restante e atualiza a cada segundo", () => {
    render(<Countdown to={inSeconds(65)} />);

    expect(screen.getByText("em 1 min 05 s")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(6000));
    expect(screen.getByText("em 59 s")).toBeInTheDocument();
  });

  it("destaca os últimos 2 minutos de um pregão e avisa da prorrogação", () => {
    render(<Countdown to={inSeconds(110)} urgentHint="Um lance agora prorroga o pregão." />);

    expect(screen.getByRole("time")).toHaveAttribute("data-urgent", "true");
    expect(screen.getByText("Um lance agora prorroga o pregão.")).toBeInTheDocument();
  });

  it("sem dica de urgência (ex.: abertura), não destaca", () => {
    render(<Countdown to={inSeconds(30)} />);

    expect(screen.getByRole("time")).not.toHaveAttribute("data-urgent");
  });

  it("ao chegar a zero mostra que está encerrando", () => {
    render(<Countdown to={inSeconds(2)} />);

    act(() => vi.advanceTimersByTime(3000));
    expect(screen.getByText("encerrando…")).toBeInTheDocument();
  });
});
