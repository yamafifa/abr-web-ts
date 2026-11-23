"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { label: "DB 検索", href: "/" },
  { label: "Elasticsearch 検索", href: "/es" },
] as const;

/**
 * DB 検索と Elasticsearch 検索の切り替え（今の画面を目立たせる）
 * usePathname は先読み（prerender）のときに値が決まらないので、layout では Suspense で囲み、
 * 待つ間は NavLinks（どれも目立たせない）を出す。囲まないと next build が失敗する
 */
export function Nav() {
  return <NavLinks pathname={usePathname()} />;
}

export function NavLinks({ pathname }: { pathname: string | null }) {
  return (
    <nav className="ml-6 flex gap-1 text-sm">
      {ITEMS.map(({ label, href }) => (
        <Link
          key={href}
          href={href}
          prefetch={false}
          className={`rounded-lg px-3 py-1.5 ${pathname === href ? "bg-white/10 font-medium text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
