"use client";

import Link from "next/link";

import { useAuth } from "./auth-provider";
import { primaryButton } from "./field";

const PRIMARY = `${primaryButton} px-5 py-3 text-sm`;

/** Chamada principal da home: convida a criar conta só quem ainda não tem uma. */
export function HeroActions() {
  const { user, loading } = useAuth();
  return (
    <div className="flex flex-wrap items-center gap-5">
      {loading ? (
        <span aria-hidden className={`${PRIMARY} invisible`}>
          Criar conta para dar lances
        </span>
      ) : user ? (
        <Link href="#vitrine" className={PRIMARY}>
          Ver a vitrine
        </Link>
      ) : (
        <Link href="/cadastro" className={PRIMARY}>
          Criar conta para dar lances
        </Link>
      )}
      <Link href="#como-funciona" className="ink-link pb-0.5 text-sm">
        Como funciona
      </Link>
    </div>
  );
}
