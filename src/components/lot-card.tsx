import Link from "next/link";

import { bidsCount, clockTime, lotNumber, money } from "@/lib/format";
import type { Lot } from "@/lib/lots";

import { Countdown } from "./countdown";

function Price({ lot }: { lot: Lot }) {
  if (lot.phase === "ended") {
    return lot.current_bid ? (
      <>
        <dt className="kicker">Lance final</dt>
        <dd className="figures display text-2xl">{money(lot.current_bid)}</dd>
        <dd className="text-xs text-muted">{bidsCount(lot.bid_count)}</dd>
      </>
    ) : (
      <>
        <dt className="kicker">Resultado</dt>
        <dd className="display text-lg text-muted italic">Encerrado sem lances</dd>
      </>
    );
  }
  const current = lot.phase === "live" ? lot.current_bid : null;
  return (
    <>
      <dt className="kicker">{current ? "Lance atual" : "Lance inicial"}</dt>
      <dd className="figures display text-2xl">{money(current ?? lot.starting_bid)}</dd>
      <dd className="text-xs text-muted">
        {current ? bidsCount(lot.bid_count) : `Incremento de ${money(lot.min_increment)}`}
      </dd>
    </>
  );
}

function When({ lot }: { lot: Lot }) {
  if (lot.phase === "live") {
    return (
      <>
        <dt className="kicker">Termina</dt>
        <dd className="text-sm">
          <Countdown to={lot.ends_at} urgentHint="Um lance agora prorroga o pregão." />
        </dd>
      </>
    );
  }
  if (lot.phase === "scheduled") {
    return (
      <>
        <dt className="kicker">Abre</dt>
        <dd className="text-sm">
          <Countdown to={lot.starts_at} />
        </dd>
      </>
    );
  }
  return (
    <>
      <dt className="kicker">Encerrou</dt>
      <dd className="text-sm">
        <time dateTime={lot.ends_at}>{clockTime(lot.ends_at)}</time>
      </dd>
    </>
  );
}

/** Lote como uma página de catálogo: obra emoldurada, ficha técnica e o preço da fase em que está; abre a sala do lote. */
export function LotCard({ lot, eager = false }: { lot: Lot; eager?: boolean }) {
  const credit = [lot.date, lot.medium].filter(Boolean).join(" · ");
  return (
    <article className="group relative flex w-full flex-col bg-card">
      {/* overflow-hidden: sem ele, uma obra alta (um rolo japonês) estica a moldura e desalinha a grade. */}
      <div className="flex aspect-[4/5] items-center justify-center overflow-hidden border-b border-border bg-background p-6 sm:p-8">
        {/* eslint-disable-next-line @next/next/no-img-element -- a imagem já é uma cópia servida pela API, na mesma origem e com cache de 1 dia */}
        <img
          src={lot.image_url}
          alt={[lot.title, lot.artist].filter(Boolean).join(", ")}
          width={480}
          height={600}
          loading={eager ? "eager" : "lazy"}
          fetchPriority={eager ? "high" : undefined}
          decoding="async"
          className="h-auto max-h-full w-auto max-w-full object-contain shadow-[0_14px_28px_-18px_rgb(0_0_0/0.5)]"
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="kicker figures">Lote {lotNumber(lot.id)}</p>
          {lot.phase === "live" ? (
            <p className="kicker flex items-center gap-1.5 text-live">
              <span aria-hidden className="live-dot" />
              Ao vivo
            </p>
          ) : null}
        </div>
        <h3 className="display mt-2 line-clamp-2 text-xl leading-snug">
          {/* Link esticado (after:inset-0): o cartão todo abre a sala, e o leitor de tela ouve um link só, com o título. */}
          <Link
            href={`/lotes/${lot.id}`}
            className="decoration-1 underline-offset-4 after:absolute after:inset-0 group-hover:underline"
          >
            {lot.title}
          </Link>
        </h3>
        <p title={lot.artist || undefined} className="mt-1 truncate text-sm">
          {lot.artist || "Autoria desconhecida"}
        </p>
        {credit ? (
          <p title={credit} className="truncate text-sm text-muted">
            {credit}
          </p>
        ) : null}
        <dl className="mt-auto grid grid-cols-[1fr_auto] gap-x-4 border-t border-border pt-4">
          <div className="flex flex-col gap-1">
            <Price lot={lot} />
          </div>
          <div className="flex flex-col gap-1 text-right">
            <When lot={lot} />
          </div>
        </dl>
      </div>
    </article>
  );
}
