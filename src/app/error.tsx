"use client"; // limites de erro do Next precisam ser Client Components

import { useEffect } from "react";

/** Erro inesperado ao renderizar uma página: aviso no estilo do catálogo, em vez da página padrão do Next em inglês. */
export default function PageError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error); // fica no console do navegador para quem for investigar
  }, [error]);

  return (
    <div role="alert" className="flex flex-col items-start gap-4 border-l-2 border-accent bg-card px-6 py-10">
      <p className="display text-2xl">Algo saiu do lugar nesta página.</p>
      <p className="text-sm text-muted">Tente carregar a página de novo. Se o erro continuar, volte em alguns minutos.</p>
      <button type="button" onClick={() => retry()} className="pressable text-link text-sm">
        Tentar de novo
      </button>
    </div>
  );
}
