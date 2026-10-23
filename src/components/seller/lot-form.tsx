"use client";

import { useState, type FormEvent } from "react";

import { api } from "@/lib/api";
import { fromLocalInput, toLocalInput } from "@/lib/datetime";
import type { CatalogItem, SellerLot } from "@/lib/lots";
import { parseMoney } from "@/lib/money-input";

import { Field, FormAlert, SubmitButton } from "../field";
import { useFormErrors } from "../use-form-errors";

const HOUR = 3_600_000;
const DURATIONS = [
  { label: "1 hora", ms: HOUR },
  { label: "1 dia", ms: 24 * HOUR },
  { label: "3 dias", ms: 72 * HOUR },
  { label: "7 dias", ms: 168 * HOUR },
];

function nextQuarterHour(): Date {
  const date = new Date(Date.now() + 5 * 60_000); // um respiro: o início não pode ficar no passado ao enviar
  date.setMinutes(Math.ceil(date.getMinutes() / 15) * 15, 0, 0);
  return date;
}

type Props = { item: CatalogItem; onBack: () => void; onCreated: (lot: SellerLot) => void };

/** Passo 2: a ficha da obra como vai aparecer na vitrine, e as condições do lote. */
export function LotForm({ item, onBack, onCreated }: Props) {
  const { formRef, general, fields, clear, showFields, fail } = useFormErrors();
  const [opening] = useState(nextQuarterHour);
  const [start, setStart] = useState(() => toLocalInput(opening));
  const [end, setEnd] = useState(() => toLocalInput(new Date(opening.getTime() + 24 * HOUR)));
  const [sending, setSending] = useState(false);

  function extendFromStart(ms: number) {
    const startsAt = fromLocalInput(start);
    if (startsAt) setEnd(toLocalInput(new Date(Date.parse(startsAt) + ms)));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const startingBid = parseMoney(String(form.get("starting_bid") ?? ""));
    const increment = parseMoney(String(form.get("min_increment") ?? ""));
    const startsAt = fromLocalInput(start);
    const endsAt = fromLocalInput(end);
    const problems: Record<string, string> = {};
    if (!startingBid) problems.starting_bid = "Informe um valor em reais, como 1.250,00.";
    if (!increment) problems.min_increment = "Informe um valor em reais, como 10,00.";
    if (!startsAt) problems.starts_at = "Informe a data e a hora de início.";
    if (!endsAt) problems.ends_at = "Informe a data e a hora de fim.";
    else if (startsAt && Date.parse(endsAt) <= Date.parse(startsAt)) problems.ends_at = "O fim precisa ser depois do início.";
    if (Object.keys(problems).length) return showFields(problems);

    setSending(true);
    clear();
    try {
      const lot = await api<SellerLot>("/api/lots/", {
        method: "POST",
        body: { external_id: item.external_id, starting_bid: startingBid, min_increment: increment, starts_at: startsAt, ends_at: endsAt },
      });
      onCreated(lot);
    } catch (failure) {
      fail(failure);
      setSending(false);
    }
  }

  const credit = [item.date, item.medium].filter(Boolean);
  return (
    <form ref={formRef} onSubmit={submit} aria-label="Condições do lote" className="grid gap-8 lg:grid-cols-[minmax(0,20rem)_1fr]" noValidate>
      <figure className="flex flex-col gap-4">
        <div className="flex aspect-[4/5] items-center justify-center overflow-hidden border border-border bg-background p-6">
          {/* eslint-disable-next-line @next/next/no-img-element -- prévia direto do servidor de imagens do Met; o lote guarda uma cópia local ao ser criado */}
          <img src={item.image_url} alt={[item.title, item.artist].filter(Boolean).join(", ")} width={320} height={400} className="h-auto max-h-full w-auto max-w-full object-contain" />
        </div>
        <figcaption className="flex flex-col gap-1">
          <span className="display text-2xl leading-snug">{item.title}</span>
          <span className="text-sm">{item.artist || "Autoria desconhecida"}</span>
          {credit.map((line) => (
            <span key={line} className="text-sm text-muted">
              {line}
            </span>
          ))}
          {item.dimensions ? <span className="text-sm text-muted">{item.dimensions}</span> : null}
          <button type="button" onClick={onBack} className="pressable ink-link mt-2 self-start pb-0.5 text-sm">
            Trocar de obra
          </button>
        </figcaption>
      </figure>

      <div className="flex min-w-0 flex-col gap-5">
        {general ? <FormAlert>{general}</FormAlert> : null}
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Lance inicial" name="starting_bid" inputMode="decimal" autoComplete="off" placeholder="Ex.: 1.250,00" hint="Em reais, de 1,00 a 1.000.000,00." error={fields.starting_bid} />
          <Field label="Incremento mínimo" name="min_increment" inputMode="decimal" autoComplete="off" placeholder="Ex.: 50,00" hint="Quanto cada lance precisa subir." error={fields.min_increment} />
          <Field label="Início" name="starts_at" type="datetime-local" value={start} onChange={(event) => setStart(event.target.value)} hint="No horário do seu computador." error={fields.starts_at} />
          <Field label="Fim" name="ends_at" type="datetime-local" value={end} onChange={(event) => setEnd(event.target.value)} hint="Lance nos últimos 2 minutos prorroga 2 minutos." error={fields.ends_at} />
        </div>
        <fieldset className="flex flex-wrap items-center gap-2">
          <legend className="kicker mb-2 text-foreground">Duração a partir do início</legend>
          {DURATIONS.map((duration) => (
            <button
              key={duration.label}
              type="button"
              onClick={() => extendFromStart(duration.ms)}
              className="pressable rounded-[3px] border border-border px-3 py-1.5 text-sm hover:border-foreground"
            >
              {duration.label}
            </button>
          ))}
        </fieldset>
        <SubmitButton sending={sending} label="Criar lote" sendingLabel="Criando lote…" />
      </div>
    </form>
  );
}
