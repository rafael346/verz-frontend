import type { Metadata } from "next";
import { headers } from "next/headers";
import { ThemeProvider } from "next-themes";

import { AuthProvider } from "@/components/auth-provider";
import { Header } from "@/components/header";

import "./globals.css";

export const metadata: Metadata = {
  title: { default: "verz — leilões de arte", template: "%s · verz" },
  description: "Casa de leilões online de obras de arte em domínio público, com lances ao vivo e histórico auditável.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Nonce da CSP gerado em src/proxy.ts; o script do next-themes também precisa dele.
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html lang="pt-BR" suppressHydrationWarning className="h-full antialiased">
      <body className="flex min-h-full flex-col font-sans">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange nonce={nonce}>
          <AuthProvider>
            <Header />
            <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
