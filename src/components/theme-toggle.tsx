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
    <div role="group" aria-label="Tema" className="flex rounded-md border border-border text-sm">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={mounted && theme === option.value}
          onClick={() => setTheme(option.value)}
          className="px-2 py-1 first:rounded-l-md last:rounded-r-md aria-pressed:bg-foreground aria-pressed:text-background"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
