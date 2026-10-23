import { headers } from "next/headers";

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

export async function backendGet<T>(path: string): Promise<T> {
  const forwardedFor = (await headers()).get("x-forwarded-for");
  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}${path}`, {
      cache: "no-store", // lote ao vivo muda a cada lance
      headers: { Accept: "application/json", ...(forwardedFor ? { "X-Forwarded-For": forwardedFor } : {}) },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new BackendError(0);
  }
  if (!response.ok) throw new BackendError(response.status);
  return (await response.json()) as T;
}
