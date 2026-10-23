import Link from "next/link";

import type { Receipt } from "@/lib/audit";
import { clockTime, lotNumber, money } from "@/lib/format";

import { Check } from "./audit-report";
import { CopyLink } from "./copy-link";
import { PrintButton } from "./print-button";

/** Comprovante público de arremate: a ficha do arremate e as três verificações que o tornam confiável (D19). */
export function ReceiptCard({ receipt, origin }: { receipt: Receipt; origin: string }) {
  const checks = [
    { label: "Assinatura do comprovante", ok: receipt.authentic },
    { label: "Histórico de lances do lote íntegro", ok: receipt.audit.intact },
    { label: "Selo final igual ao do histórico", ok: receipt.audit.head_matches },
  ];
  const valid = checks.every((check) => check.ok);
  const auditHref = `/lotes/${receipt.lot.id}/auditoria`;
  const fields = [
    { label: "Valor do arremate", value: <span className="display figures text-3xl">{money(receipt.amount)}</span> },
    { label: "Arrematante", value: receipt.winner_alias },
    { label: "Emitido em", value: <time dateTime={receipt.issued_at}>{clockTime(receipt.issued_at)}</time> },
  ];

  return (
    <article className="mx-auto flex w-full max-w-3xl flex-col gap-8 border border-border bg-card p-6 sm:p-10 print:border-0 print:p-0">
      <header className="flex flex-col gap-3">
        <p className="kicker figures">Comprovante de arremate · Lote {lotNumber(receipt.lot.id)}</p>
        <h1 data-valid={valid || undefined} className="display text-4xl font-light text-accent data-valid:text-foreground sm:text-5xl">
          {valid ? "Comprovante autêntico" : "Comprovante não confere"}
        </h1>
      </header>

      {!valid ? (
        <p role="alert" className="border-l-2 border-accent bg-background py-2 pl-3 text-sm">
          {!receipt.authentic
            ? "A assinatura deste comprovante não confere: ele foi alterado ou não foi emitido pela verz."
            : "O histórico de lances do lote não confere com o que foi gravado neste comprovante."}{" "}
          <Link href={auditHref} className="text-link">
            Veja a auditoria do lote
          </Link>
          .
        </p>
      ) : null}

      <div className="grid grid-cols-[5rem_minmax(0,1fr)] gap-4 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-6">
        <div className="flex aspect-square items-center justify-center overflow-hidden border border-border bg-background p-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- cópia local da obra, servida pela API */}
          <img src={receipt.lot.image_url} alt="" width={128} height={128} className="h-auto max-h-full w-auto max-w-full object-contain" />
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <p className="display text-2xl leading-snug">{receipt.lot.title}</p>
          <p className="text-sm text-muted">{receipt.lot.artist || "Autoria desconhecida"}</p>
        </div>
      </div>

      <dl className="grid gap-x-8 gap-y-5 border-y border-border py-6 sm:grid-cols-3">
        {fields.map((field) => (
          <div key={field.label} className="flex flex-col gap-1">
            <dt className="kicker">{field.label}</dt>
            <dd>{field.value}</dd>
          </div>
        ))}
        <div className="flex min-w-0 flex-col gap-1 sm:col-span-3">
          <dt className="kicker">Selo final da cadeia de lances</dt>
          <dd>
            <code className="block font-mono text-xs break-all select-all">{receipt.head_hash}</code>
          </dd>
        </div>
      </dl>

      <section aria-labelledby="verificacoes" className="flex flex-col gap-3">
        <h2 id="verificacoes" className="kicker text-foreground">
          Conferido agora, nesta visita
        </h2>
        <ul aria-label="Verificações" className="flex flex-col">
          {checks.map((check) => (
            <li key={check.label} className="flex items-baseline justify-between gap-4 border-b border-border py-2.5 text-sm">
              <span>{check.label}</span>
              <Check ok={check.ok} />
            </li>
          ))}
        </ul>
      </section>

      {/* No papel não há link para clicar: o endereço impresso é o que permite conferir depois. */}
      <p className="hidden text-sm print:block">
        Confira este comprovante em <span className="break-all">{`${origin}/comprovante/${receipt.token}`}</span>
      </p>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm print:hidden">
        <Link href={auditHref} className="ink-link pb-0.5">
          Auditar o histórico do lote
        </Link>
        <CopyLink path={`/comprovante/${receipt.token}`} label="Copiar link" />
        <PrintButton />
      </div>
    </article>
  );
}
