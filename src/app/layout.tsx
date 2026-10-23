import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { ThemeProvider } from "next-themes";

import { AuthProvider } from "@/components/auth-provider";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";

// Fraunces com eixo de tamanho óptico, hospedada pelo próprio site (CSP font-src 'self', sem Google no build).
import "@fontsource-variable/fraunces/opsz.css";
import "@fontsource-variable/fraunces/opsz-italic.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "verz — leilões de arte", template: "%s · verz" },
  description: "Casa de leilões online de obras de arte em domínio público, com lances ao vivo e histórico auditável.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5efe4" },
    { media: "(prefers-color-scheme: dark)", color: "#13100d" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Nonce da CSP gerado em src/proxy.ts; o script do next-themes também precisa dele.
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html lang="pt-BR" suppressHydrationWarning className="h-full antialiased">
      <head>
        {/* Hora do servidor nesta resposta: as contagens regressivas corrigem o relógio do visitante (lib/clock.ts). */}
        {/* eslint-disable-next-line react-hooks/purity -- Server Component renderizado a cada requisição: o carimbo é a hora desta resposta */}
        <meta name="server-time" content={String(Date.now())} />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange nonce={nonce}>
          <AuthProvider>
            <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-10 focus:bg-card focus:px-3 focus:py-2">
              Pular para o conteúdo
            </a>
            <Header />
            <main id="conteudo" className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
              {children}
            </main>
            <Footer />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
