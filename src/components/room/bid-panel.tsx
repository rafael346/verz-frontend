"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

import { api } from "@/lib/api";
import { amountInput, money } from "@/lib/format";
import { parseMoney } from "@/lib/money-input";
import type { Bid, LiveLot, Standing } from "@/lib/room";

import { Field, FormAlert, SubmitButton } from "../field";
import { useFormErrors } from "../use-form-errors";

type Wallet = { balance: string; committed: string; available: string };

/** "Você está ganhando / superado" e a posição, sempre como o backend calculou (`me`). */
export function StandingNote({ standing }: { standing: Standing | null }) {
  if (!standing || standing.status === "none") return null;
  const winning = standing.status === "winning";
  return (
    <div
      data-winning={winning || undefined}
      className="flex flex-col gap-0.5 border-l-2 border-accent py-1 pl-3 data-winning:border-live"
    >
      <p className="font-semibold">{winning ? "Você está ganhando" : "Você foi superado"}</p>
      {standing.position ? (
        <p className="figures text-sm text-muted">
          {standing.position}º de {standing.bidders} {standing.bidders === 1 ? "licitante" : "licitantes"}
        </p>
      ) : null}
    </div>
  );
}

type Props = { lot: LiveLot; wallet: Wallet | null; onPlaced: (bid: Bid, lot: LiveLot) => void };

/** Formulário de lance: começa no lance mínimo e segue o mínimo novo quando chega outro lance. */
export function BidForm({ lot, wallet, onPlaced }: Props) {
  const { formRef, general, fields, clear, showFields, fail } = useFormErrors();
  // O texto digitado só vale para o mínimo em que foi digitado; mínimo novo, campo novo (sem efeito para sincronizar).
  const [typed, setTyped] = useState({ min: lot.min_next_bid, text: amountInput(lot.min_next_bid) });
  const value = typed.min === lot.min_next_bid ? typed.text : amountInput(lot.min_next_bid);
  const [sending, setSending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = parseMoney(value);
    if (!amount) return showFields({ amount: "Informe um valor em reais, como 1.250,00." });
    setSending(true);
    clear();
    try {
      const placed = await api<{ bid: Bid; lot: LiveLot }>(`/api/lots/${lot.id}/bids/`, { method: "POST", body: { amount } });
      onPlaced(placed.bid, placed.lot);
    } catch (failure) {
      fail(failure);
    } finally {
      setSending(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={submit} aria-label="Dar lance" className="flex flex-col gap-3" noValidate>
      {general ? <FormAlert>{general}</FormAlert> : null}
      <Field
        label="Seu lance"
        name="amount"
        inputMode="decimal"
        autoComplete="off"
        value={value}
        onChange={(event) => setTyped({ min: lot.min_next_bid, text: event.target.value })}
        hint={`Mínimo de ${money(lot.min_next_bid)}.`}
        error={fields.amount}
      />
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm">
        <button
          type="button"
          onClick={() => setTyped({ min: lot.min_next_bid, text: amountInput(lot.min_next_bid) })}
          className="pressable ink-link pb-0.5"
        >
          Lance mínimo
        </button>
        {wallet ? (
          <p className="text-muted">
            Disponível <span className="figures text-foreground">{money(wallet.available)}</span> ·{" "}
            <Link href="/carteira" className="ink-link pb-0.5">
              Carteira
            </Link>
          </p>
        ) : null}
      </div>
      <SubmitButton sending={sending} label="Dar lance" sendingLabel="Enviando lance…" />
    </form>
  );
}
