import { describe, expect, it } from "vitest";

import { amountInput, clockTime, lotNumber, money, remaining } from "./format";
import { parseMoney } from "./money-input";

describe("money", () => {
  it("formata em reais, com espaço inseparável depois do R$", () => {
    expect(money("1250.00")).toBe("R$ 1.250,00");
    expect(money("99.5")).toBe("R$ 99,50");
  });
});

describe("clockTime", () => {
  it("mostra o horário de Brasília, igual no servidor e no navegador", () => {
    const text = clockTime("2026-10-23T17:30:00Z"); // 14:30 em São Paulo (UTC−3)

    expect(text).toContain("23");
    expect(text).toContain("14:30");
  });
});

describe("remaining", () => {
  it.each([
    [2 * 86_400_000 + 3 * 3_600_000, "2 d 3 h"],
    [2 * 3_600_000 + 5 * 60_000, "2 h 05 min"],
    [4 * 60_000 + 9_000, "4 min 09 s"],
    [45_000, "45 s"],
    [0, "encerrando…"],
    [-5_000, "encerrando…"],
  ])("%i ms → %s", (ms, text) => {
    expect(remaining(ms)).toBe(text);
  });
});

describe("lotNumber", () => {
  it("usa três dígitos, como num catálogo", () => {
    expect(lotNumber(7)).toBe("007");
    expect(lotNumber(1234)).toBe("1234");
  });
});

describe("amountInput", () => {
  it("formata para o campo e volta igual pelo parseMoney", () => {
    expect(amountInput("1050.00")).toBe("1.050,00");
    expect(parseMoney(amountInput("1234567.80"))).toBe("1234567.80");
  });
});
