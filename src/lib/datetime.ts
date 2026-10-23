/** Conversão entre o `<input type="datetime-local">` (hora do navegador, sem fuso) e ISO com fuso para a API (D16). */

const pad = (n: number) => String(n).padStart(2, "0");

export function toLocalInput(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fromLocalInput(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const moment = new Date(value); // sem fuso no texto: o JavaScript lê como hora local
  return Number.isNaN(moment.getTime()) ? null : moment.toISOString();
}
