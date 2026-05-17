import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { BarChart3, Bot, Database, LineChart, ShieldCheck, Target } from "lucide-react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "Оценка проектов на маркетплейсах",
  description: "Универсальный инструмент комплексной оценки и прогнозирования проектов на маркетплейсах.",
};

const navItems = [
  { href: "/source-data", label: "Данные", icon: Database },
  { href: "/dashboard", label: "Показатели", icon: BarChart3 },
  { href: "/project-evaluation", label: "Оценка", icon: Target },
  { href: "/forecasting", label: "Прогноз", icon: LineChart },
  { href: "/llm-analyst", label: "ИИ-анализ", icon: Bot },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <div className="min-h-screen">
          <header className="border-b border-slate-200 bg-white/85 backdrop-blur">
            <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
              <Link href="/dashboard" className="flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2">
                <span className="grid size-10 place-items-center rounded-md bg-slate-950 text-white">
                  <ShieldCheck className="size-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-sm font-semibold uppercase tracking-[0.16em] text-cyan-700">Маркетплейсы</span>
                  <span className="block text-base font-semibold text-slate-950">Оценка и прогноз проектов</span>
                </span>
              </Link>
              <nav className="flex flex-wrap gap-2" aria-label="Основная навигация">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                    >
                      <Icon className="size-4" aria-hidden="true" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
