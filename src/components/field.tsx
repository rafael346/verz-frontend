import { useId, type InputHTMLAttributes, type ReactNode } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string };

/** Campo com rótulo, dica e erro ligados ao input (aria-describedby), para leitores de tela. */
export function Field({ label, error, hint, ...input }: Props) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className="rounded-md border border-border bg-card px-3 py-2 aria-invalid:border-red-600"
        {...input}
      />
      {error ? (
        <p id={`${id}-error`} className="text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-sm text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Aviso geral do formulário, anunciado por leitores de tela. */
export function FormAlert({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-md border border-red-600 px-3 py-2 text-sm text-red-700 dark:text-red-400">
      {children}
    </p>
  );
}

export function SubmitButton({ sending, label, sendingLabel }: { sending: boolean; label: string; sendingLabel: string }) {
  return (
    <button
      type="submit"
      disabled={sending}
      className="rounded-md bg-accent px-4 py-2 font-medium text-white disabled:opacity-60 dark:text-background"
    >
      {sending ? sendingLabel : label}
    </button>
  );
}
