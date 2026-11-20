import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono, Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const notoJp = Noto_Sans_JP({ variable: "--font-noto-jp", subsets: ["latin"], weight: ["400", "500", "700"] });

export const metadata: Metadata = {
  title: "ABR 住居マスター",
  description: "住居表示-住居マスター（mt_rsdtdsp_rsdt）の検索・編集・削除",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} ${notoJp.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <header className="border-b border-white/10 bg-slate-950/40 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-4 sm:px-6">
            <Link href="/" className="group flex items-center gap-3">
              <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-cyan-400 to-violet-500 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/20">
                A
              </span>
              <span className="font-semibold tracking-wide text-slate-100 group-hover:text-white">
                ABR 住居マスター
              </span>
            </Link>
            <span className="ml-auto rounded-full border border-white/10 px-2.5 py-0.5 font-mono text-xs text-slate-400">
              mt_rsdtdsp_rsdt
            </span>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">{children}</main>
        <footer className="py-6 text-center text-xs text-slate-500">
          Next.js + Prisma + Tailwind CSS
        </footer>
      </body>
    </html>
  );
}
