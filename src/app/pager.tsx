import Link from "next/link";
import { listHref, type ListQuery } from "@/presentation/search-params";

type Props = { query: ListQuery; page: number; totalPages: number };

/** 表示するページ番号（今のページの前後 2 つと、最初と最後。間は … にする） */
function pageItems(page: number, totalPages: number): (number | "…")[] {
  const set = new Set([1, totalPages]);
  for (let p = page - 2; p <= page + 2; p++) if (p >= 1 && p <= totalPages) set.add(p);
  const pages = [...set].sort((a, b) => a - b);
  const items: (number | "…")[] = [];
  pages.forEach((p, i) => {
    if (i > 0 && p - pages[i - 1] > 1) items.push("…");
    items.push(p);
  });
  return items;
}

const base = "grid h-9 min-w-9 place-items-center rounded-lg px-3 text-sm transition";

export function Pager({ query, page, totalPages }: Props) {
  const href = (p: number) => listHref({ ...query, page: p });
  const nav = (label: string, p: number, disabled: boolean) =>
    disabled ? (
      <span className={`${base} text-slate-600`}>{label}</span>
    ) : (
      // prefetch しない（先読みのたびに件数を数え直すと DB が重くなるため）
      <Link href={href(p)} prefetch={false} className={`${base} text-slate-300 hover:bg-white/5`}>
        {label}
      </Link>
    );

  return (
    <nav aria-label="ページ送り" className="flex flex-wrap items-center justify-center gap-1">
      {nav("‹ 前へ", page - 1, page <= 1)}
      {pageItems(page, totalPages).map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="px-1 text-slate-600">
            …
          </span>
        ) : p === page ? (
          <span
            key={p}
            aria-current="page"
            className={`${base} bg-cyan-400/15 font-semibold text-cyan-300 ring-1 ring-cyan-400/40`}
          >
            {p.toLocaleString()}
          </span>
        ) : (
          <Link key={p} href={href(p)} prefetch={false} className={`${base} text-slate-400 hover:bg-white/5 hover:text-white`}>
            {p.toLocaleString()}
          </Link>
        ),
      )}
      {nav("次へ ›", page + 1, page >= totalPages)}
    </nav>
  );
}
