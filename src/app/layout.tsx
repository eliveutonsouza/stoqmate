import type { Metadata } from "next";
import "./globals.css";
import "./design-system.css";
import { ThemeInit } from "@/components/theme-init";

export const metadata: Metadata = {
  title: "Stoqmate — Controle de estoque multi-loja com IA",
  description: "Stoqmate: controle de estoque multi-loja com IA",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR">
      <body>
        <ThemeInit />
        {children}
      </body>
    </html>
  );
}
