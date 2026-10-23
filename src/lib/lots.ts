/** Tipos da API de lotes e o estado da vitrine na URL (?fase=&q=&pagina=). */

export type Phase = "live" | "scheduled" | "ended";

export type Lot = {
  id: number;
  title: string;
  artist: string;
  date: string;
  medium: string;
  dimensions: string;
  culture: string;
  department: string;
  source_url: string;
  image_url: string;
  starting_bid: string;
  min_increment: string;
  starts_at: string;
  ends_at: string;
  phase: Phase;
  current_bid: string | null;
  bid_count: number;
  min_next_bid: string;
};

export type Page<T> = { count: number; next: string | null; previous: string | null; results: T[] };

export const PAGE_SIZE = 20; // igual ao LotPagination do backend
export const MAX_QUERY = 100; // igual ao ShowcaseParams do backend

export const PHASES = [
  { slug: "ao-vivo", phase: "live", label: "Ao vivo" },
  { slug: "agendados", phase: "scheduled", label: "Agendados" },
  { slug: "encerrados", phase: "ended", label: "Encerrados" },
] as const;

export type PhaseSlug = (typeof PHASES)[number]["slug"];
export type ShowcaseState = { phase: Phase; slug: PhaseSlug; q: string; page: number };

type SearchParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

/** Lê os parâmetros da URL sem confiar neles: valor inválido vira o padrão, nunca uma página quebrada. */
export function readShowcaseParams(params: SearchParams): ShowcaseState {
  const entry = PHASES.find((p) => p.slug === first(params.fase)) ?? PHASES[0];
  const page = Number.parseInt(first(params.pagina), 10);
  return {
    phase: entry.phase,
    slug: entry.slug,
    q: first(params.q).trim().slice(0, MAX_QUERY),
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

export function showcaseHref({ slug, q, page }: { slug: PhaseSlug; q: string; page: number }): string {
  const query = new URLSearchParams();
  if (slug !== "ao-vivo") query.set("fase", slug);
  if (q) query.set("q", q);
  if (page > 1) query.set("pagina", String(page));
  const text = query.toString();
  return text ? `/lotes?${text}` : "/lotes";
}
