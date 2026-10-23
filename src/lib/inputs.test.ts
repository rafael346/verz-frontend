import { describe, expect, it } from "vitest";

import { fromLocalInput, toLocalInput } from "./datetime";
import { parseMoney } from "./money-input";

describe("parseMoney", () => {
  it.each([
    ["1.250,50", "1250.50"],
    ["1250", "1250.00"],
    ["1250.5", "1250.50"],
    ["1.250", "1250.00"], // ponto de milhar, como se escreve no Brasil
    ["R$ 99,9", "99.90"],
    ["  10,00 ", "10.00"],
    ["1.000.000,00", "1000000.00"],
  ])("%s → %s", (text, value) => {
    expect(parseMoney(text)).toBe(value);
  });

  it.each(["", "abc", "10,555", "-5", "1,2,3", "1.25.0"])("recusa %j", (text) => {
    expect(parseMoney(text)).toBeNull();
  });
});

describe("datetime-local", () => {
  it("ida e volta mantém o mesmo instante, com fuso", () => {
    const moment = new Date(2026, 9, 23, 14, 30);

    expect(toLocalInput(moment)).toBe("2026-10-23T14:30");
    expect(fromLocalInput("2026-10-23T14:30")).toBe(moment.toISOString());
  });

  it("valor vazio ou inválido vira null", () => {
    expect(fromLocalInput("")).toBeNull();
    expect(fromLocalInput("amanhã")).toBeNull();
  });
});
