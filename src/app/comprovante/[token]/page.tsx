import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { ReceiptCard } from "@/components/audit/receipt-card";
import type { Receipt } from "@/lib/audit";
import { BackendError, backendGet } from "@/lib/server-api";

export const metadata: Metadata = {
  title: "Comprovante de arremate",
  // Público para quem recebe o link, não para buscadores.
  robots: { index: false, follow: false },
};

export default async function ReceiptPage({ params }: PageProps<"/comprovante/[token]">) {
  const { token } = await params;
  if (!/^[\w-]{8,64}$/.test(token)) notFound(); // o mesmo formato do slug na rota do backend
  let receipt: Receipt;
  try {
    receipt = await backendGet<Receipt>(`/api/receipts/${token}/`);
  } catch (error) {
    if (error instanceof BackendError && error.status === 404) notFound();
    return (
      <div role="alert" className="flex flex-col items-start gap-4 border-l-2 border-accent bg-card px-6 py-10">
        <p className="display text-2xl">O comprovante está indisponível no momento.</p>
        <p className="text-sm text-muted">Não conseguimos falar com o servidor. Tente de novo em instantes.</p>
        <Link href={`/comprovante/${token}`} className="text-link text-sm">
          Tentar de novo
        </Link>
      </div>
    );
  }
  // O nginx repassa o Host do visitante; só vira texto na impressão.
  // shortcut: https para todo host que não seja localhost; atrás de TLS terminado em outro lugar, ler X-Forwarded-Proto.
  const host = (await headers()).get("host");
  return <ReceiptCard receipt={receipt} origin={`http${host?.startsWith("localhost") ? "" : "s"}://${host ?? "verz"}`} />;
}
