"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

const OPTIONS = [
  { value: "light", label: "Claro" },
  { value: "dark", label: "Escuro" },
  { value: "system", label: "Sistema" },
] as const;

const noop = () => () => {};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  // O tema escolhido só é conhecido no navegador: no servidor nenhum botão aparece marcado (sem erro de hidratação).
  const mounted = useSyncExternalStore(noop, () => true, () => false);

  return (
    <div role="group" aria-label="Tema" className="flex items-center text-xs">
      {OPTIONS.map((option, index) => (
        <span key={option.value} className="flex items-center">
          {index > 0 ? (
            <span aria-hidden className="px-1.5 text-border">
              /
            </span>
          ) : null}
          <button
            type="button"
            aria-pressed={mounted && theme === option.value}
            onClick={() => setTheme(option.value)}
            className="pressable py-1 pointer-coarse:py-3 text-muted hover:text-foreground aria-pressed:font-semibold aria-pressed:text-foreground"
          >
            {option.label}
          </button>
        </span>
      ))}
    </div>
  );
}
