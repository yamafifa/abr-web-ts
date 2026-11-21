import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Flash } from "@/components/flash";
import { searchRsdtEs } from "@/composition-root";
import { esListHref, indexBuiltAt, parseEsListQuery } from "@/presentation/es-search-params";
import { listHref } from "@/presentation/search-params";
import { RsdtTable } from "../rsdt-table";
import { SearchForm } from "../search-form";
import { EsPager } from "./es-pager";

/** Elasticsearch で検索する一覧（DB の一覧とは別の画面）。編集・削除は DB 検索と同じ画面を使い、戻り先をこの画面にする */
export default function Page({ searchParams }: PageProps<"/es">) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-white">
        住居の検索{" "}
        <span className="ml-1 rounded-full bg-amber-400/15 px-2.5 py-0.5 align-middle text-xs font-semibold text-amber-300 ring-1 ring-amber-400/40">
          Elasticsearch
        </span>
      </h1>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl border border-white/10 bg-slate-900/50" />}>
        <SearchResults searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function SearchResults({ searchParams }: Pick<PageProps<"/es">, "searchParams">) {
  // インデックスの中身は es:index のたびに変わるので、先読み（prerender）では実行せず、リクエストのときに読む
  await connection();
  const sp = await searchParams;
  const query = parseEsListQuery(sp);
  const r = await searchRsdtEs.execute(query);
  // 編集・削除のあとに戻ってくる URL（今の URL。同じ after・before なら同じページが出る）
  const back = esListHref(query);
  const firstPage = { criteria: query.criteria, perPage: query.perPage };
  const to = r.from === 0 ? 0 : r.from + r.rows.length - 1;
  const builtAt = indexBuiltAt(r.index);

  return (
    <>
      <Flash key={String(sp.n)} done={typeof sp.done === "string" ? sp.done : undefined} />
      <div className="-mt-3 flex flex-wrap items-end justify-between gap-3">
        <p className="text-sm text-slate-400">
          Elasticsearch のインデックスから検索します。中身は abr-batch の{" "}
          <code className="font-mono text-slate-300">npm run es:index</code> を実行した時点の DB のコピーです。
          {builtAt && (
            <>
              （作成：<span className="font-mono text-slate-300">{builtAt}</span>）
            </>
          )}
        </p>
        <Link href={listHref({ ...firstPage, page: 1 })} prefetch={false} className="text-sm text-cyan-300 hover:underline">
          同じ条件で DB 検索 →
        </Link>
      </div>

      <section className="rounded-2xl border border-white/10 bg-slate-900/50 p-5 shadow-xl shadow-black/20 backdrop-blur">
        <SearchForm key={back} criteria={query.criteria} perPage={query.perPage} action="/es" />
      </section>

      {r.error && <p className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-5 py-4 text-sm text-rose-200">{r.error}</p>}

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50 shadow-xl shadow-black/20 backdrop-blur">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/10 px-5 py-3 text-sm">
          <p className="text-slate-400">
            <span className="font-mono text-lg font-semibold text-white">{r.total.toLocaleString()}</span> 件
          </p>
          <p className="font-mono text-xs text-slate-500">
            {r.from.toLocaleString()}–{to.toLocaleString()} 件目
          </p>
        </div>

        {r.rows.length === 0 ? (
          <p className="px-5 py-16 text-center text-slate-500">該当する住居がありません</p>
        ) : (
          <RsdtTable rows={r.rows} back={back} />
        )}

        {(r.prevKey || r.nextKey) && (
          <div className="border-t border-white/10 px-5 py-4">
            <EsPager query={firstPage} prevKey={r.prevKey} nextKey={r.nextKey} />
          </div>
        )}
      </section>

      <p className="text-xs text-slate-500">
        編集・削除は DB に対して行います。Elasticsearch には次に <code className="font-mono">npm run es:index</code>{" "}
        を実行するまで反映されないので、この一覧には古い内容が残ります。
      </p>
    </>
  );
}
