# verz-frontend

Frontend da casa de leilões **verz** em Next.js 16 (App Router), React 19, TypeScript e Tailwind 4.
A API fica no repositório `verz-backend`. As decisões do projeto estão em `../DECISOES.md`.

## Como rodar

O navegador sempre entra pelo nginx (`http://localhost:8080`), que manda `/api/` para o Django e o resto para o Next.
Os arquivos do Docker Compose ficam no `verz-backend`, e o README de lá explica a primeira configuração (as chaves do
`.env.docker`).

- **Tudo em containers:** em `verz-backend`, `docker compose up --build` e abra `http://localhost:8080`.
- **Front com recarga automática:** aqui, `npm install` e `npm run dev`; em `verz-backend`,
  `FRONTEND_UPSTREAM=host.docker.internal:3000 docker compose up db backend worker nginx`; abra `http://localhost:8080`.

## Testes e checagens

```bash
npm test            # Vitest + Testing Library (115 testes)
npx tsc --noEmit    # tipos (se faltar o tipo de uma rota nova: npx next typegen)
npx eslint .        # lint
```

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
| `/painel` | leiloeiro | Balanço, criação de lote a partir do acervo do Met e acompanhamento dos lotes. |
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
