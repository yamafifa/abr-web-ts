import Link from "next/link";
import { DeleteButton } from "@/components/delete-button";
import type { Rsdt } from "@/domain/rsdt/rsdt";
import { rsdtKeyToId } from "@/domain/rsdt/rsdt-key";
import { formatAddress } from "@/presentation/format";

type Props = { rows: Rsdt[]; back: string };

/** 住居の一覧の表（DB 検索と Elasticsearch 検索で共通）。back は編集・削除のあとに戻る URL */
export function RsdtTable({ rows, back }: Props) {
  return (
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
  );
}
