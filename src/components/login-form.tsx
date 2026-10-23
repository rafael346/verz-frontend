"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { useAuth } from "./auth-provider";
import { Field, FormAlert, SubmitButton } from "./field";
import { useFormErrors } from "./use-form-errors";

export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const { formRef, general, fields, clear, showFields, fail } = useFormErrors();
  const [sending, setSending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const missing = {
      ...(email ? {} : { email: "Informe seu e-mail." }),
      ...(password ? {} : { password: "Informe sua senha." }),
    };
    if (Object.keys(missing).length) return showFields(missing);

    setSending(true);
    clear();
    try {
      await login(email, password);
      router.push("/");
    } catch (failure) {
      fail(failure);
      setSending(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={submit} className="flex flex-col gap-4" noValidate>
      {general ? <FormAlert>{general}</FormAlert> : null}
      <Field
        label="E-mail"
        name="email"
        type="email"
        autoComplete="email"
        spellCheck={false}
        placeholder="nome@exemplo.com"
        required
        error={fields.email}
      />
      <Field
        label="Senha"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        error={fields.password}
      />
      <SubmitButton sending={sending} label="Entrar" sendingLabel="Entrando…" />
    </form>
  );
}
