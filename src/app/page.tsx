import { HeroActions } from "@/components/hero-actions";
import { LiveHighlights } from "@/components/live-highlights";

const STEPS = [
  {
    numeral: "I",
    title: "Deposite saldo",
    text: "O saldo é simulado. Enquanto você lidera um lote, o valor fica reservado; se alguém cobrir, ele volta na hora.",
  },
  {
    numeral: "II",
    title: "Dê lances ao vivo",
    text: "A sala atualiza sozinha. Um lance nos últimos dois minutos prorroga o pregão, então ninguém arremata no susto.",
  },
  {
    numeral: "III",
    title: "Arremate",
    text: "Ao encerrar, o valor sai da sua carteira e você recebe um comprovante com link para compartilhar.",
  },
  {
    numeral: "IV",
    title: "Audite",
    text: "Cada lance é selado e encadeado ao anterior. Qualquer pessoa confere se o histórico de um lote foi alterado.",
  },
];

function sessionLabel() {
  const month = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date());
  return `Sessão contínua · ${month}`;
}

export default function Home() {
  return (
    <div className="flex flex-col gap-24">
      <section className="grid gap-10 pt-6 lg:grid-cols-[1.4fr_1fr] lg:items-end">
        <div>
          <p className="kicker">{sessionLabel()}</p>
          <h1 className="display mt-5 text-[2.6rem] leading-[1.04] font-light sm:text-6xl lg:text-7xl">
            Obras-primas em domínio público, <em className="font-normal text-accent">arrematadas ao vivo.</em>
          </h1>
        </div>
        <div className="flex flex-col gap-6 lg:pb-3">
          <p className="max-w-md text-lg leading-relaxed text-muted">
            Pinturas, gravuras e objetos do acervo aberto do Metropolitan Museum, em lotes com lance inicial, incremento
            e hora para acabar. O histórico de cada lote é público e verificável.
          </p>
          <HeroActions />
        </div>
      </section>

      <LiveHighlights />

      <section id="como-funciona" aria-labelledby="como-funciona-titulo" className="scroll-mt-8">
        <h2 id="como-funciona-titulo" className="display border-b border-border pb-3 text-3xl">
          Como funciona
        </h2>
        <ol className="grid gap-x-10 gap-y-8 pt-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <li key={step.numeral} className="flex flex-col gap-3">
              <span aria-hidden className="display text-4xl text-accent italic">
                {step.numeral}
              </span>
              <h3 className="font-semibold">{step.title}</h3>
              <p className="text-sm leading-relaxed text-muted">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
