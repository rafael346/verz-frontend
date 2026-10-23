import type { Metadata } from "next";
import Link from "next/link";

import { AuthLayout } from "@/components/auth-layout";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <AuthLayout
      kicker="Acesso à sala"
      title={
        <>
          Bem-vindo de volta <em className="font-normal">ao pregão.</em>
        </>
      }
      intro="Entre para acompanhar seus lotes, dar lances e ver os comprovantes dos seus arremates."
      notes={["Sua sessão fica só neste navegador.", "Ainda não há recuperação de senha nesta versão."]}
      footer={
        <>
          Ainda não tem conta?{" "}
          <Link href="/cadastro" className="text-link text-foreground">
            Criar conta
          </Link>
        </>
      }
    >
      <h2 className="display text-2xl">Entrar</h2>
      <LoginForm />
    </AuthLayout>
  );
}
