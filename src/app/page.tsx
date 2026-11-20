import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { DeleteButton } from "@/components/delete-button";
import { Flash } from "@/components/flash";
import { searchRsdt } from "@/composition-root";
import { rsdtKeyToId } from "@/domain/rsdt/rsdt-key";
import { formatAddress } from "@/presentation/format";
import { listHref, parseListQuery } from "@/presentation/search-params";
import { Pager } from "./pager";
import { SearchForm } from "./search-form";

export default function Page({ searchParams }: PageProps<"/">) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">住居の検索</h1>
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
      <section className="rounded-2xl border border-white/10 bg-slate-900/50 p-5 shadow-xl shadow-black/20 backdrop-blur">
        <SearchForm key={back} criteria={query.criteria} perPage={query.perPage} />
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
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-slate-500">
                <tr className="border-b border-white/5">
                  <th className="px-5 py-3 font-medium">住所</th>
                  <th className="px-3 py-3 font-medium">キー</th>
                  <th className="px-3 py-3 font-medium">efct_date</th>
                  <th className="px-3 py-3 font-medium">ablt_date</th>
                  <th className="px-5 py-3 text-right font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.map((r) => {
                  const id = rsdtKeyToId(r);
                  const address = formatAddress(r);
                  return (
                    <tr key={id} className="transition hover:bg-cyan-400/[0.04]">
                      <td className="px-5 py-2.5 font-medium text-slate-100">
                        {address}
                        {r.abltDate && (
                          <span className="ml-2 rounded bg-slate-700/60 px-1.5 py-0.5 text-[10px] text-slate-400">廃止</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-slate-500">{id}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-slate-400">{r.efctDate}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-slate-400">{r.abltDate}</td>
                      <td className="whitespace-nowrap px-5 py-2.5">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/rsdt/${id}?back=${encodeURIComponent(back)}`}
                            prefetch={false}
                            className="rounded-md px-2.5 py-1 text-xs text-cyan-300 ring-1 ring-cyan-400/30 hover:bg-cyan-400/10"
                          >
                            編集
                          </Link>
                          <DeleteButton id={id} address={address} back={back} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
