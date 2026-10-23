import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AuditReport } from "@/components/audit/audit-report";
import type { Audit } from "@/lib/audit";
import { BackendError, backendGet } from "@/lib/server-api";

export const metadata: Metadata = {
  title: "Auditoria do lote",
  description: "Verificação pública do histórico de lances: qualquer pessoa confere, sem login.",
};

export default async function AuditPage({ params }: PageProps<"/lotes/[id]/auditoria">) {
  const { id } = await params;
  if (!/^\d{1,9}$/.test(id)) notFound();
  let audit: Audit;
  try {
    audit = await backendGet<Audit>(`/api/lots/${id}/audit/`); // refeita a cada visita (no-store)
  } catch (error) {
    if (error instanceof BackendError && error.status === 404) notFound();
    return (
      <div role="alert" className="flex flex-col items-start gap-4 border-l-2 border-accent bg-card px-6 py-10">
        <p className="display text-2xl">A auditoria está indisponível no momento.</p>
        <p className="text-sm text-muted">Não conseguimos falar com o servidor de lotes. Tente de novo em instantes.</p>
        <Link href={`/lotes/${id}/auditoria`} className="text-link text-sm">
          Tentar de novo
        </Link>
      </div>
    );
  }
  return <AuditReport audit={audit} />;
}
