"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { label: "DB 検索", href: "/" },
  { label: "Elasticsearch 検索", href: "/es" },
] as const;

/** DB 検索と Elasticsearch 検索の切り替え（今の画面を目立たせる） */
export function Nav() {
  const pathname = usePathname();
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
