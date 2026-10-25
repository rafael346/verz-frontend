/** Tipos da auditoria pública e do comprovante (D18, D19). */

import type { Cancellation } from "./lots";
import type { LiveLot } from "./room";

export type AuditBid = {
  sequence: number;
  bidder_alias: string;
  amount: string;
  created_at: string;
  prev_hash: string;
  hash: string;
  valid: boolean;
};

export type Audit = {
  lot: LiveLot;
  intact: boolean;
  problems: string[];
  head_hash: string;
  cancellation: Cancellation | null;
  bids: AuditBid[];
};

export type Receipt = {
  token: string;
  issued_at: string;
  amount: string;
  winner_alias: string;
  head_hash: string;
  lot: { id: number; title: string; artist: string; image_url: string };
  authentic: boolean;
  audit: { intact: boolean; head_matches: boolean; url: string };
  cancellation: Cancellation | null;
};

/** Hash de 64 caracteres em forma de leitura: começo e fim, como se confere um número de série. */
export function shortHash(hash: string): string {
  return hash.length > 20 ? `${hash.slice(0, 8)}…${hash.slice(-8)}` : hash;
}
