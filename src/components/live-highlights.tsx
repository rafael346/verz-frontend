import Link from "next/link";

import type { Lot, Page } from "@/lib/lots";
import { backendGet } from "@/lib/server-api";

import { LotGrid } from "./showcase";

async function firstLots(phase: "live" | "scheduled"): Promise<Lot[] | null> {
  try {
    return (await backendGet<Page<Lot>>(`/api/lots/?phase=${phase}`)).results.slice(0, 3);
  } catch {
    return null;
  }
}

/** Destaques da home: o que está em pregão agora; se não houver nada, o que abre em seguida. */
export async function LiveHighlights() {
  const live = await firstLots("live");
  const scheduled = live?.length ? [] : await firstLots("scheduled");
  const lots = live?.length ? live : (scheduled ?? []);
  const showingLive = Boolean(live?.length);

  return (
    <section aria-labelledby="destaques" className="flex flex-col gap-6">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="destaques" className="display text-3xl">
          {showingLive ? "Ao vivo agora" : "Em breve na vitrine"}
        </h2>
        <Link href={showingLive ? "/lotes" : "/lotes?fase=agendados"} className="ink-link pb-0.5 text-sm">
          Ver toda a vitrine <span aria-hidden>→</span>
        </Link>
      </div>
      {lots.length ? (
        <LotGrid lots={lots} />
      ) : (
        <p className="display border border-border bg-card px-6 py-10 text-xl text-muted italic">
          {live === null ? "A vitrine está indisponível no momento." : "A próxima sessão ainda não foi anunciada."}
        </p>
      )}
    </section>
  );
}
