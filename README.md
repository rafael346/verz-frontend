# verz-frontend

Frontend da casa de leilões **verz** em Next.js 16 (App Router), React 19, TypeScript e Tailwind 4.
As decisões do projeto estão em `../DECISOES.md`.

## Como rodar

O navegador sempre entra pelo nginx (`http://localhost:8080`), que manda `/api/` para o Django e o resto para o Next.
Os arquivos do Docker Compose ficam no repositório `verz-backend`.

- **Tudo em containers:** em `verz-backend`, `docker compose up --build` e abra `http://localhost:8080`.
- **Front com recarga automática:** aqui, `npm run dev`; em `verz-backend`,
  `FRONTEND_UPSTREAM=host.docker.internal:3000 docker compose up db backend worker nginx`; abra `http://localhost:8080`.

## Testes e checagens

```bash
npm test            # Vitest + Testing Library
npx tsc --noEmit    # tipos
npx eslint .        # lint
```

## Segurança

- CSP com nonce por requisição em `src/proxy.ts` (sem `unsafe-inline`/`unsafe-eval` em produção; há teste).
- O cliente da API (`src/lib/api.ts`) lê o cookie `csrftoken` antes de cada escrita: o Django troca o token no login e no logout.
