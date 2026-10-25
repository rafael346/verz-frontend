import Link from "next/link";

import { BackendError } from "@/lib/server-api";

type Props = { what: string; error: unknown; retryHref: string };

/** Leitura no servidor que falhou. Com 429 (limite de visitas), não culpa o servidor: pede para esperar. */
export function Unavailable({ what, error, retryHref }: Props) {
  const busy = error instanceof BackendError && error.status === 429;
  return (
    <div role="alert" className="flex flex-col items-start gap-4 border-l-2 border-accent bg-card px-6 py-10">
      <p className="display text-2xl">
        {busy ? "Muitas páginas abertas em sequência." : `${what} está indisponível no momento.`}
      </p>
      <p className="text-sm text-muted">
        {busy
          ? "Aguarde alguns segundos e tente de novo."
          : "Não conseguimos falar com o servidor de lotes. Tente de novo em instantes."}
      </p>
      <Link href={retryHref} className="text-link text-sm">
        Tentar de novo
      </Link>
    </div>
  );
}
