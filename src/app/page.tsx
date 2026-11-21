import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Flash } from "@/components/flash";
import { searchRsdt } from "@/composition-root";
import { esListHref } from "@/presentation/es-search-params";
import { listHref, parseListQuery } from "@/presentation/search-params";
import { Pager } from "./pager";
import { RsdtTable } from "./rsdt-table";
import { SearchForm } from "./search-form";

export default function Page({ searchParams }: PageProps<"/">) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          住居の検索{" "}
          <span className="ml-1 rounded-full bg-cyan-400/15 px-2.5 py-0.5 align-middle text-xs font-semibold text-cyan-300 ring-1 ring-cyan-400/40">
            DB
          </span>
        </h1>
        <p className="mt-1 text-sm text-slate-400">住居表示-住居マスター（東京都）を検索して、編集・削除します。</p>
      </div>
      {/* URL のクエリ（searchParams）は、リクエストのときにしか分からないので Suspense で囲む */}
      <Suspense fallback={<ListSkeleton />}>
        <SearchResults searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function SearchResults({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
  // DB の中身は毎回変わりうるので、先読み（prerender）では実行せず、リクエストのときに読む
  await connection();
  const sp = await searchParams;
  const query = parseListQuery(sp);
  const { rows, total, page, totalPages } = await searchRsdt.execute(query);
  // 編集・削除のあとに戻ってくる URL（今の検索条件とページ）
  const back = listHref({ ...query, page });
  const from = total === 0 ? 0 : (page - 1) * query.perPage + 1;
  const to = (page - 1) * query.perPage + rows.length;

  return (
    <>
      <Flash key={String(sp.n)} done={typeof sp.done === "string" ? sp.done : undefined} />
      <div className="-mt-3 flex justify-end">
        <Link href={esListHref({ criteria: query.criteria, perPage: query.perPage })} prefetch={false} className="text-sm text-amber-300 hover:underline">
          同じ条件で Elasticsearch 検索 →
        </Link>
      </div>
      <section className="rounded-2xl border border-white/10 bg-slate-900/50 p-5 shadow-xl shadow-black/20 backdrop-blur">
        <SearchForm key={back} criteria={query.criteria} perPage={query.perPage} action="/" />
      </section>

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50 shadow-xl shadow-black/20 backdrop-blur">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/10 px-5 py-3 text-sm">
          <p className="text-slate-400">
            <span className="font-mono text-lg font-semibold text-white">{total.toLocaleString()}</span> 件
          </p>
          <p className="font-mono text-xs text-slate-500">
            {from.toLocaleString()}–{to.toLocaleString()} 件目 ／ {page.toLocaleString()} / {totalPages.toLocaleString()} ページ
          </p>
        </div>

        {rows.length === 0 ? (
          <p className="px-5 py-16 text-center text-slate-500">該当する住居がありません</p>
        ) : (
          <RsdtTable rows={rows} back={back} />
        )}

        {totalPages > 1 && (
          <div className="border-t border-white/10 px-5 py-4">
            <Pager query={query} page={page} totalPages={totalPages} />
          </div>
        )}
      </section>
    </>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-24 animate-pulse rounded-2xl border border-white/10 bg-slate-900/50" />
      <div className="space-y-px overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50 p-5">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="h-8 animate-pulse rounded bg-white/[0.03]" />
        ))}
      </div>
    </div>
  );
}
