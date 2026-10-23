import type { Metadata } from "next";
import Link from "next/link";

import { RegisterForm } from "@/components/register-form";

export const metadata: Metadata = { title: "Criar conta" };

export default function RegisterPage() {
  return (
    <section className="mx-auto flex w-full max-w-sm flex-col gap-6">
      <h1 className="text-2xl font-semibold">Criar conta</h1>
      <RegisterForm />
      <p className="text-sm text-muted">
        Já tem conta?{" "}
        <Link href="/entrar" className="text-foreground underline">
          Entrar
        </Link>
      </p>
    </section>
  );
}
