import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { LotRoom } from "@/components/room/lot-room";
import { Unavailable } from "@/components/unavailable";
import type { Page } from "@/lib/lots";
import type { Bid, LiveLot } from "@/lib/room";
import { BackendError, backendGet } from "@/lib/server-api";

// Metadados e página leem o mesmo lote: uma chamada só por requisição.
const loadLot = cache(async (id: string): Promise<LiveLot | BackendError> => {
  if (!/^\d{1,9}$/.test(id)) notFound();
  try {
    return await backendGet<LiveLot>(`/api/lots/${id}/`);
  } catch (error) {
    if (error instanceof BackendError && error.status === 404) notFound(); // inexistente ou cancelado
    return error instanceof BackendError ? error : new BackendError(0);
  }
});

export async function generateMetadata({ params }: PageProps<"/lotes/[id]">): Promise<Metadata> {
  const lot = await loadLot((await params).id);
  return !(lot instanceof BackendError) ? { title: lot.title, description: `Lote de ${lot.artist || "autoria desconhecida"} em leilão na verz.` } : {};
}

export default async function LotPage({ params }: PageProps<"/lotes/[id]">) {
  const { id } = await params;
  const lot = await loadLot(id);
  const bids = lot instanceof BackendError ? lot : await backendGet<Page<Bid>>(`/api/lots/${id}/bids/`).catch((error) => error);
  if (lot instanceof BackendError || bids instanceof Error) {
    return <Unavailable what="A sala deste lote" error={lot instanceof BackendError ? lot : bids} retryHref={`/lotes/${id}`} />;
  }
  return <LotRoom initialLot={lot} initialBids={bids} />;
}
