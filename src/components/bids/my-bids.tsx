"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { api, ApiError } from "@/lib/api";
import { lotNumber, money } from "@/lib/format";
import type { Cancellation, Lot, Page } from "@/lib/lots";
import { pathOf } from "@/lib/lots";

import { CopyLink } from "../audit/copy-link";
import { useAuth } from "../auth-provider";
import { Countdown } from "../countdown";
import { FormAlert, primaryButton } from "../field";

type Participation = Lot & {
  my_status: "winning" | "outbid" | "won" | "lost" | "cancelled";
  receipt_token: string | null;
  cancellation: Cancellation | null;
};

const STATUS = {
  winning: "Você está ganhando",
  outbid: "Você foi superado",
  lost: "Não arrematado",
} as const;

function Gate({ text, href, action }: { text: string; href: string; action: string }) {
  return (
    <section className="flex flex-col items-start gap-5 border border-border bg-card px-6 py-12 sm:px-10">
      <p className="kicker">Meus arremates</p>
      <p className="display max-w-xl text-3xl leading-snug">{text}</p>
      <Link href={href} className={`${primaryButton} px-5 py-3 text-sm`}>
        {action}
      </Link>
    </section>
  );
}

/** Link público do comprovante, para guardar ou compartilhar (a página é pública: D19). */
function ReceiptLinks({ token }: { token: string }) {
  const href = `/comprovante/${token}`;
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-4 text-sm">
      {/* Sem prefetch: um comprovante por arremate da lista seria baixado sem ninguém pedir. */}
      <Link href={href} prefetch={false} className="ink-link pb-0.5">
        Ver comprovante
      </Link>
      <CopyLink path={href} label="Copiar link do comprovante" className="text-muted hover:text-foreground" />
    </div>
  );
}

function Row({ lot }: { lot: Participation }) {
  const ended = lot.my_status !== "winning" && lot.my_status !== "outbid";
  const cancelled = lot.my_status === "cancelled";
  // Lote cancelado some da vitrine (e a sala dá 404): o que resta para conferir é a auditoria.
  const href = cancelled ? `/lotes/${lot.id}/auditoria` : `/lotes/${lot.id}`;
  const action = cancelled ? "Ver a auditoria" : ended ? "Ver o lote" : "Ir para a sala";
  return (
    <li className="grid grid-cols-[4rem_minmax(0,1fr)] gap-4 border-b border-border py-5 sm:grid-cols-[5rem_minmax(0,1fr)_auto] sm:items-center">
      <div className="flex aspect-square items-center justify-center overflow-hidden bg-background p-1.5">
        {/* eslint-disable-next-line @next/next/no-img-element -- cópia local da obra, servida pela API */}
        <img src={lot.image_url} alt="" width={80} height={80} loading="lazy" decoding="async" className="h-auto max-h-full w-auto max-w-full object-contain" />
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <p className="kicker figures">Lote {lotNumber(lot.id)}</p>
        <p className="display truncate text-xl" title={lot.title}>
          {lot.title}
        </p>
        {lot.my_status === "cancelled" ? (
          <>
            <p className="text-sm font-semibold break-words">
              Cancelado pelo leiloeiro{lot.cancellation?.reason ? `: ${lot.cancellation.reason}` : ""}
            </p>
            {lot.cancellation?.refunded ? (
              <p className="figures text-xs text-muted">{money(lot.cancellation.refunded)} estornados para a sua carteira</p>
            ) : null}
          </>
        ) : lot.my_status === "won" ? (
          <>
            <p className="figures text-sm font-semibold">Arrematado por {money(lot.current_bid ?? lot.starting_bid)}</p>
            {lot.receipt_token ? (
              <ReceiptLinks token={lot.receipt_token} />
            ) : (
              <p className="text-xs text-muted">Emitindo o comprovante…</p>
            )}
          </>
        ) : (
          <>
            <p
              data-winning={lot.my_status === "winning" || undefined}
              className="text-sm data-winning:font-semibold data-winning:text-live"
            >
              {STATUS[lot.my_status]}
            </p>
            {!ended && lot.current_bid ? (
              <p className="figures text-xs text-muted">
                Lance atual {money(lot.current_bid)} · termina <Countdown to={lot.ends_at} />
              </p>
            ) : null}
          </>
        )}
      </div>
      <Link
        href={href}
        aria-label={`${cancelled ? "Ver a auditoria do lote" : ended ? "Ver o lote" : "Ir para a sala do lote"} ${lotNumber(lot.id)}`}
        className={
          ended
            ? "ink-link col-span-2 self-start pb-0.5 text-sm sm:col-span-1 sm:self-center"
            : `${primaryButton} col-span-2 px-4 py-2 text-center text-sm sm:col-span-1`
        }
      >
        {action}
      </Link>
    </li>
  );
}

function Section({ title, lots }: { title: string; lots: Participation[] }) {
  if (!lots.length) return null;
  const id = title === "Em disputa" ? "em-disputa" : "encerrados";
  return (
    <section aria-labelledby={id} className="flex flex-col">
      <h2 id={id} className="display border-b border-border pb-3 text-3xl">
        {title}
      </h2>
      <ul>
        {lots.map((lot) => (
          <Row key={lot.id} lot={lot} />
        ))}
      </ul>
    </section>
  );
}

/** Lotes em que o licitante deu lance: os que ainda disputa e os encerrados, com o comprovante do arremate. */
export function MyBids() {
  const { user, loading } = useAuth();
  const bidder = user?.role === "bidder";
  const [lots, setLots] = useState<Participation[] | null>(null);
  const [next, setNext] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (!bidder) return;
    let active = true;
    api<Page<Participation>>("/api/lots/participating/").then(
      (page) => {
        if (!active) return;
        setLots(page.results);
        setNext(page.next);
      },
      (failure) => active && setError(failure instanceof ApiError ? failure.message : "Não foi possível carregar seus lances."),
    );
    return () => {
      active = false;
    };
  }, [bidder]);

  async function more() {
    if (!next) return;
    setLoadingMore(true);
    setError(null);
    try {
      const page = await api<Page<Participation>>(pathOf(next));
      setLots((previous) => [...(previous ?? []), ...page.results]);
      setNext(page.next);
    } catch (failure) {
      setError(failure instanceof ApiError ? failure.message : "Não foi possível carregar mais lotes.");
    } finally {
      setLoadingMore(false);
    }
  }

  if (loading) return <p className="text-muted">Carregando…</p>;
  if (!user) return <Gate text="Entre com uma conta de licitante para acompanhar seus lances e arremates." href="/entrar" action="Entrar" />;
  if (!bidder) return <Gate text="Esta página é dos licitantes. Os resultados dos seus lotes estão no painel." href="/painel" action="Ir para o painel" />;

  const open = lots?.filter((lot) => lot.my_status === "winning" || lot.my_status === "outbid") ?? [];
  const ended = lots?.filter((lot) => lot.my_status !== "winning" && lot.my_status !== "outbid") ?? [];
  return (
    <div className="flex flex-col gap-12">
      <header className="flex flex-col gap-3">
        <p className="kicker">Licitante</p>
        <h1 className="display text-5xl font-light">Meus arremates</h1>
        <p className="max-w-xl text-muted">Os lotes em que você deu lance. Cada arremate tem um comprovante com link público.</p>
      </header>
      {error ? <FormAlert>{error}</FormAlert> : null}
      {lots === null && !error ? <p className="text-muted">Carregando seus lances…</p> : null}
      {lots?.length === 0 ? (
        <div className="flex flex-col items-start gap-4 border border-border bg-card px-6 py-12 sm:px-10">
          <p className="display text-2xl italic">Você ainda não deu lances.</p>
          <Link href="/lotes" className={`${primaryButton} px-5 py-3 text-sm`}>
            Ver lotes ao vivo
          </Link>
        </div>
      ) : null}
      <Section title="Em disputa" lots={open} />
      <Section title="Encerrados" lots={ended} />
      {next ? (
        <button type="button" onClick={more} disabled={loadingMore} className="pressable ink-link self-start pb-0.5 text-sm">
          {loadingMore ? "Carregando mais…" : "Mostrar mais lotes"}
        </button>
      ) : null}
    </div>
  );
}
