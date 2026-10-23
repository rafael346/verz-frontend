import type { ReactNode } from "react";

type Props = { kicker: string; title: ReactNode; intro: string; notes: string[]; children: ReactNode; footer: ReactNode };

/** Página de acesso em duas colunas: o texto de catálogo à esquerda, o formulário numa folha à direita. */
export function AuthLayout({ kicker, title, intro, notes, children, footer }: Props) {
  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_minmax(0,26rem)] lg:gap-20">
      <section className="flex flex-col gap-5 lg:pt-6">
        <p className="kicker">{kicker}</p>
        <h1 className="display text-4xl leading-tight font-light sm:text-5xl">{title}</h1>
        <p className="max-w-md leading-relaxed text-muted">{intro}</p>
        <ul className="mt-2 flex max-w-md flex-col border-t border-border">
          {notes.map((note) => (
            <li key={note} className="border-b border-border py-3 text-sm">
              {note}
            </li>
          ))}
        </ul>
      </section>
      <section className="flex flex-col gap-6 rounded-[3px] border border-border bg-card p-6 sm:p-8">
        {children}
        <p className="border-t border-border pt-5 text-sm text-muted">{footer}</p>
      </section>
    </div>
  );
}
