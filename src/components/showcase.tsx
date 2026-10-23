import Link from "next/link";

import type { Lot, ShowcaseState } from "@/lib/lots";
import { PAGE_SIZE, PHASES, showcaseHref } from "@/lib/lots";

import { primaryButton } from "./field";
import { LotCard } from "./lot-card";

/** Abas de fase e busca. Tudo vira parâmetro na URL: funciona sem JavaScript e pode ser compartilhado. */
export function ShowcaseToolbar({ state }: { state: ShowcaseState }) {
  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <nav aria-label="Fases do leilão" className="flex gap-5 sm:gap-6">
        {PHASES.map((entry) => (
          <Link
            key={entry.slug}
            href={showcaseHref({ slug: entry.slug, q: state.q, page: 1 })}
            aria-current={entry.slug === state.slug ? "page" : undefined}
            className="ink-link kicker pb-1 text-sm whitespace-nowrap aria-[current=page]:text-foreground"
          >
            {entry.label}
          </Link>
        ))}
      </nav>
      <form action="/lotes" method="get" role="search" className="flex w-full max-w-md items-end gap-2">
        {state.slug !== "ao-vivo" ? <input type="hidden" name="fase" value={state.slug} /> : null}
        <label className="flex flex-1 flex-col gap-1.5">
          <span className="kicker text-foreground">Buscar no catálogo</span>
          <input
            type="search"
            name="q"
            defaultValue={state.q}
            maxLength={100}
            autoComplete="off"
            spellCheck={false}
            placeholder="Obra, artista, cultura…"
            className="rounded-[3px] border border-border bg-background px-3 py-2 placeholder:text-muted focus-visible:border-foreground"
          />
        </label>
        <button type="submit" className={`${primaryButton} px-4 py-2 text-sm`}>
          Buscar
        </button>
      </form>
    </div>
  );
}

/** `eagerFirst`: a primeira linha está acima da dobra e carrega já (é o que define a carga percebida). */
export function LotGrid({ lots, eagerFirst = 0 }: { lots: Lot[]; eagerFirst?: number }) {
  return (
    // Filetes por cartão (direita e baixo) e na grade (esquerda e topo): sobra de linha incompleta fica cor de papel.
    // grid-cols-1 e min-w-0: sem eles, uma técnica longa alarga a coluna além da tela no celular.
    <ul className="catalog-enter grid grid-cols-1 border-t border-l border-border sm:grid-cols-2 lg:grid-cols-3">
      {lots.map((lot, index) => (
        <li key={lot.id} className="flex min-w-0 border-r border-b border-border">
          <LotCard lot={lot} eager={index < eagerFirst} />
        </li>
      ))}
    </ul>
  );
}

const EMPTY = {
  live: "Nenhum lote está em pregão agora.",
  scheduled: "Nenhum lote agendado no momento.",
  ended: "Nenhum lote encerrado ainda.",
} as const;

/** Página de catálogo em branco: diz o que aconteceu e oferece o próximo passo. */
export function ShowcaseEmpty({ state }: { state: ShowcaseState }) {
  return (
    <div className="flex flex-col items-start gap-4 border border-border bg-card px-6 py-12 sm:px-10">
      <p className="display text-2xl italic">
        {state.q ? <>Nada encontrado para “{state.q}”.</> : EMPTY[state.phase]}
      </p>
      {state.q ? (
        <Link href={showcaseHref({ slug: state.slug, q: "", page: 1 })} className="text-link text-sm">
          Limpar a busca
        </Link>
      ) : state.phase === "live" ? (
        <Link href={showcaseHref({ slug: "agendados", q: "", page: 1 })} className="text-link text-sm">
          Ver os lotes agendados
        </Link>
      ) : null}
    </div>
  );
}

export function ShowcaseUnavailable({ retryHref }: { retryHref: string }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-4 border-l-2 border-accent bg-card px-6 py-10">
      <p className="display text-2xl">A vitrine está indisponível no momento.</p>
      <p className="text-sm text-muted">Não conseguimos falar com o servidor de lotes. Tente de novo em instantes.</p>
      <Link href={retryHref} className="text-link text-sm">
        Tentar de novo
      </Link>
    </div>
  );
}

export function Pagination({ state, count }: { state: ShowcaseState; count: number }) {
  const pages = Math.ceil(count / PAGE_SIZE);
  if (pages <= 1) return null;
  const link = (page: number) => showcaseHref({ slug: state.slug, q: state.q, page });
  return (
    <nav aria-label="Páginas da vitrine" className="flex items-center justify-between border-t border-border pt-4 text-sm">
      {state.page > 1 ? (
        <Link href={link(state.page - 1)} rel="prev" className="ink-link pb-0.5">
          <span aria-hidden>←</span> Anteriores
        </Link>
      ) : (
        <span />
      )}
      <span className="kicker figures">
        Página {state.page} de {pages}
      </span>
      {state.page < pages ? (
        <Link href={link(state.page + 1)} rel="next" className="ink-link pb-0.5">
          Próximos <span aria-hidden>→</span>
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
