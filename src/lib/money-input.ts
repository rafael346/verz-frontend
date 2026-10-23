/**
 * Valor digitado em reais → decimal da API ("1250.50"). Aceita "1.250,50", "1250,5", "1250.50" e "1.250"
 * (ponto de milhar, como se escreve no Brasil). Devolve null para qualquer outra coisa.
 */
export function parseMoney(text: string): string | null {
  let value = text.replace(/R\$/i, "").replace(/\s/g, "");
  if (!value) return null;
  if (value.includes(",")) {
    if (value.split(",").length > 2) return null;
    value = value.replace(/\.(?=\d{3}(?:\.|,))/g, "").replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(value)) {
    value = value.replace(/\./g, "");
  }
  return /^\d+(\.\d{1,2})?$/.test(value) ? Number(value).toFixed(2) : null;
}
