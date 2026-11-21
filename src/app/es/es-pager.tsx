import Link from "next/link";
import { esListHref, type EsListQuery } from "@/presentation/es-search-params";

/** query はページの位置を外した検索条件。prevKey・nextKey が null なら、そちらには進めない */
type Props = { query: EsListQuery; prevKey: string | null; nextKey: string | null };

const base = "grid h-9 min-w-9 place-items-center rounded-lg px-3 text-sm transition";

/** ページ送り（search_after）。ページ番号は無く、最初・前・次・最後へ進む */
export function EsPager({ query, prevKey, nextKey }: Props) {
  const nav = (label: string, href: string | null) =>
    href === null ? (
      <span className={`${base} text-slate-600`}>{label}</span>
    ) : (
      <Link href={href} prefetch={false} className={`${base} text-slate-300 hover:bg-white/5`}>
        {label}
      </Link>
    );
  return (
    <nav aria-label="ページ送り" className="flex flex-wrap items-center justify-center gap-1">
      {nav("« 最初へ", prevKey ? esListHref(query) : null)}
      {nav("‹ 前へ", prevKey ? esListHref({ ...query, before: prevKey }) : null)}
      {nav("次へ ›", nextKey ? esListHref({ ...query, after: nextKey }) : null)}
      {nav("最後へ »", nextKey ? esListHref({ ...query, last: true }) : null)}
    </nav>
  );
}
