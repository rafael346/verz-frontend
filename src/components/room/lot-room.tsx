"use client";

import Link from "next/link";
import { useEffect, useReducer, useRef, useState, useSyncExternalStore } from "react";

import { api } from "@/lib/api";
import { clockNow, subscribeClock } from "@/lib/clock";
import { bidsCount, clockTime, lotNumber, money } from "@/lib/format";
import type { Page } from "@/lib/lots";
import { applyEvent, phaseAt, type Bid, type LiveLot, type RoomEvent, type Standing } from "@/lib/room";

import { useAuth } from "../auth-provider";
import { Countdown } from "../countdown";
import { primaryButton } from "../field";
import { BidForm, StandingNote } from "./bid-panel";

type Wallet = { balance: string; committed: string; available: string };
type Connection = "connecting" | "live" | "reconnecting" | "unavailable";

const PHASE_LABEL = { scheduled: "Agendado", live: "Ao vivo", ended: "Encerrado" } as const;

/** Assina o SSE do lote. O navegador reconecta sozinho e manda o Last-Event-ID; o backend reenvia o que faltou (D20). */
function useLotStream(lotId: number, dispatch: (event: RoomEvent) => void): Connection {
  const [connection, setConnection] = useState<Connection>("connecting");
  useEffect(() => {
    const source = new EventSource(`/api/lots/${lotId}/events/`);
    const read =
      <T,>(handler: (data: T) => void) =>
      (event: MessageEvent<string>) =>
        handler(JSON.parse(event.data) as T);
    source.addEventListener("open", () => setConnection("live"));
    // Erro de rede: o navegador tenta de novo. Resposta recusada (ex.: 503 por limite): ele desiste, e a sala avisa.
    source.addEventListener("error", () => setConnection(source.readyState === EventSource.CLOSED ? "unavailable" : "reconnecting"));
    source.addEventListener(
      "state",
      read((lot: LiveLot) => {
        dispatch({ type: "state", lot });
        if (lot.status === "settled" || lot.status === "cancelled") source.close(); // lote que não muda mais não ocupa vaga do SSE
      }),
    );
    source.addEventListener("bid", read(({ bid, lot }: { bid: Bid; lot?: LiveLot }) => dispatch({ type: "bid", bid, lot })));
    for (const type of ["closed", "cancelled"] as const) {
      source.addEventListener(
        type,
        read(({ lot }: { lot: LiveLot }) => {
          dispatch({ type, lot });
          source.close(); // depois disso o lote não muda mais
        }),
      );
    }
    source.addEventListener("unavailable", () => {
      setConnection("unavailable");
      source.close();
    });
    return () => source.close();
  }, [lotId, dispatch]);
  return connection;
}

const CONNECTION_LABEL: Record<Connection, string> = {
  connecting: "Conectando…",
  live: "Atualizando em tempo real",
  reconnecting: "Reconectando…",
  unavailable: "Tempo real indisponível. Recarregue a página em instantes.",
};

function Outcome({ lot, standing }: { lot: LiveLot; standing: Standing | null }) {
  if (lot.status === "cancelled") {
    return <p className="display text-xl italic">Este lote foi cancelado pelo leiloeiro.</p>;
  }
  if (lot.status !== "settled") {
    return <p className="display text-xl text-muted italic">Pregão encerrado. Apurando o resultado…</p>;
  }
  if (!lot.current_bid) return <p className="display text-xl text-muted italic">Encerrado sem lances.</p>;
  return (
    <div className="flex flex-col gap-3">
      <p className="display text-xl">Arrematado por {money(lot.current_bid)}</p>
      {standing?.status === "outbid" ? <p className="text-sm text-muted">Seu lance não foi o vencedor.</p> : null}
      {standing?.status === "winning" ? (
        <div className="flex flex-col items-start gap-3 border-l-2 border-live py-1 pl-3">
          <p className="font-semibold">Você arrematou este lote</p>
          <Link href="/arremates" className={`${primaryButton} px-4 py-2 text-sm`}>
            Ver o comprovante em Meus arremates
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function Participation({ lot, open, standing, wallet, onPlaced }: {
  lot: LiveLot;
  open: boolean;
  standing: Standing | null;
  wallet: Wallet | null;
  onPlaced: (bid: Bid, lot: LiveLot) => void;
}) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) {
    return (
      <Link href="/entrar" className={`${primaryButton} self-start px-5 py-3 text-sm`}>
        Entre para dar lances
      </Link>
    );
  }
  if (user.role !== "bidder") return <p className="text-sm text-muted">Leiloeiros acompanham o pregão, mas não dão lances.</p>;
  return (
    // Encerrado, o resultado (Outcome) substitui a disputa: nada de "você está ganhando" depois do fim.
    open ? (
      <div className="flex flex-col gap-4">
        <StandingNote standing={standing} />
        <BidForm lot={lot} wallet={wallet} onPlaced={onPlaced} />
      </div>
    ) : null
  );
}

type Props = { initialLot: LiveLot; initialBids: Page<Bid> };

/** Sala do lote: obra, preço, contagem, situação do licitante, lance e histórico, tudo sem recarregar. */
export function LotRoom({ initialLot, initialBids }: Props) {
  const { user } = useAuth();
  const [{ lot, bids }, dispatch] = useReducer(applyEvent, { lot: initialLot, bids: initialBids.results });
  const [firstLive] = useState(() => initialBids.results[0]?.sequence ?? 0);
  const connection = useLotStream(initialLot.id, dispatch);
  const now = useSyncExternalStore(subscribeClock, clockNow, () => null);
  const phase = now === null ? lot.phase : phaseAt(lot, now);
  const open = lot.status !== "cancelled" && lot.status !== "settled" && phase === "live";

  const bidder = user?.role === "bidder";
  const [standing, setStanding] = useState<Standing | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const latest = bids[0]?.sequence ?? 0;

  // Situação, posição e saldo vêm do backend (fonte única), de novo a cada lance que chega:
  // ser superado libera o saldo comprometido, então o disponível também muda com lance dos outros.
  // Espera 300 ms de calmaria: uma rajada de lances vira uma busca só (o limite é 240 req/min por usuário).
  useEffect(() => {
    if (!bidder) return;
    let active = true;
    const timer = setTimeout(() => {
      api<{ me: Standing | null }>(`/api/lots/${lot.id}/`).then((detail) => active && setStanding(detail.me), () => {});
      api<Wallet>("/api/wallet/").then((data) => active && setWallet(data), () => {});
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [bidder, lot.id, latest]);

  // Anti-sniping (D08): o fim só anda para frente; quando anda, avisa.
  const [notice, setNotice] = useState<string | null>(null);
  const shownEnd = useRef(lot.ends_at);
  useEffect(() => {
    if (Date.parse(lot.ends_at) > Date.parse(shownEnd.current)) {
      setNotice(`Pregão prorrogado até ${clockTime(lot.ends_at)}: houve lance nos últimos 2 minutos.`);
    }
    shownEnd.current = lot.ends_at;
  }, [lot.ends_at]);

  const isMine = (bid: Bid) => bid.is_you || (standing !== null && bid.bidder_alias === standing.alias);
  const credit = [lot.date, lot.medium, lot.dimensions].filter(Boolean);
  const label = lot.status === "cancelled" ? "Cancelado" : PHASE_LABEL[phase];

  // grid-cols-1: sem ele a coluna implícita cresce até a largura da imagem (720 px) e a página transborda no celular.
  return (
    <article className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-14">
      <figure className="flex flex-col gap-4">
        <div className="flex aspect-[4/5] items-center justify-center overflow-hidden border border-border bg-card p-6 sm:p-10">
          {/* eslint-disable-next-line @next/next/no-img-element -- cópia local da obra, servida pela API com cache de 1 dia */}
          <img
            src={lot.image_url}
            alt={[lot.title, lot.artist].filter(Boolean).join(", ")}
            width={720}
            height={900}
            fetchPriority="high"
            className="h-auto max-h-full w-auto max-w-full object-contain shadow-[0_14px_28px_-18px_rgb(0_0_0/0.5)]"
          />
        </div>
        <figcaption className="flex flex-col gap-1 text-sm text-muted">
          {credit.map((line) => (
            <span key={line}>{line}</span>
          ))}
          {lot.source_url ? (
            <a href={lot.source_url} target="_blank" rel="noopener noreferrer" className="ink-link mt-1 self-start pb-0.5 text-foreground">
              Ficha no Metropolitan Museum<span className="sr-only"> (abre em nova aba)</span>
            </a>
          ) : null}
        </figcaption>
      </figure>

      <div className="flex min-w-0 flex-col gap-8">
        <header className="flex flex-col gap-2">
          <p className="kicker figures flex flex-wrap items-center gap-x-2">
            Lote {lotNumber(lot.id)} ·
            <span className={phase === "live" && open ? "flex items-center gap-1.5 text-live" : "text-foreground"}>
              {phase === "live" && open ? <span aria-hidden className="live-dot" /> : null}
              {label}
            </span>
          </p>
          <h1 className="display text-4xl leading-tight font-light sm:text-5xl">{lot.title}</h1>
          <p>{lot.artist || "Autoria desconhecida"}</p>
        </header>

        <dl className="grid grid-cols-2 gap-x-6 border-y border-border py-5">
          <div className="flex flex-col gap-1">
            <dt className="kicker">{lot.current_bid ? (phase === "ended" ? "Lance final" : "Lance atual") : "Lance inicial"}</dt>
            <dd className="figures display text-3xl">{money(lot.current_bid ?? lot.starting_bid)}</dd>
            <dd className="text-xs text-muted">
              {bidsCount(lot.bid_count)} · incremento de {money(lot.min_increment)}
            </dd>
          </div>
          <div className="flex flex-col gap-1 text-right">
            <dt className="kicker">{phase === "scheduled" ? "Abre" : phase === "live" ? "Termina" : "Encerrou"}</dt>
            <dd className="text-sm">
              {phase === "scheduled" ? (
                <Countdown to={lot.starts_at} />
              ) : phase === "live" && open ? (
                <Countdown to={lot.ends_at} urgentHint="Um lance agora prorroga o pregão." />
              ) : (
                <time dateTime={lot.ends_at}>{clockTime(lot.ends_at)}</time>
              )}
            </dd>
          </div>
        </dl>

        <p role="status" className={notice && open ? "border-l-2 border-accent bg-card py-2 pl-3 text-sm" : "sr-only"}>
          {open ? notice : null}
        </p>

        {phase === "ended" || lot.status === "cancelled" || lot.status === "settled" ? <Outcome lot={lot} standing={standing} /> : null}
        {phase === "scheduled" ? <p className="text-sm text-muted">Os lances abrem em {clockTime(lot.starts_at)}.</p> : null}

        {lot.status !== "cancelled" ? (
          <Participation
            lot={lot}
            open={open}
            standing={standing}
            wallet={wallet}
            onPlaced={(bid, placed) => {
              dispatch({ type: "bid", bid, lot: placed });
              // Lance aceito sempre faz de você o líder: mostra já; a posição chega com a busca do `me`.
              setStanding((current) => current && { ...current, status: "winning", position: 1 });
            }}
          />
        ) : null}

        <section aria-labelledby="historico" className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-4 border-b border-border pb-2">
            <h2 id="historico" className="display text-2xl">
              Histórico
            </h2>
            {open ? <p className="text-xs text-muted">{CONNECTION_LABEL[connection]}</p> : null}
          </div>
          {bids.length ? (
            <ol aria-label="Histórico de lances" className="flex flex-col">
              {bids.map((bid) => (
                <li
                  key={bid.sequence}
                  className={`${bid.sequence > firstLive ? "bid-enter " : ""}grid grid-cols-[auto_minmax(0,1fr)_auto] items-baseline gap-x-3 border-b border-border py-2.5 text-sm`}
                >
                  <span className="figures text-xs text-muted">{lotNumber(bid.sequence)}</span>
                  <span className="truncate">
                    {bid.bidder_alias}
                    {isMine(bid) ? <span className="kicker ml-2 text-accent">Você</span> : null}
                  </span>
                  <span className="figures text-right">
                    {money(bid.amount)}
                    <time dateTime={bid.created_at} className="block text-xs text-muted">
                      {clockTime(bid.created_at)}
                    </time>
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="display text-lg text-muted italic">Nenhum lance ainda. O primeiro abre em {money(lot.starting_bid)}.</p>
          )}
          {initialBids.next ? <p className="text-xs text-muted">Mostrando os lances mais recentes.</p> : null}
        </section>
      </div>
    </article>
  );
}
