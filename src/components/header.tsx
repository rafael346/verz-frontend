"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "./auth-provider";
import { ThemeToggle } from "./theme-toggle";

const ROLE_LABEL = { seller: "Leiloeiro", bidder: "Licitante" } as const;

export function Header() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  async function signOut() {
    await logout().catch(() => {}); // sair sempre funciona do ponto de vista de quem clicou
    router.push("/");
  }

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <nav aria-label="Principal" className="flex items-center gap-4">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            verz
          </Link>
          <Link href="/" className="text-sm hover:underline">
            Vitrine
          </Link>
        </nav>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <ThemeToggle />
          {loading ? null : user ? (
            <>
              <span className="text-muted">
                {user.email} · {ROLE_LABEL[user.role]}
              </span>
              <button type="button" onClick={signOut} className="rounded-md border border-border px-3 py-1">
                Sair
              </button>
            </>
          ) : (
            <>
              <Link href="/entrar" className="hover:underline">
                Entrar
              </Link>
              <Link href="/cadastro" className="rounded-md bg-accent px-3 py-1 font-medium text-white dark:text-background">
                Criar conta
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
