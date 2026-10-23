"use client";

import { useEffect, useRef, useState } from "react";

import { api, ApiError } from "@/lib/api";
import { bidsCount, lotNumber, money } from "@/lib/format";
import type { Page, SellerLot } from "@/lib/lots";
import { pathOf } from "@/lib/lots";

import { Countdown } from "../countdown";
import { FormAlert } from "../field";

const PHASE_LABEL = { scheduled: "Agendado", live: "Ao vivo", ended: "Encerrado" } as const;

function situation(lot: SellerLot): string {
  return lot.status === "cancelled" ? "Cancelado" : PHASE_LABEL[lot.phase];
}

/** O que importa sobre o lote agora: lance em andamento, ou o resultado depois de encerrado. */
function outcome(lot: SellerLot): string | null {
  if (lot.status === "cancelled") return null;
  if (lot.phase !== "ended") {
    return lot.current_bid
      ? `Lance atual ${money(lot.current_bid)} · ${bidsCount(lot.bid_count)}`
      : `Lance inicial ${money(lot.starting_bid)} · sem lances`;
  }
  if (!lot.result) return "Aguardando liquidação";
  return lot.result.sold ? `Arrematado por ${money(lot.result.amount!)}` : "Encerrado sem lances";
}

function LotRow({ lot, onChanged }: { lot: SellerLot; onChanged: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const keepRef = useRef<HTMLButtonElement>(null);
  const canCancel = lot.status === "open" && lot.phase !== "ended" && lot.bid_count === 0;

  useEffect(() => {
    if (confirming) keepRef.current?.focus(); // ação destrutiva: o foco vai para a opção segura
  }, [confirming]);

  async function cancel() {
    setSending(true);
    setError(null);
    try {
      await api(`/api/lots/${lot.id}/cancel/`, { method: "POST" });
      onChanged();
    } catch (failure) {
      setError(failure instanceof ApiError ? failure.message : "Não foi possível cancelar agora.");
      setConfirming(false);
    } finally {
      setSending(false);
    }
  }

  const result = outcome(lot);
  return (
    <li className="grid grid-cols-[4rem_minmax(0,1fr)] gap-4 border-b border-border py-5 sm:grid-cols-[5rem_minmax(0,1fr)_auto] sm:items-center">
      <div className="flex aspect-square items-center justify-center overflow-hidden bg-background p-1.5">
        {/* eslint-disable-next-line @next/next/no-img-element -- cópia local da obra, servida pela API */}
        <img src={lot.image_url} alt="" width={80} height={80} loading="lazy" decoding="async" className="h-auto max-h-full w-auto max-w-full object-contain" />
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <p className="kicker figures">
          Lote {lotNumber(lot.id)} · <span className={lot.status === "cancelled" ? "" : "text-foreground"}>{situation(lot)}</span>
        </p>
        <p className="display truncate text-xl" title={lot.title}>
          {lot.title}
        </p>
        {result ? <p className="figures text-sm">{result}</p> : null}
        {lot.status === "open" && lot.phase === "live" ? (
          <p className="text-xs text-muted">
            Termina <Countdown to={lot.ends_at} />
          </p>
        ) : null}
        {lot.status === "open" && lot.phase === "scheduled" ? (
          <p className="text-xs text-muted">
            Abre <Countdown to={lot.starts_at} />
          </p>
        ) : null}
        {error ? <FormAlert>{error}</FormAlert> : null}
      </div>
      {canCancel ? (
        <div className="col-span-2 flex flex-wrap items-center gap-3 sm:col-span-1 sm:justify-end">
          {confirming ? (
            <div role="group" aria-labelledby={`cancelar-${lot.id}`} className="flex flex-wrap items-center gap-3">
              <span id={`cancelar-${lot.id}`} className="text-sm">
                Cancelar este lote? Ele sai da vitrine.
              </span>
              <button type="button" onClick={cancel} disabled={sending} className="pressable rounded-[3px] bg-accent px-3 py-1.5 text-sm font-semibold text-accent-ink hover:bg-accent-hover disabled:opacity-70">
                {sending ? "Cancelando…" : "Sim, cancelar"}
              </button>
              <button ref={keepRef} type="button" onClick={() => setConfirming(false)} className="pressable rounded-[3px] border border-border px-3 py-1.5 text-sm hover:border-foreground">
                Manter
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirming(true)} className="pressable ink-link pb-0.5 text-sm text-muted hover:text-foreground">
              Cancelar lote
            </button>
          )}
        </div>
      ) : null}
    </li>
  );
}

/** Todos os lotes do leiloeiro, do mais novo ao mais antigo. Recarrega quando `refresh` muda. */
export function MyLots({ refresh, onChanged }: { refresh: number; onChanged: () => void }) {
  const [lots, setLots] = useState<SellerLot[] | null>(null);
  const [next, setNext] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    let active = true; // recargas seguidas: só a resposta mais nova vale
    api<Page<SellerLot>>("/api/lots/mine/").then(
      (page) => {
        if (!active) return;
        setLots(page.results);
        setNext(page.next);
        setError(null);
      },
      (failure) => active && setError(failure instanceof ApiError ? failure.message : "Não foi possível carregar seus lotes."),
    );
    return () => {
      active = false;
    };
  }, [refresh]);

  async function more() {
    if (!next) return;
    setLoadingMore(true);
    setError(null);
    try {
      const page = await api<Page<SellerLot>>(pathOf(next));
      setLots((previous) => [...(previous ?? []), ...page.results]);
      setNext(page.next);
    } catch (failure) {
      setError(failure instanceof ApiError ? failure.message : "Não foi possível carregar mais lotes.");
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <section aria-labelledby="meus-lotes" className="flex flex-col gap-2">
      <h2 id="meus-lotes" className="display border-b border-border pb-3 text-3xl">
        Seus lotes
      </h2>
      {error ? <FormAlert>{error}</FormAlert> : null}
      {lots === null && !error ? <p className="py-6 text-muted">Carregando seus lotes…</p> : null}
      {lots?.length === 0 ? (
        <p className="display py-6 text-xl text-muted italic">Você ainda não criou lotes. Comece escolhendo uma obra acima.</p>
      ) : null}
      {lots?.length ? (
        <ul>
          {lots.map((lot) => (
            <LotRow key={lot.id} lot={lot} onChanged={onChanged} />
          ))}
        </ul>
      ) : null}
      {next ? (
        <button type="button" onClick={more} disabled={loadingMore} className="pressable ink-link mt-4 self-start pb-0.5 text-sm">
          {loadingMore ? "Carregando mais…" : "Mostrar mais lotes"}
        </button>
      ) : null}
    </section>
  );
}
