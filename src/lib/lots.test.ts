import { describe, expect, it } from "vitest";

import { readShowcaseParams, showcaseHref } from "./lots";

describe("readShowcaseParams", () => {
  it("usa ao vivo, sem busca e página 1 por padrão", () => {
    expect(readShowcaseParams({})).toEqual({ phase: "live", slug: "ao-vivo", q: "", page: 1 });
  });

  it("aceita as fases em português", () => {
    expect(readShowcaseParams({ fase: "encerrados" }).phase).toBe("ended");
    expect(readShowcaseParams({ fase: "agendados" }).phase).toBe("scheduled");
  });

  it("ignora valores inválidos em vez de quebrar a página", () => {
    expect(readShowcaseParams({ fase: "cancelados", pagina: "-3" })).toMatchObject({ phase: "live", page: 1 });
    expect(readShowcaseParams({ pagina: "abc" }).page).toBe(1);
    expect(readShowcaseParams({ fase: ["agendados", "x"] }).phase).toBe("scheduled");
  });

  it("apara a busca e corta em 100 caracteres, o limite da API", () => {
    expect(readShowcaseParams({ q: "  van gogh  " }).q).toBe("van gogh");
    expect(readShowcaseParams({ q: "x".repeat(150) }).q).toHaveLength(100);
  });
});

describe("showcaseHref", () => {
  it("omite os valores padrão e codifica a busca", () => {
    expect(showcaseHref({ slug: "ao-vivo", q: "", page: 1 })).toBe("/lotes");
    expect(showcaseHref({ slug: "encerrados", q: "van gogh", page: 2 })).toBe(
      "/lotes?fase=encerrados&q=van+gogh&pagina=2",
    );
  });
});
