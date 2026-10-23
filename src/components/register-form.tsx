"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { ApiError } from "@/lib/api";

import { useAuth, type Role } from "./auth-provider";
import { Field } from "./field";

const ROLES: Array<{ value: Role; label: string; help: string }> = [
  { value: "bidder", label: "Licitante", help: "Quero depositar saldo e dar lances." },
  { value: "seller", label: "Leiloeiro", help: "Quero colocar obras em leilão." },
];

export function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSending(true);
    setError(null);
    setFields({});
    try {
      await register(String(form.get("email")), String(form.get("password")), form.get("role") as Role);
      router.push("/");
    } catch (failure) {
      const apiError = failure instanceof ApiError ? failure : new ApiError(0, null);
      const byField = apiError.fieldErrors();
      setFields(byField);
      // Só mostra o aviso geral se o erro não estiver preso a um campo.
      setError(Object.keys(byField).length && !apiError.body?.non_field_errors ? null : apiError.message);
      setSending(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      {error ? (
        <p role="alert" className="rounded-md border border-red-600 px-3 py-2 text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      ) : null}
      <Field label="E-mail" name="email" type="email" autoComplete="email" required error={fields.email} />
      <Field
        label="Senha"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={10}
        hint="Pelo menos 10 caracteres, sem ser só números."
        error={fields.password}
      />
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">Como você vai usar o verz?</legend>
        {ROLES.map((role, index) => (
          <label key={role.value} className="flex items-start gap-2 rounded-md border border-border px-3 py-2">
            <input type="radio" name="role" value={role.value} defaultChecked={index === 0} className="mt-1" />
            <span>
              <span className="font-medium">{role.label}</span>
              <span className="block text-sm text-muted">{role.help}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <button
        type="submit"
        disabled={sending}
        className="rounded-md bg-accent px-4 py-2 font-medium text-white disabled:opacity-60 dark:text-background"
      >
        {sending ? "Criando conta…" : "Criar conta"}
      </button>
    </form>
  );
}
