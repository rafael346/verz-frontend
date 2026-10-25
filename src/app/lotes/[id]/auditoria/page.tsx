import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { AuditReport } from "@/components/audit/audit-report";
import { Unavailable } from "@/components/unavailable";
import type { Audit } from "@/lib/audit";
import { BackendError, backendGet } from "@/lib/server-api";

export const metadata: Metadata = {
  title: "Auditoria do lote",
  description: "Verificação pública do histórico de lances: qualquer pessoa confere, sem login.",
};

export default async function AuditPage({ params, searchParams }: PageProps<"/lotes/[id]/auditoria">) {
  const { id } = await params;
  if (!/^\d{1,9}$/.test(id)) notFound();
  const asked = Number.parseInt(String((await searchParams).pagina ?? "1"), 10);
  const page = Number.isFinite(asked) && asked > 0 ? asked : 1; // inválido vira a primeira página
  let audit: Audit;
  try {
    audit = await backendGet<Audit>(`/api/lots/${id}/audit/?page=${page}`); // refeita a cada visita (no-store)
  } catch (error) {
    // Página que não existe mais (ou nunca existiu) volta para a primeira; lote inexistente é 404.
    if (error instanceof BackendError && error.status === 404 && page > 1) redirect(`/lotes/${id}/auditoria`);
    if (error instanceof BackendError && error.status === 404) notFound();
    return <Unavailable what="A auditoria" error={error} retryHref={`/lotes/${id}/auditoria`} />;
  }
  return <AuditReport audit={audit} />;
}
