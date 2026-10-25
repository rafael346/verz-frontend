/** Estado da sala ao vivo: o lote e o histórico, atualizados pelo SSE e pela resposta do próprio lance. */

import type { Cancellation, Lot, Phase } from "./lots";

export type Bid = {
  sequence: number;
  bidder_alias: string;
  amount: string;
  created_at: string;
  hash: string;
  is_you?: boolean;
};

export type LiveLot = Lot & { status?: "open" | "cancelled" | "settled"; cancellation?: Cancellation | null };

/** `me` do backend: situação do licitante no lote (D20). */
export type Standing = { status: "winning" | "outbid" | "none"; position: number | null; bidders: number; alias: string };

export type RoomState = { lot: LiveLot; bids: Bid[] };

export type RoomEvent =
  | { type: "state"; lot: LiveLot }
  | { type: "bid"; bid: Bid; lot?: LiveLot }
  | { type: "closed" | "cancelled"; lot: LiveLot };

export function applyEvent(state: RoomState, event: RoomEvent): RoomState {
  if (event.type !== "bid") return { ...state, lot: event.lot };
  const lot = event.lot ?? state.lot; // na retomada pelo Last-Event-ID o lance vem sem o lote
  if (state.bids.some((bid) => bid.sequence === event.bid.sequence)) return { ...state, lot };
  const bids = [...state.bids, event.bid].sort((a, b) => b.sequence - a.sequence);
  return { lot, bids };
}

/** Fase pelo relógio (do servidor, D23): o pregão fecha na hora, sem esperar a liquidação. */
export function phaseAt(lot: Pick<Lot, "starts_at" | "ends_at">, now: number): Phase {
  if (now < Date.parse(lot.starts_at)) return "scheduled";
  return now < Date.parse(lot.ends_at) ? "live" : "ended";
}
