import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { ReceiptCard } from "@/components/audit/receipt-card";
import { Unavailable } from "@/components/unavailable";
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
    return <Unavailable what="O comprovante" error={error} retryHref={`/comprovante/${token}`} />;
  }
  // Host e esquema vêm do nginx (Host do visitante, X-Forwarded-Proto = $scheme); só viram texto na impressão.
  const request = await headers();
  const origin = `${request.get("x-forwarded-proto") ?? "http"}://${request.get("host") ?? "localhost"}`;
  return <ReceiptCard receipt={receipt} origin={origin} />;
}
