"use client";

import { useState } from "react";

/** Copia o link absoluto de uma página pública; sem permissão de área de transferência, mostra o link. */
export function CopyLink({ path, label, className = "" }: { path: string; label: string; className?: string }) {
  const [message, setMessage] = useState<string | null>(null);

  async function copy() {
    const url = `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(url);
      setMessage("Link copiado");
    } catch {
      setMessage(`Não foi possível copiar. O link é ${url}`);
    }
  }

  return (
    <>
      <button type="button" onClick={copy} className={`pressable ink-link pb-0.5 ${className}`}>
        {label}
      </button>
      <span role="status" className="text-xs break-all text-muted">
        {message}
      </span>
    </>
  );
}
