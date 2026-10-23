"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { lotNumber } from "@/lib/format";
import type { CatalogItem } from "@/lib/lots";

import { useAuth } from "../auth-provider";
import { primaryButton } from "../field";
import { CatalogSearch } from "./catalog-search";
import { LotForm } from "./lot-form";
import { MyLots } from "./my-lots";
import { SellerSummary } from "./summary";

function Gate({ text, action }: { text: string; action: ReactNode }) {
  return (
    <section className="flex flex-col items-start gap-5 border border-border bg-card px-6 py-12 sm:px-10">
      <p className="kicker">Painel do leiloeiro</p>
      <p className="display max-w-xl text-3xl leading-snug">{text}</p>
      {action}
    </section>
  );
}

function NewLot({ onCreated }: { onCreated: () => void }) {
  const [chosen, setChosen] = useState<CatalogItem | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const shownStep = useRef(chosen);

  useEffect(() => {
    // O botão clicado some na troca de passo; sem isso o foco cairia no body.
    // Comparar com o passo anterior (e não um flag) evita focar na montagem dupla do StrictMode.
    if (shownStep.current !== chosen) headingRef.current?.focus();
    shownStep.current = chosen;
  }, [chosen]);

  return (
    <section aria-labelledby="novo-lote" className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 border-b border-border pb-3">
        <p className="kicker">{chosen ? "Passo 2 de 2 · Condições" : "Passo 1 de 2 · Obra"}</p>
        <h2 id="novo-lote" ref={headingRef} tabIndex={-1} className="display scroll-mt-6 text-3xl">
          Novo lote
        </h2>
      </div>
      <p role="status" className={notice ? "border-l-2 border-live bg-card py-2 pl-3 text-sm" : "sr-only"}>
        {notice}
      </p>
      {chosen ? (
        <LotForm
          item={chosen}
          onBack={() => setChosen(null)}
          onCreated={(lot) => {
            setNotice(`Lote ${lotNumber(lot.id)} criado. Ele já aparece abaixo e na vitrine.`);
            setChosen(null);
            onCreated();
          }}
        />
      ) : (
        <CatalogSearch
          onChoose={(item) => {
            setNotice(null);
            setChosen(item);
          }}
        />
      )}
    </section>
  );
}

/** Painel do leiloeiro: balanço, criação de lotes a partir do acervo do Met e acompanhamento dos próprios lotes. */
export function SellerDashboard() {
  const { user, loading } = useAuth();
  const [refresh, setRefresh] = useState(0);

  if (loading) return <p className="text-muted">Carregando o painel…</p>;
  if (!user) {
    return (
      <Gate
        text="Entre com uma conta de leiloeiro para montar e acompanhar seus lotes."
        action={
          <Link href="/entrar" className={`${primaryButton} px-5 py-3 text-sm`}>
            Entrar
          </Link>
        }
      />
    );
  }
  if (user.role !== "seller") {
    return (
      <Gate
        text="Este painel é para leiloeiros. Como licitante, acompanhe e dispute os lotes na vitrine."
        action={
          <Link href="/lotes" className={`${primaryButton} px-5 py-3 text-sm`}>
            Ir para a vitrine
          </Link>
        }
      />
    );
  }

  const reload = () => setRefresh((value) => value + 1);
  return (
    <div className="flex flex-col gap-14">
      <header className="flex flex-col gap-3">
        <p className="kicker">Painel do leiloeiro</p>
        <h1 className="display text-5xl font-light">Sua sala de leilões</h1>
        <p className="max-w-xl text-muted">
          Escolha obras do acervo aberto do Metropolitan Museum, defina as condições e acompanhe cada lote até o
          arremate.
        </p>
      </header>
      <SellerSummary refresh={refresh} />
      <NewLot onCreated={reload} />
      <MyLots refresh={refresh} onChanged={reload} />
    </div>
  );
}
