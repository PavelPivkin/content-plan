import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Content Lab",
  description: "Пошаговый интерфейс для контент-маркетинга и контент-плана"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" data-theme="contentlab">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
