import { cookies, headers } from "next/headers";

/**
 * Leitura da API no servidor (Server Components). No Compose, direto no serviço `backend`; no `next dev`, pelo nginx.
 * Repassa o X-Forwarded-For que o nginx definiu, para os limites da API valerem por visitante (NUM_PROXIES=1).
 */
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8080";
const TIMEOUT_MS = 5000;

export class BackendError extends Error {
  constructor(readonly status: number) {
    super(status ? `API respondeu ${status}` : "API indisponível");
  }
}

/**
 * Cabeçalhos da leitura no servidor. Repassa a sessão (só o `sessionid`): sem ela, toda página renderizada no servidor
 * contaria no limite de visitante (60/min por IP), mesmo para quem está logado (D30).
 */
export function backendHeaders(forwardedFor: string | null, session: string | undefined): Record<string, string> {
  const proxySecret = process.env.PROXY_SECRET; // na Vercel: prova à API que a leitura veio do front (D36)
  return {
    Accept: "application/json",
    ...(forwardedFor ? { "X-Forwarded-For": forwardedFor } : {}),
    ...(session ? { Cookie: `sessionid=${session}` } : {}),
    ...(proxySecret ? { "X-Verz-Proxy": proxySecret } : {}),
  };
}

export async function backendGet<T>(path: string): Promise<T> {
  const forwardedFor = (await headers()).get("x-forwarded-for");
  const session = (await cookies()).get("sessionid")?.value;
  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}${path}`, {
      cache: "no-store", // lote ao vivo muda a cada lance
      headers: backendHeaders(forwardedFor, session),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new BackendError(0);
  }
  if (!response.ok) throw new BackendError(response.status);
  return (await response.json()) as T;
}
