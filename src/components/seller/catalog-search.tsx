"use client";

import { useState, type FormEvent } from "react";

import { api, ApiError } from "@/lib/api";
import type { CatalogItem, CatalogPage } from "@/lib/lots";

import { FormAlert, primaryButton } from "../field";

/** Passo 1: buscar obras de domínio público com imagem no acervo do Met (via backend, com cache e limites). */
export function CatalogSearch({ onChoose }: { onChoose: (item: CatalogItem) => void }) {
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState("");
  const [items, setItems] = useState<CatalogItem[] | null>(null);
  const [nextOffset, setNextOffset] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load(text: string, offset: number) {
    setLoading(true);
    setError(null);
    try {
      const page = await api<CatalogPage>(`/api/catalog/search/?${new URLSearchParams({ q: text, offset: String(offset) })}`);
      setItems((previous) => (offset ? [...(previous ?? []), ...page.items] : page.items));
      setNextOffset(page.next_offset);
      setSearched(text);
    } catch (failure) {
      setError(failure instanceof ApiError ? failure.message : "Não foi possível buscar agora.");
    } finally {
      setLoading(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = query.trim();
    if (text.length < 2) return setError("Digite pelo menos 2 letras: o nome da obra, do artista ou da cultura.");
    load(text, 0);
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={submit} role="search" className="flex flex-col gap-3 sm:flex-row sm:items-end" noValidate>
        <label className="flex flex-1 flex-col gap-1.5">
          <span className="kicker text-foreground">Buscar no acervo do Met</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            maxLength={100}
            autoComplete="off"
            spellCheck={false}
            placeholder="Ex.: girassóis, samurai, Hokusai…"
            className="rounded-[3px] border border-border bg-background px-3 py-2.5 placeholder:text-muted focus-visible:border-foreground"
          />
        </label>
        <button type="submit" disabled={loading} className={`${primaryButton} border border-transparent px-5 py-3 text-sm`}>
          {loading && !items?.length ? "Buscando…" : "Buscar obras"}
        </button>
      </form>

      {error ? <FormAlert>{error}</FormAlert> : null}

      {items?.length === 0 ? (
        <p className="display text-xl text-muted italic">
          Nenhuma obra de domínio público com imagem para “{searched}”. Tente outra palavra, de preferência em inglês.
        </p>
      ) : null}

      {items?.length ? (
        <ul className="catalog-enter grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" aria-label="Obras encontradas">
          {items.map((item) => (
            <li key={item.external_id} className="flex min-w-0">
              <button
                type="button"
                onClick={() => onChoose(item)}
                aria-label={`Escolher ${[item.title, item.artist].filter(Boolean).join(", ")}`}
                className="pressable group flex w-full min-w-0 flex-col overflow-hidden rounded-[3px] border border-border bg-card text-left hover:border-foreground"
              >
                <span className="flex aspect-square items-center justify-center overflow-hidden bg-background p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element -- miniatura direto do servidor de imagens do Met (liberado na CSP) */}
                  <img src={item.image_url} alt="" width={240} height={240} loading="lazy" decoding="async" className="h-auto max-h-full w-auto max-w-full object-contain" />
                </span>
                <span className="flex flex-col gap-0.5 p-3">
                  <span className="display line-clamp-2 leading-snug">{item.title}</span>
                  <span className="truncate text-xs text-muted">{[item.artist, item.date].filter(Boolean).join(" · ") || "Autoria desconhecida"}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {items?.length && nextOffset !== null ? (
        <button type="button" onClick={() => load(searched, nextOffset)} disabled={loading} className="pressable ink-link self-start pb-0.5 text-sm">
          {loading ? "Buscando mais…" : "Mostrar mais obras"}
        </button>
      ) : null}
    </div>
  );
}
