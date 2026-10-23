/** Formatação pt-BR. Horários sempre em Brasília: o mesmo texto no servidor e no navegador (sem erro de hidratação). */

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const CLOCK = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function money(value: string): string {
  return BRL.format(Number(value));
}

export function clockTime(iso: string): string {
  return CLOCK.format(new Date(iso));
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Tempo restante em linguagem de pregão: "2 d 3 h", "2 h 05 min", "4 min 09 s", "45 s". */
export function remaining(ms: number): string {
  if (ms <= 0) return "encerrando…";
  const total = Math.floor(ms / 1000);
  const days = Math.floor(total / 86_400);
  const hours = Math.floor((total % 86_400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (days) return `${days} d ${hours} h`;
  if (hours) return `${hours} h ${pad(minutes)} min`;
  if (minutes) return `${minutes} min ${pad(seconds)} s`;
  return `${seconds} s`;
}

export function lotNumber(id: number): string {
  return String(id).padStart(3, "0");
}

export function bidsCount(n: number): string {
  return n === 1 ? "1 lance" : `${n} lances`;
}

const AMOUNT = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Valor para um campo em reais, sem o "R$": "1.050,00" (o formato que o `parseMoney` lê de volta). */
export function amountInput(value: string): string {
  return AMOUNT.format(Number(value));
}
