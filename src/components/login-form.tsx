"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { ApiError } from "@/lib/api";

import { useAuth } from "./auth-provider";
import { Field } from "./field";

export function LoginForm() {
  const { login } = useAuth();
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
      await login(String(form.get("email")), String(form.get("password")));
      router.push("/");
    } catch (failure) {
      const apiError = failure instanceof ApiError ? failure : new ApiError(0, null);
      setError(apiError.message);
      setFields(apiError.fieldErrors());
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
        autoComplete="current-password"
        required
        error={fields.password}
      />
      <button
        type="submit"
        disabled={sending}
        className="rounded-md bg-accent px-4 py-2 font-medium text-white disabled:opacity-60 dark:text-background"
      >
        {sending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
