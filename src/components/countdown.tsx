"use client";

import { useSyncExternalStore } from "react";

import { clockNow, subscribeClock } from "@/lib/clock";
import { clockTime, remaining } from "@/lib/format";

const URGENT_MS = 2 * 60 * 1000; // a janela do anti-sniping (D08)

type Props = { to: string; urgentHint?: string };

/**
 * No servidor (e na hidratação) mostra o horário fixo de Brasília; no navegador, o tempo restante.
 * Com `urgentHint`, os últimos 2 minutos ficam em destaque e a dica aparece.
 */
export function Countdown({ to, urgentHint }: Props) {
  const now = useSyncExternalStore(subscribeClock, clockNow, () => null);
  if (now === null) return <time dateTime={to}>{clockTime(to)}</time>;

  const left = Date.parse(to) - now;
  const urgent = urgentHint !== undefined && left > 0 && left <= URGENT_MS;
  return (
    <>
      <time
        dateTime={to}
        title={clockTime(to)}
        data-urgent={urgent || undefined}
        className="figures transition-colors duration-150 data-urgent:font-semibold data-urgent:text-accent"
      >
        {left > 0 ? `em ${remaining(left)}` : "encerrando…"}
      </time>
      {urgent ? <span className="mt-0.5 block text-xs text-accent">{urgentHint}</span> : null}
    </>
  );
}
