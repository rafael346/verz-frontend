"use client";

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="pressable ink-link pb-0.5">
      Imprimir
    </button>
  );
}
