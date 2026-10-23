import { useId, type InputHTMLAttributes, type ReactNode } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string };

/** Campo com rótulo, dica e erro ligados ao input (aria-describedby), para leitores de tela. */
export function Field({ label, error, hint, ...input }: Props) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="kicker text-foreground">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className="rounded-[3px] border border-border bg-background px-3 py-2.5 transition-colors duration-150 placeholder:text-muted focus-visible:border-foreground aria-invalid:border-accent"
        {...input}
      />
      {error ? (
        <p id={`${id}-error`} className="text-sm text-accent">
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

/** Aviso geral do formulário, anunciado por leitores de tela; nota à margem, como num catálogo. */
export function FormAlert({ children }: { children: ReactNode }) {
  return (
    <p role="alert" tabIndex={-1} className="border-l-2 border-accent bg-background py-2 pr-3 pl-3 text-sm">
      {children}
    </p>
  );
}

/** Estilo do botão principal (vermelho de catálogo), compartilhado por links e botões. */
export const primaryButton =
  "pressable rounded-[3px] bg-accent font-semibold text-accent-ink hover:bg-accent-hover disabled:cursor-progress disabled:opacity-70";

export function SubmitButton({ sending, label, sendingLabel }: { sending: boolean; label: string; sendingLabel: string }) {
  return (
    <button
      type="submit"
      disabled={sending}
      className={`${primaryButton} mt-2 px-5 py-3 text-sm`}
    >
      {sending ? sendingLabel : label}
    </button>
  );
}
