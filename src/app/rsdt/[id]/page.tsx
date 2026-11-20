import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { getRsdt } from "@/composition-root";
import { rsdtKeyFromId, type RsdtKey } from "@/domain/rsdt/rsdt-key";
import { formatAddress } from "@/presentation/format";
import { toFormValues } from "@/presentation/form";
import { safeBack } from "@/presentation/navigation";
import { EditForm } from "./edit-form";

/** 画面の上に表示する主キー（変更できない） */
const KEY_COLUMNS: { name: keyof RsdtKey; column: string }[] = [
  { name: "lgCode", column: "lg_code" },
  { name: "machiazaId", column: "machiaza_id" },
  { name: "blkId", column: "blk_id" },
  { name: "rsdtId", column: "rsdt_id" },
  { name: "rsdt2Id", column: "rsdt2_id" },
];

export default function Page(props: PageProps<"/rsdt/[id]">) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl border border-white/10 bg-slate-900/50" />}>
      <EditContent {...props} />
    </Suspense>
  );
}

async function EditContent({ params, searchParams }: PageProps<"/rsdt/[id]">) {
  // DB の中身は毎回変わりうるので、先読み（prerender）では実行せず、リクエストのときに読む
  await connection();
  const { id } = await params;
  const back = safeBack((await searchParams).back);

  const key = rsdtKeyFromId(id);
  if (!key) notFound();
  const row = await getRsdt.execute(key);
  if (!row) notFound();
  const address = formatAddress(row);

  return (
    <div className="space-y-6">
      <div>
        <Link href={back} className="text-sm text-slate-400 hover:text-cyan-300">
          ‹ 一覧に戻る
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">{address}</h1>
        <dl className="mt-3 flex flex-wrap gap-2">
          {KEY_COLUMNS.map((f) => (
            <div key={f.name} className="rounded-lg border border-white/10 bg-slate-900/50 px-3 py-1.5">
              <dt className="font-mono text-[10px] text-slate-500">{f.column}</dt>
              <dd className="font-mono text-sm text-slate-200">{row[f.name] || <span className="text-slate-600">（空）</span>}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-2 text-xs text-slate-500">主キーの 5 列は変更できません。</p>
      </div>
      <EditForm id={id} back={back} address={address} initial={toFormValues(row)} />
    </div>
  );
}
