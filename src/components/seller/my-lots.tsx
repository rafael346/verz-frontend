"use client";

import { useEffect, useId, useRef, useState } from "react";

import { api, ApiError } from "@/lib/api";
import { bidsCount, clockTime, lotNumber, money } from "@/lib/format";
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
  if (lot.status === "cancelled") return lot.cancellation?.reason ? `Cancelado: ${lot.cancellation.reason}` : null;
  if (lot.phase !== "ended") {
    return lot.current_bid
      ? `Lance atual ${money(lot.current_bid)} · ${bidsCount(lot.bid_count)}`
      : `Lance inicial ${money(lot.starting_bid)} · sem lances`;
  }
  if (!lot.result) return "Aguardando liquidação";
  return lot.result.sold ? `Arrematado por ${money(lot.result.amount!)}` : "Encerrado sem lances";
}

/** O efeito do cancelamento, dito antes do clique (D29). */
function cancelEffect(lot: SellerLot): string {
  if (lot.refundable_until) return `${money(lot.current_bid!)} voltam para o arrematante e saem do seu saldo.`;
  if (lot.bid_count) return "O valor reservado de quem está ganhando será liberado.";
  return "Ele sai da vitrine.";
}

const MAX_REASON = 200; // igual ao cancel_lot do backend

function LotRow({ lot, onChanged }: { lot: SellerLot; onChanged: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);
  const reasonRef = useRef<HTMLTextAreaElement>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const keepRef = useRef<HTMLButtonElement>(null);
  // Aberto (menos vencido sem lances, que não tem o que desfazer) ou arrematado ainda no prazo de 7 dias.
  const canCancel = (lot.status === "open" && !(lot.phase === "ended" && lot.bid_count === 0)) || !!lot.refundable_until;
  const needsReason = lot.bid_count > 0;
  const reasonId = useId();

  useEffect(() => {
    if (confirming) keepRef.current?.focus(); // ação destrutiva: o foco vai para a opção segura
  }, [confirming]);

  async function cancel() {
    if (needsReason && !reason.trim()) {
      setReasonError("Informe o motivo: quem deu lance vai ver.");
      return reasonRef.current?.focus();
    }
    setSending(true);
    setError(null);
    try {
      await api(`/api/lots/${lot.id}/cancel/`, { method: "POST", body: { reason: reason.trim() } });
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
        {result ? <p className="figures text-sm break-words">{result}</p> : null}
        {lot.cancellation?.refunded ? (
          <p className="figures text-xs text-muted">{money(lot.cancellation.refunded)} estornados ao arrematante</p>
        ) : null}
        {lot.refundable_until ? (
          <p className="text-xs text-muted">Pode ser cancelado até {clockTime(lot.refundable_until)}</p>
        ) : null}
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
      {canCancel && !confirming ? (
        <div className="col-span-2 sm:col-span-1 sm:justify-self-end">
          <button type="button" onClick={() => setConfirming(true)} className="pressable ink-link pb-0.5 text-sm text-muted hover:text-foreground">
            Cancelar lote
          </button>
        </div>
      ) : null}
      {canCancel && confirming ? (
        <div
          role="group"
          aria-labelledby={`cancelar-${lot.id}`}
          className="col-span-2 flex flex-col gap-3 border-l-2 border-accent bg-card py-3 pr-3 pl-4 sm:col-span-3"
        >
          <p id={`cancelar-${lot.id}`} className="text-sm">
            <span className="font-semibold">Cancelar este lote?</span> {cancelEffect(lot)}
          </p>
          {needsReason ? (
            <div className="flex flex-col gap-1.5">
              <label htmlFor={reasonId} className="kicker text-foreground">
                Motivo (quem deu lance vai ver)
              </label>
              <textarea
                ref={reasonRef}
                id={reasonId}
                value={reason}
                onChange={(event) => {
                  setReason(event.target.value);
                  setReasonError(null);
                }}
                maxLength={MAX_REASON}
                rows={2}
                aria-invalid={reasonError ? true : undefined}
                aria-describedby={`${reasonId}-help`}
                className="rounded-[3px] border border-border bg-background px-3 py-2 text-sm focus-visible:border-foreground aria-invalid:border-accent"
              />
              <span id={`${reasonId}-help`} className="flex justify-between gap-3 text-xs">
                <span className="text-accent">{reasonError}</span>
                <span className="figures text-muted">
                  {reason.length}/{MAX_REASON}
                </span>
              </span>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={cancel}
              disabled={sending}
              className="pressable rounded-[3px] bg-accent px-3 py-1.5 text-sm font-semibold text-accent-ink hover:bg-accent-hover disabled:opacity-70"
            >
              {sending ? "Cancelando…" : "Sim, cancelar"}
            </button>
            <button ref={keepRef} type="button" onClick={() => setConfirming(false)} className="pressable rounded-[3px] border border-border px-3 py-1.5 text-sm hover:border-foreground">
              Manter
            </button>
          </div>
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
