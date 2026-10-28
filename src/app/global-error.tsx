"use client"; // limites de erro do Next precisam ser Client Components

import "./globals.css";

/** Erro no próprio layout raiz: substitui o documento inteiro, então traz o próprio <html> e os estilos (sem cabeçalho). */
export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="pt-BR">
      <body className="font-sans">
        <title>Erro · verz</title>
        <main className="mx-auto flex max-w-xl flex-col items-start gap-4 px-4 py-16">
          <p className="kicker">verz · Casa de Leilões</p>
          <h1 className="display text-4xl font-light">O site encontrou um erro.</h1>
          <p className="text-muted">Tente de novo em instantes. Se o erro continuar, volte em alguns minutos.</p>
          <button type="button" onClick={() => retry()} className="text-link">
            Tentar de novo
          </button>
        </main>
      </body>
    </html>
  );
}
