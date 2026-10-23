import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-start gap-4 py-10">
      <p className="kicker">Página não encontrada</p>
      <h1 className="display text-5xl font-light">Esta página não está no catálogo.</h1>
      <p className="max-w-xl text-muted">O endereço pode estar errado. Se era um lote, ele pode ter sido cancelado pelo leiloeiro.</p>
      <Link href="/lotes" className="text-link">
        Voltar para a vitrine
      </Link>
    </div>
  );
}
