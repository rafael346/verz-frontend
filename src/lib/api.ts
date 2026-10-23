/** Cliente da API do backend (D04): sessão por cookie e token CSRF lido do cookie a cada escrita. */

type ErrorBody = { detail?: unknown; non_field_errors?: unknown; [field: string]: unknown } | null;

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: ErrorBody,
  ) {
    super(messageFor(status, body));
  }

  /** Primeira mensagem de cada campo, no formato do DRF: {"email": ["..."]}. */
  fieldErrors(): Record<string, string> {
    const errors: Record<string, string> = {};
    for (const [field, value] of Object.entries(this.body ?? {})) {
      if (field !== "detail" && field !== "non_field_errors" && field !== "code" && Array.isArray(value)) {
        errors[field] = String(value[0]);
      }
    }
    return errors;
  }
}

function firstMessage(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value.length) return String(value[0]);
  return null;
}

function messageFor(status: number, body: ErrorBody): string {
  if (status === 0) return "Sem conexão com o servidor. Verifique sua internet e tente de novo.";
  if (status === 429) return "Muitas tentativas seguidas. Aguarde um pouco e tente de novo.";
  // 503 com detail é indisponibilidade explicada pelo próprio backend (ex.: acervo do Met fora do ar).
  if (status === 503 && typeof body?.detail === "string") return body.detail;
  if (status >= 500) return "O servidor não respondeu como esperado. Tente de novo em instantes.";
  return (
    firstMessage(body?.detail) ??
    firstMessage(body?.non_field_errors) ??
    (status === 403 ? "Você não tem permissão para fazer isso." : "Não foi possível concluir a ação.")
  );
}

function readCookie(name: string): string | null {
  const entry = document.cookie.split("; ").find((part) => part.startsWith(`${name}=`));
  return entry ? decodeURIComponent(entry.slice(name.length + 1)) : null;
}

async function csrfToken(): Promise<string> {
  // Nunca guardar o token: o Django o troca no login e no logout (D12).
  if (!readCookie("csrftoken")) await fetch("/api/auth/csrf/", { credentials: "same-origin" });
  return readCookie("csrftoken") ?? "";
}

type Options = { method?: "GET" | "POST"; body?: unknown };

export async function api<T = unknown>(path: string, { method = "GET", body }: Options = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (method !== "GET") headers["X-CSRFToken"] = await csrfToken();

  let response: Response;
  try {
    response = await fetch(path, {
      method,
      headers,
      credentials: "same-origin",
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, null);
  }
  const data = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(response.status, data);
  return data as T;
}
