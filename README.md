# verz-frontend

Frontend da casa de leilões **verz** em Next.js 16 (App Router), React 19, TypeScript e Tailwind 4.
A API fica no repositório `verz-backend`. As decisões do projeto estão no
[`DECISOES.md` do backend](https://github.com/rafael346/verz-backend/blob/main/DECISOES.md).

## No ar

**https://verz-frontend.vercel.app** (API na Fly.io, banco no Supabase). As contas de teste da produção (um leiloeiro
e duas licitantes) e as senhas são entregues junto com o teste. Para rodar localmente com dados prontos, veja a seção
"Dados de demonstração" do README do backend.

## Como rodar

O navegador sempre entra pelo nginx (`http://localhost:8080`), que manda `/api/` para o Django e o resto para o Next.
Os arquivos do Docker Compose ficam no `verz-backend`, e o README de lá explica a primeira configuração (as chaves do
`.env.docker`).

- **Tudo em containers:** em `verz-backend`, `docker compose up --build` e abra `http://localhost:8080`.
- **Dados de demonstração:** em `verz-backend`, `docker compose exec backend python manage.py seed_demo`. Contas,
  senha e o que cada lote mostra estão na seção "Dados de demonstração" do README do backend.
- **Front com recarga automática:** aqui, `npm install` e `npm run dev`; em `verz-backend`,
  `FRONTEND_UPSTREAM=host.docker.internal:3000 docker compose up db backend worker nginx`; abra `http://localhost:8080`.

## Testes e checagens

```bash
npm test            # Vitest + Testing Library (124 testes)
npx tsc --noEmit    # tipos (se faltar o tipo de uma rota nova: npx next typegen)
npx eslint .        # lint
```

## Testes ponta a ponta

Repetem no navegador, a cada execução, os fluxos que importam: vitrine, cadastro e login, sala ao vivo com duas
licitantes (lance que aparece na outra sem recarregar, "ganhando/superado", recusas), prorrogação nos últimos 2
minutos, liquidação até o comprovante, carteira, cancelamento com estorno, e auditoria e comprovante públicos.

Precisam da pilha do Docker no ar (`docker compose up -d` em `verz-backend`):

```bash
npx playwright install chromium   # uma vez só
npm run e2e                       # a suíte (~60 s)
npm run e2e:met                   # à parte: o leiloeiro busca no Met e cria um lote (depende do museu no ar)
```

- **Dados:** antes de começar, a suíte roda `python manage.py e2e_fixtures` no backend, que cria contas novas (senha
  aleatória, só daquela execução) e lotes sob medida, sem depender do Met. Os testes de prorrogação e de liquidação
  pedem o próprio lote na hora em que começam, porque têm relógio. O backend é procurado em `../verz-backend`
  (ou em `VERZ_BACKEND_DIR`).
- **Em todo teste:** o console precisa estar limpo e não pode haver rolagem horizontal. Vitrine, sala e auditoria
  rodam também em 375 px (projeto `mobile`).
- **Acessibilidade:** o `acessibilidade.spec.ts` roda o axe (regras WCAG 2.1 A/AA) em 11 telas, nos temas claro e
  escuro. O que só um leitor de tela percebe (o que é anunciado e para onde vai o foco) está no roteiro
  [`docs/leitor-de-tela.md`](docs/leitor-de-tela.md), para passar à mão com o NVDA.
- **Um teste por vez:** vários mexem no saldo da mesma licitante; em paralelo, um leria o efeito do outro.
- **Sem repetição automática:** teste instável se corrige. Em caso de falha, trace, captura e vídeo ficam em
  `e2e/test-results/` (`npx playwright show-trace <arquivo>`), e o relatório em `playwright-report/`.
- **Espere 1 minuto entre duas execuções:** as páginas de visitante da suíte usam cerca de 40 das 60 requisições por
  minuto que a API permite a um visitante por IP. Duas execuções coladas esbarram no limite, e a página mostra
  "Muitas páginas abertas em sequência". O limite não é afrouxado por causa dos testes.

## Telas

| Rota | Para quem | O que faz |
|---|---|---|
| `/` | todos | Lotes ao vivo agora (ou os próximos) e como funciona. |
| `/lotes` | todos | Vitrine: ao vivo, agendados e encerrados, com busca; o estado fica na URL. |
| `/lotes/[id]` | todos | Sala do lote: lance atual, contagem, histórico e lance, tudo ao vivo (SSE). |
| `/lotes/[id]/auditoria` | todos, sem login | Recalcula a cadeia de lances e diz se o histórico foi adulterado. |
| `/comprovante/[token]` | quem tem o link | Comprovante do arremate, conferido a cada visita; imprimível. |
| `/carteira` | licitante | Total, comprometido, disponível e depósito simulado. |
| `/arremates` | licitante | Lotes em disputa e encerrados, com o link do comprovante. |
| `/painel` | leiloeiro | Balanço, criação de lote a partir do acervo do Met, acompanhamento e cancelamento (com estorno) dos lotes. |
| `/entrar`, `/cadastro` | visitante | Login e cadastro (licitante ou leiloeiro). |

**Como a sala fica ao vivo:** a página chega renderizada do servidor e abre um `EventSource` no SSE do lote. O
navegador reconecta sozinho e o backend reenvia o que faltou (`Last-Event-ID`). A situação do licitante e o saldo vêm
sempre do backend; a contagem segue o relógio do servidor, não o do visitante.

**Visual:** identidade de catálogo de casa de leilão (papel, tinta e vermelho; "sala de galeria" no tema escuro),
temas claro, escuro e do sistema, e layout testado em 375 e 1440 px.

## Segurança

- CSP com nonce por requisição em `src/proxy.ts` (sem `unsafe-inline`/`unsafe-eval` em produção; há teste). Imagens
  externas só de `images.metmuseum.org`.
- `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy` e HSTS em todas as páginas
  (`next.config.ts`); sem `X-Powered-By`.
- O cliente da API (`src/lib/api.ts`) lê o cookie `csrftoken` antes de cada escrita: o Django troca o token no login e
  no logout.
- Valores em reais são validados no navegador (`parseMoney`) e de novo no backend, que decide tudo.
