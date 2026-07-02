"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BookOpen, CalendarDays, Grid2X2, Lightbulb, Settings, Target, Users } from "lucide-react";
import clsx from "clsx";
import { StoreProvider } from "@/lib/store";
import { AiAssistProvider } from "@/components/AiAssistProvider";
import { ProjectSwitcher } from "@/components/ProjectSwitcher";

const nav = [
  { href: "/theory", label: "Теория", icon: BookOpen },
  { href: "/product", label: "Продукт", icon: Target },
  { href: "/audience", label: "ЦА", icon: Users },
  { href: "/rubrics", label: "Рубрики", icon: Grid2X2 },
  { href: "/ideas", label: "Банк идей", icon: Lightbulb },
  { href: "/plan", label: "Контент план", icon: CalendarDays },
  { href: "/balance", label: "Баланс", icon: BarChart3 }
];

const authorMark = "by Pavel Pivkin";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <StoreProvider>
      <AiAssistProvider>
        <div className="min-h-screen text-neutral">
          <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 p-4 lg:block">
            <div className="glass-panel premium-border flex h-full flex-col rounded-xl p-4">
              <div className="mb-6 flex items-start justify-between gap-3 rounded-lg bg-neutral p-4 text-neutral-content">
                <div>
                  <div className="text-xl font-bold">Content Lab</div>
                  <div className="text-sm text-neutral-content/65">Планирование смыслов</div>
                </div>
                <Link
                  href="/settings"
                  className={clsx(
                    "btn btn-ghost btn-sm h-9 w-9 rounded-lg p-0 text-neutral-content hover:bg-neutral-content/10",
                    pathname === "/settings" && "bg-neutral-content/15"
                  )}
                  title="Интеграции"
                >
                  <Settings size={18} />
                </Link>
              </div>
              <ProjectSwitcher />
              <nav className="space-y-1">
                {nav.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={clsx(
                        "btn btn-ghost w-full justify-start gap-3 rounded-lg border border-transparent",
                        active && "border-primary/15 bg-primary text-primary-content shadow-md shadow-primary/10 hover:bg-primary"
                      )}
                    >
                      <Icon size={18} />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <div className="mt-auto rounded-lg border border-neutral-content/10 bg-neutral/5 px-3 py-2 text-xs font-semibold text-neutral/55">
                {authorMark}
              </div>
            </div>
          </aside>
          <div className="lg:pl-72">
            <header className="sticky top-0 z-10 border-b border-base-300/60 bg-base-100/85 px-4 py-3 backdrop-blur lg:hidden">
              <div className="flex items-center gap-2">
                <div className="shrink-0">
                  <b>Content Lab</b>
                  <div className="text-[11px] font-semibold leading-4 text-neutral/45">by Pavel Pivkin</div>
                </div>
                <ProjectSwitcher compact />
                <Link
                  href="/settings"
                  className={clsx("btn btn-ghost btn-sm h-9 w-9 rounded-lg p-0", pathname === "/settings" && "bg-primary text-primary-content")}
                  title="Интеграции"
                >
                  <Settings size={18} />
                </Link>
              </div>
            </header>
            <main className="mx-auto max-w-7xl px-4 pb-28 pt-5 sm:px-5 lg:px-8 lg:py-8">{children}</main>
          </div>
          <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-base-300 bg-base-100/95 px-1 py-2 shadow-2xl backdrop-blur lg:hidden">
            <div className="grid grid-cols-7 gap-1">
              {nav.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link key={item.href} href={item.href} className={clsx("flex min-w-0 flex-col items-center gap-1 rounded-lg px-1 py-2 text-[10px] font-medium text-neutral/60", active && "bg-primary text-primary-content")}>
                    <Icon size={17} />
                    <span className="max-w-full truncate">{item.label.replace("Контент план", "План").replace("Банк идей", "Идеи")}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      </AiAssistProvider>
    </StoreProvider>
  );
}
