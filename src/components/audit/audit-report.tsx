import Link from "next/link";

import { shortHash, type Audit } from "@/lib/audit";
import { clockTime, lotNumber, money } from "@/lib/format";

/** "Confere" / "Não confere" com cor e símbolo; o símbolo é só visual, a palavra é o que se lê. */
export function Check({ ok }: { ok: boolean }) {
  return (
    <span data-ok={ok || undefined} className="kicker inline-flex items-center gap-1 text-accent data-ok:text-live">
      <span aria-hidden>{ok ? "✓" : "✕"}</span>
      {ok ? "Confere" : "Não confere"}
    </span>
  );
}

/** Relatório público da auditoria: o servidor recalcula a cadeia de lances e o selo do lote a cada visita (D18). */
export function AuditReport({ audit }: { audit: Audit }) {
  const { lot } = audit;
  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-3">
        <p className="kicker figures">Auditoria pública · Lote {lotNumber(lot.id)}</p>
        <h1 data-intact={audit.intact || undefined} className="display text-5xl font-light text-accent data-intact:text-foreground">
          {audit.intact ? "Histórico íntegro" : "Histórico adulterado"}
        </h1>
        <p className="max-w-2xl text-muted">
          <span className="text-foreground">{lot.title}</span>
          {lot.artist ? `, ${lot.artist}` : ""}.{" "}
          {audit.intact
            ? "Todos os lances conferem com a cadeia selada, e o estado do lote confere com o selo."
            : "A verificação encontrou diferenças entre o que está registrado e o que foi selado."}
        </p>
      </header>

      {audit.problems.length ? (
        <div role="alert" className="flex flex-col gap-2 border-l-2 border-accent bg-card px-5 py-4">
          <p className="font-semibold">O que não confere</p>
          <ul className="flex list-disc flex-col gap-1 pl-5 text-sm">
            {audit.problems.map((problem) => (
              <li key={problem}>{problem}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <section aria-labelledby="como" className="grid gap-6 border-y border-border py-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-2">
          <h2 id="como" className="kicker text-foreground">
            O que foi verificado agora
          </h2>
          <p className="text-sm text-muted">
            Cada lance é selado com HMAC-SHA256 junto com o selo do lance anterior, formando uma cadeia: mudar, apagar ou
            inserir um lance quebra todos os selos seguintes. O estado do lote (lance atual, líder, prazos e valores) tem
            um selo próprio. A chave fica só no servidor, que refaz as contas a cada visita a esta página.
          </p>
          <p className="text-sm text-muted">
            O selo final da cadeia fica gravado no comprovante do arremate: se o histórico mudar depois, os dois deixam de
            bater.
          </p>
        </div>
        <dl className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-col gap-1">
            <dt className="kicker">Lances registrados</dt>
            <dd className="display figures text-3xl">{audit.bids.length}</dd>
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <dt className="kicker">Selo final da cadeia</dt>
            <dd>
              <code className="block font-mono text-xs break-all select-all">{audit.head_hash}</code>
            </dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="lances" className="flex flex-col gap-3">
        <h2 id="lances" className="display border-b border-border pb-3 text-3xl">
          Lances
        </h2>
        {audit.bids.length ? (
          <ol aria-label="Lances auditados" className="flex flex-col">
            {audit.bids.map((bid) => (
              <li
                key={bid.sequence}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-1 border-b border-border py-3 text-sm sm:grid-cols-[auto_minmax(0,1fr)_auto_auto_auto]"
              >
                <span className="figures text-xs text-muted">{lotNumber(bid.sequence)}</span>
                <span className="truncate">{bid.bidder_alias}</span>
                <span className="figures text-right">{money(bid.amount)}</span>
                <code
                  title={bid.hash}
                  className="col-span-2 col-start-2 font-mono text-xs text-muted sm:col-span-1 sm:col-start-auto"
                >
                  <time dateTime={bid.created_at} className="mr-3 font-sans">
                    {clockTime(bid.created_at)}
                  </time>
                  {shortHash(bid.hash)}
                </code>
                <span className="row-start-2 text-right sm:row-start-auto">
                  <Check ok={bid.valid} />
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="display text-lg text-muted italic">Nenhum lance registrado neste lote.</p>
        )}
      </section>

      <nav aria-label="Auditoria" className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        {lot.status !== "cancelled" ? (
          <Link href={`/lotes/${lot.id}`} className="ink-link pb-0.5">
            Voltar para a sala do lote
          </Link>
        ) : null}
        {/* JSON cru: quem quiser guarda e compara depois, sem depender desta página. */}
        <a href={`/api/lots/${lot.id}/audit/`} className="ink-link pb-0.5">
          Dados brutos da auditoria (JSON)
        </a>
      </nav>
    </div>
  );
}
