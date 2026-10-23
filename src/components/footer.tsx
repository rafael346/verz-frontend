/** Colofão, como no fim de um catálogo impresso: quem somos, de onde vêm as obras e como auditar. */
export function Footer() {
  return (
    <footer className="mt-24 print:hidden">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="double-rule" />
      </div>
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 text-sm sm:grid-cols-3 sm:px-6">
        <div>
          <p translate="no" className="display text-2xl italic">
            verz
          </p>
          <p className="mt-2 max-w-xs text-muted">
            Casa de leilões online de obras em domínio público. Os valores são simulados: nenhum dinheiro real muda de mãos.
          </p>
        </div>
        <div>
          <p className="kicker">Acervo</p>
          <p className="mt-2 max-w-xs text-muted">
            Imagens e dados das obras:{" "}
            <a
              href="https://www.metmuseum.org/about-the-met/policies-and-documents/open-access"
              className="text-link text-foreground"
              rel="noreferrer"
              target="_blank"
            >
              The Metropolitan Museum of Art, Open Access (CC0)
              <span className="sr-only"> (abre em nova aba)</span>
            </a>
            .
          </p>
        </div>
        <div>
          <p className="kicker">Transparência</p>
          <p className="mt-2 max-w-xs text-muted">
            Cada lance é selado e encadeado ao anterior. Qualquer pessoa pode auditar o histórico de um lote, sem login.
          </p>
        </div>
      </div>
    </footer>
  );
}
