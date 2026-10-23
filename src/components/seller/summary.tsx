"use client";

import { useEffect, useState } from "react";

import { api } from "@/lib/api";
import { money } from "@/lib/format";

type Summary = { total_received: string; sold: number; unsold: number };

/** Balanço do leiloeiro: quanto entrou e como terminaram os lotes. Recarrega quando `refresh` muda. */
export function SellerSummary({ refresh }: { refresh: number }) {
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    let active = true; // recargas seguidas: só a resposta mais nova vale
    api<Summary>("/api/lots/mine/summary/").then(
      (data) => active && setSummary(data),
      () => active && setSummary(null),
    );
    return () => {
      active = false;
    };
  }, [refresh]);

  const items = [
    { label: "Total recebido", value: summary ? money(summary.total_received) : "—" },
    { label: "Arrematados", value: summary ? String(summary.sold) : "—" },
    { label: "Encerrados sem lances", value: summary ? String(summary.unsold) : "—" },
  ];
  return (
    <dl data-summary className="grid border-t border-l border-border sm:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col gap-2 border-r border-b border-border bg-card px-6 py-5">
          <dt className="kicker">{item.label}</dt>
          <dd className="display figures text-3xl">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
