import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { Onest, Unbounded } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers";
import { Sidebar } from "@/components/sidebar";
import { TopBar } from "@/components/topbar";
import { PlayerBar } from "@/components/player-bar";

const grotesk = Onest({
  subsets: ["latin", "cyrillic"],
  variable: "--font-grotesk",
  weight: ["400", "500", "600", "700"],
});

const unbounded = Unbounded({
  subsets: ["latin", "cyrillic"],
  variable: "--font-unbounded",
  weight: ["400", "600", "700", "900"],
});

export const metadata: Metadata = {
  title: "VERSUSCLOUD — музыка без границ",
  description:
    "Саундклауд-клиент в зелёных тонах: поиск, лайки, плейлисты, библиотека. Работает без VPN на сети Audius.",
};

export const viewport: Viewport = {
  themeColor: "#050a07",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" className={`${grotesk.variable} ${unbounded.variable}`}>
      <body className="font-sans antialiased">
        <AppProviders>
          <div className="aurora flex h-screen w-screen overflow-hidden">
            <Sidebar />
            <div className="flex min-w-0 flex-1 flex-col">
              <Suspense fallback={<div className="h-[68px] border-b border-line" />}>
                <TopBar />
              </Suspense>
              <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
              <PlayerBar />
            </div>
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
