import type { Metadata } from "next";
import Link from "next/link";

import { AuthLayout } from "@/components/auth-layout";
import { RegisterForm } from "@/components/register-form";

export const metadata: Metadata = { title: "Criar conta" };

export default function RegisterPage() {
  return (
    <AuthLayout
      kicker="Registro na casa"
      title={
        <>
          Uma conta para <em className="font-normal">comprar ou vender.</em>
        </>
      }
      intro="Licitantes depositam saldo simulado e disputam os lotes. Leiloeiros escolhem obras do acervo do Met e montam os próprios lotes."
      notes={[
        "Nos lances e comprovantes você aparece só por um pseudônimo.",
        "Os valores são simulados: nenhum dinheiro real muda de mãos.",
        "Todo lote tem histórico público e auditável.",
      ]}
      footer={
        <>
          Já tem conta?{" "}
          <Link href="/entrar" className="text-link text-foreground">
            Entrar
          </Link>
        </>
      }
    >
      <h2 className="display text-2xl">Criar conta</h2>
      <RegisterForm />
    </AuthLayout>
  );
}
