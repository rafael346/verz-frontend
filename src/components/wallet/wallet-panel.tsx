"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

import { api } from "@/lib/api";
import { amountInput, money } from "@/lib/format";
import { parseMoney } from "@/lib/money-input";

import { useAuth } from "../auth-provider";
import { Field, FormAlert, primaryButton, SubmitButton } from "../field";
import { useFormErrors } from "../use-form-errors";

type Wallet = { balance: string; committed: string; available: string };

const QUICK = ["100", "500", "1000", "5000"];
const MIN = 1;
const MAX = 100_000; // igual ao DepositSerializer do backend

function Gate({ text, href, action }: { text: string; href: string; action: string }) {
  return (
    <section className="flex flex-col items-start gap-5 border border-border bg-card px-6 py-12 sm:px-10">
      <p className="kicker">Carteira</p>
      <p className="display max-w-xl text-3xl leading-snug">{text}</p>
      <Link href={href} className={`${primaryButton} px-5 py-3 text-sm`}>
        {action}
      </Link>
    </section>
  );
}

function Deposit({ onDeposited }: { onDeposited: (wallet: Wallet, amount: string) => void }) {
  const { formRef, general, fields, clear, showFields, fail } = useFormErrors();
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = parseMoney(value);
    if (!amount || Number(amount) < MIN || Number(amount) > MAX) {
      return showFields({ amount: "Informe um valor entre R$ 1,00 e R$ 100.000,00." });
    }
    setSending(true);
    clear();
    try {
      onDeposited(await api<Wallet>("/api/wallet/deposit/", { method: "POST", body: { amount } }), amount);
      setValue("");
    } catch (failure) {
      fail(failure);
    } finally {
      setSending(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={submit} aria-labelledby="depositar" className="flex max-w-md flex-col gap-4" noValidate>
      <h2 id="depositar" className="display border-b border-border pb-3 text-3xl">
        Depositar
      </h2>
      {general ? <FormAlert>{general}</FormAlert> : null}
      <Field
        label="Valor do depósito"
        name="amount"
        inputMode="decimal"
        autoComplete="off"
        placeholder="Ex.: 1.000,00"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        hint="Saldo simulado: nenhum dinheiro real muda de mãos."
        error={fields.amount}
      />
      <div className="flex flex-wrap gap-2">
        {QUICK.map((amount) => (
          <button
            key={amount}
            type="button"
            onClick={() => setValue(amountInput(amount))}
            className="pressable figures rounded-[3px] border border-border px-3 py-1.5 text-sm hover:border-foreground"
          >
            R$ {Number(amount).toLocaleString("pt-BR")}
          </button>
        ))}
      </div>
      <SubmitButton sending={sending} label="Depositar" sendingLabel="Depositando…" />
    </form>
  );
}

/** Carteira do licitante: total, comprometido em lances que lidera, disponível e depósito simulado. */
export function WalletPanel() {
  const { user, loading } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const bidder = user?.role === "bidder";

  useEffect(() => {
    if (!bidder) return;
    let active = true;
    api<Wallet>("/api/wallet/").then((data) => active && setWallet(data), () => {});
    return () => {
      active = false;
    };
  }, [bidder]);

  if (loading) return <p className="text-muted">Carregando a carteira…</p>;
  if (!user) return <Gate text="Entre com uma conta de licitante para ver e depositar saldo." href="/entrar" action="Entrar" />;
  if (!bidder) {
    return <Gate text="A carteira é para licitantes. O que você recebe aparece no painel do leiloeiro." href="/painel" action="Ir para o painel" />;
  }

  const items = [
    { label: "Total", value: wallet?.balance, hint: "Tudo o que você depositou, menos os arremates pagos." },
    { label: "Comprometido", value: wallet?.committed, hint: "Reservado nos lotes em que você está ganhando." },
    { label: "Disponível", value: wallet?.available, hint: "O que você pode usar em novos lances." },
  ];
  return (
    <div className="flex flex-col gap-12">
      <header className="flex flex-col gap-3">
        <p className="kicker">Carteira</p>
        <h1 className="display text-5xl font-light">Seu saldo</h1>
      </header>
      <section aria-label="Saldo">
        <dl className="grid border-t border-l border-border sm:grid-cols-3">
          {items.map((item) => (
            <div key={item.label} className="flex flex-col gap-2 border-r border-b border-border bg-card px-6 py-5">
              <dt className="kicker">{item.label}</dt>
              <dd className="display figures text-3xl">{item.value ? money(item.value) : "—"}</dd>
              <dd className="text-xs text-muted">{item.hint}</dd>
            </div>
          ))}
        </dl>
      </section>
      <p role="status" className={notice ? "border-l-2 border-live bg-card py-2 pl-3 text-sm" : "sr-only"}>
        {notice}
      </p>
      <Deposit
        onDeposited={(updated, amount) => {
          setWallet(updated);
          setNotice(`Depósito de ${money(amount)} feito. Disponível agora: ${money(updated.available)}.`);
        }}
      />
    </div>
  );
}
