"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { useAuth, type Role } from "./auth-provider";
import { Field, FormAlert, SubmitButton } from "./field";
import { useFormErrors } from "./use-form-errors";

const ROLES: Array<{ value: Role; label: string; help: string }> = [
  { value: "bidder", label: "Licitante", help: "Quero depositar saldo e dar lances." },
  { value: "seller", label: "Leiloeiro", help: "Quero colocar obras em leilão." },
];

export function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();
  const { formRef, general, fields, clear, showFields, fail } = useFormErrors();
  const [sending, setSending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const problems = {
      ...(email ? {} : { email: "Informe seu e-mail." }),
      ...(password.length >= 10 ? {} : { password: "A senha precisa ter pelo menos 10 caracteres." }),
    };
    if (Object.keys(problems).length) return showFields(problems);

    setSending(true);
    clear();
    try {
      await register(email, password, form.get("role") as Role);
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
        autoComplete="new-password"
        required
        minLength={10}
        hint="Pelo menos 10 caracteres, sem ser só números."
        error={fields.password}
      />
      <fieldset className="flex flex-col gap-2">
        <legend className="kicker mb-1.5 text-foreground">Como você vai usar o verz?</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {ROLES.map((role, index) => (
            <label
              key={role.value}
              className="flex cursor-pointer items-start gap-2.5 rounded-[3px] border border-border bg-background px-3 py-3 transition-colors duration-150 has-checked:border-foreground has-focus-visible:outline-2 has-focus-visible:outline-accent"
            >
              <input
                type="radio"
                name="role"
                value={role.value}
                defaultChecked={index === 0}
                className="mt-1 accent-[var(--accent)] focus-visible:outline-none"
              />
              <span>
                <span className="font-semibold">{role.label}</span>
                <span className="block text-sm leading-snug text-muted">{role.help}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <SubmitButton sending={sending} label="Criar conta" sendingLabel="Criando conta…" />
    </form>
  );
}
