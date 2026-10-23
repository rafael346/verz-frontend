import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";

import { LotRoom } from "@/components/room/lot-room";
import type { Page } from "@/lib/lots";
import type { Bid, LiveLot } from "@/lib/room";
import { BackendError, backendGet } from "@/lib/server-api";

// Metadados e página leem o mesmo lote: uma chamada só por requisição.
const loadLot = cache(async (id: string) => {
  if (!/^\d{1,9}$/.test(id)) notFound();
  try {
    return await backendGet<LiveLot>(`/api/lots/${id}/`);
  } catch (error) {
    if (error instanceof BackendError && error.status === 404) notFound(); // inexistente ou cancelado
    return null;
  }
});

export async function generateMetadata({ params }: PageProps<"/lotes/[id]">): Promise<Metadata> {
  const lot = await loadLot((await params).id);
  return lot ? { title: lot.title, description: `Lote de ${lot.artist || "autoria desconhecida"} em leilão na verz.` } : {};
}

export default async function LotPage({ params }: PageProps<"/lotes/[id]">) {
  const { id } = await params;
  const lot = await loadLot(id);
  const bids = lot ? await backendGet<Page<Bid>>(`/api/lots/${id}/bids/`).catch(() => null) : null;
  if (!lot || !bids) {
    return (
      <div role="alert" className="flex flex-col items-start gap-4 border-l-2 border-accent bg-card px-6 py-10">
        <p className="display text-2xl">A sala deste lote está indisponível no momento.</p>
        <p className="text-sm text-muted">Não conseguimos falar com o servidor de lotes. Tente de novo em instantes.</p>
        <Link href={`/lotes/${id}`} className="text-link text-sm">
          Tentar de novo
        </Link>
      </div>
    );
  }
  return <LotRoom initialLot={lot} initialBids={bids} />;
}
