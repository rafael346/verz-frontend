/**
 * Um relógio de 1 s compartilhado por todas as contagens regressivas da página (um só setInterval).
 * Usa a hora do servidor: o relógio do visitante pode estar minutos errado, e num pregão o prazo é o que conta.
 */

function serverOffset(): number {
  if (typeof document === "undefined") return 0;
  const serverTime = Number(document.querySelector<HTMLMetaElement>('meta[name="server-time"]')?.content);
  return Number.isFinite(serverTime) && serverTime > 0 ? serverTime - Date.now() : 0;
}

// Calculado uma vez, ao carregar: inclui o tempo de entrega da página, então erra para menos tempo restante.
const offset = serverOffset();
const serverNow = () => Date.now() + offset;

let now = 0;
let timer: ReturnType<typeof setInterval> | undefined;
const listeners = new Set<() => void>();

export function subscribeClock(listener: () => void): () => void {
  listeners.add(listener);
  if (!timer) {
    now = serverNow();
    timer = setInterval(() => {
      now = serverNow();
      listeners.forEach((notify) => notify());
    }, 1000);
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

/** Valor estável entre leituras (exigência do useSyncExternalStore); só anda com o relógio. */
export function clockNow(): number {
  if (!listeners.size && Math.abs(serverNow() - now) > 1000) now = serverNow();
  return now;
}
