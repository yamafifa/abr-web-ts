"use client";

import Form from "next/form";
import type { RsdtSearchCriteria } from "@/domain/rsdt/rsdt-repository";
import { PER_PAGE_OPTIONS } from "@/presentation/search-params";

type Props = { criteria: RsdtSearchCriteria; perPage: number };

const inputClass =
  "w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20";

/** 検索条件のフォーム。GET で送るので、条件は URL に残る（ページ番号は 1 に戻る） */
export function SearchForm({ criteria, perPage }: Props) {
  const { city, town, chome, blkNum, rsdtNum } = criteria;
  return (
    <Form action="/" className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-[1fr_1fr_9rem_6rem_6rem_auto_auto] sm:items-end">
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium tracking-wide text-slate-400">市区町村</span>
        <input name="city" defaultValue={city} placeholder="例：世田谷" className={inputClass} />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium tracking-wide text-slate-400">町字</span>
        <input name="town" defaultValue={town} placeholder="例：上北沢" className={inputClass} />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium tracking-wide text-slate-400">丁目</span>
        <input name="chome" defaultValue={chome} placeholder="例：一丁目" className={inputClass} />
      </label>
      <label className="block">
        <span className="mb-1.5 block font-mono text-xs tracking-wide text-slate-400">blk_num</span>
        <input name="blk" defaultValue={blkNum} inputMode="numeric" placeholder="例：6" title="完全一致" className={inputClass} />
      </label>
      <label className="block">
        <span className="mb-1.5 block font-mono text-xs tracking-wide text-slate-400">rsdt_num</span>
        <input name="rsdt" defaultValue={rsdtNum} inputMode="numeric" placeholder="例：1" title="完全一致" className={inputClass} />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium tracking-wide text-slate-400">表示件数</span>
        <select
          name="per"
          defaultValue={perPage}
          // 件数を変えたら、すぐに検索し直す
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
          className={`${inputClass} pr-8`}
        >
          {PER_PAGE_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n} 件
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        className="rounded-lg bg-gradient-to-r from-cyan-400 to-sky-500 px-6 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:brightness-110"
      >
        検索
      </button>
    </Form>
  );
}
