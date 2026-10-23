"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "./auth-provider";
import { primaryButton } from "./field";
import { ThemeToggle } from "./theme-toggle";

const ROLE_LABEL = { seller: "Leiloeiro", bidder: "Licitante" } as const;

export function Header() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  async function signOut() {
    await logout().catch(() => {}); // sair sempre funciona do ponto de vista de quem clicou
    router.push("/");
  }

  return (
    <header>
      <div className="border-b border-border">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-1.5 sm:px-6">
          <p className="kicker hidden sm:block">Leilões ao vivo · Obras em domínio público</p>
          <ThemeToggle />
        </div>
      </div>
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-end justify-between gap-x-8 gap-y-4 px-4 pt-6 pb-4 sm:px-6">
        <Link href="/" className="group flex flex-col leading-none" aria-label="verz — página inicial">
          <span translate="no" className="display text-4xl font-medium italic">
            verz
          </span>
          <span className="kicker mt-1.5">Casa de Leilões</span>
        </Link>
        <nav aria-label="Principal" className="order-last flex w-full items-center gap-6 border-t border-border pt-3 text-sm sm:order-none sm:w-auto sm:border-0 sm:pt-0">
          <Link href="/lotes" aria-current={pathname.startsWith("/lotes") ? "page" : undefined} className="ink-link pb-0.5">
            Vitrine
          </Link>
          <Link href="/#como-funciona" className="ink-link pb-0.5">
            Como funciona
          </Link>
          {user?.role === "seller" ? (
            <Link href="/painel" aria-current={pathname.startsWith("/painel") ? "page" : undefined} className="ink-link pb-0.5">
              Painel
            </Link>
          ) : null}
        </nav>
        <div className="flex min-h-9 items-center gap-4 text-sm">
          {loading ? null : user ? (
            <>
              <span className="flex flex-col text-right leading-tight">
                <span className="kicker">{ROLE_LABEL[user.role]}</span>
                <span className="max-w-[16rem] truncate">{user.email}</span>
              </span>
              <button type="button" onClick={signOut} className="pressable ink-link pb-0.5 text-muted">
                Sair
              </button>
            </>
          ) : (
            <>
              <Link href="/entrar" aria-current={pathname === "/entrar" ? "page" : undefined} className="ink-link pb-0.5">
                Entrar
              </Link>
              <Link
                href="/cadastro"
                className={`${primaryButton} px-4 py-2`}
              >
                Criar conta
              </Link>
            </>
          )}
        </div>
      </div>
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="double-rule" />
      </div>
    </header>
  );
}
