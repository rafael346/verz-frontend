import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LotGrid, Pagination, ShowcaseEmpty, ShowcaseToolbar, ShowcaseUnavailable } from "@/components/showcase";
import type { Lot, Page } from "@/lib/lots";
import { PHASES, readShowcaseParams, showcaseHref } from "@/lib/lots";
import { BackendError, backendGet } from "@/lib/server-api";

export const metadata: Metadata = {
  title: "Vitrine",
  description: "Lotes ao vivo, agendados e encerrados de obras em domínio público.",
};

// Concordância: "1 lote agendado", "3 lotes agendados".
const SUMMARY = {
  live: ["lote em pregão agora", "lotes em pregão agora"],
  scheduled: ["lote agendado", "lotes agendados"],
  ended: ["lote encerrado", "lotes encerrados"],
} as const;

export default async function ShowcasePage({ searchParams }: PageProps<"/lotes">) {
  const state = readShowcaseParams(await searchParams);
  const query = new URLSearchParams({ phase: state.phase, page: String(state.page) });
  if (state.q) query.set("q", state.q);

  let page: Page<Lot> | null = null;
  let pageOutOfRange = false;
  try {
    page = await backendGet<Page<Lot>>(`/api/lots/?${query}`);
  } catch (error) {
    pageOutOfRange = error instanceof BackendError && error.status === 404 && state.page > 1;
  }
  // Página que não existe mais (os lotes mudaram de fase): volta para a primeira, sem tela de erro.
  if (pageOutOfRange) redirect(showcaseHref({ ...state, page: 1 }));

  const label = PHASES.find((entry) => entry.slug === state.slug)!.label;
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <p className="kicker">Catálogo da sessão · {label}</p>
        <h1 className="display text-5xl font-light">Vitrine</h1>
        {page ? (
          <p aria-live="polite" className="figures text-muted">
            {page.count} {SUMMARY[state.phase][page.count === 1 ? 0 : 1]}
            {state.q ? <> para “{state.q}”</> : null}.
          </p>
        ) : null}
      </header>
      <ShowcaseToolbar state={state} />
      {page === null ? (
        <ShowcaseUnavailable retryHref={showcaseHref(state)} />
      ) : page.results.length ? (
        <section aria-labelledby="lotes-titulo">
          <h2 id="lotes-titulo" className="sr-only">
            Lotes {label.toLowerCase()}
          </h2>
          <LotGrid lots={page.results} eagerFirst={3} />
        </section>
      ) : (
        <ShowcaseEmpty state={state} />
      )}
      {page ? <Pagination state={state} count={page.count} /> : null}
    </div>
  );
}
