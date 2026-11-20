"use client";

import Link from "next/link";
import { startTransition, useActionState, useRef, useState } from "react";
import { updateRsdtAction, type UpdateState } from "@/app/actions";
import { DeleteButton } from "@/components/delete-button";
import { ConfirmModal } from "@/components/modal";
import { ATTRIBUTE_RULES } from "@/domain/rsdt/rsdt-attributes";
import type { AttributeFormValues } from "@/presentation/form";

type Props = { id: string; back: string; address: string; initial: AttributeFormValues };
type Change = { column: string; before: string; after: string };

export function EditForm({ id, back, address, initial }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<UpdateState, FormData>(
    updateRsdtAction.bind(null, id, back),
    {},
  );
  const [changes, setChanges] = useState<Change[] | null>(null);

  // 「更新」を押したら、すぐには送らず、変わった項目をモーダルで見せる
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const list = ATTRIBUTE_RULES.flatMap((f) => {
      const after = String(form.get(f.name) ?? "").trim();
      return after === initial[f.name] ? [] : [{ column: f.column, before: initial[f.name], after }];
    });
    setChanges(list);
  };

  const onConfirm = () => {
    if (!formRef.current) return;
    const form = new FormData(formRef.current);
    startTransition(() => formAction(form));
    setChanges(null);
  };

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className="rounded-2xl border border-white/10 bg-slate-900/50 shadow-xl shadow-black/20 backdrop-blur"
    >
      {state.message && (
        <p className="border-b border-rose-400/20 bg-rose-500/10 px-6 py-3 text-sm text-rose-300">{state.message}</p>
      )}
      <div className="grid gap-x-6 gap-y-5 p-6 sm:grid-cols-2 lg:grid-cols-3">
        {ATTRIBUTE_RULES.map((f) => {
          const error = state.errors?.[f.name];
          return (
            <label key={f.name} className={f.name === "remarks" ? "block sm:col-span-2 lg:col-span-3" : "block"}>
              <span className="mb-1.5 flex items-baseline justify-between font-mono text-xs text-slate-400">
                <span>
                  {f.column}
                  {f.type === "text" && f.required && <span className="ml-1 text-rose-400">*</span>}
                </span>
                {f.type === "text" && <span className="text-[10px] text-slate-600">最大 {f.max} 文字</span>}
              </span>
              <input
                name={f.name}
                type={f.type}
                defaultValue={initial[f.name]}
                aria-invalid={!!error}
                className={`w-full rounded-lg border bg-slate-950/60 px-3 py-2 text-sm text-white outline-none transition focus:ring-2 ${
                  error
                    ? "border-rose-400/60 focus:ring-rose-400/20"
                    : "border-white/10 focus:border-cyan-400/60 focus:ring-cyan-400/20"
                }`}
              />
              {error && <span className="mt-1 block text-xs text-rose-400">{error}</span>}
            </label>
          );
        })}
      </div>
      <div className="flex items-center gap-3 border-t border-white/10 bg-slate-950/30 px-6 py-4">
        <DeleteButton id={id} address={address} back={back} variant="button" />
        <Link href={back} className="ml-auto rounded-lg px-4 py-2 text-sm text-slate-300 hover:bg-white/5">
          キャンセル
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-gradient-to-r from-cyan-400 to-sky-500 px-6 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:brightness-110 disabled:opacity-60"
        >
          {pending ? "更新中…" : "更新"}
        </button>
      </div>

      <ConfirmModal
        open={changes !== null}
        title="この内容で更新しますか？"
        confirmLabel="更新する"
        onConfirm={onConfirm}
        onClose={() => setChanges(null)}
      >
        {changes?.length === 0 ? (
          <p>変更された項目はありません。このまま保存しますか？</p>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="text-slate-500">
              <tr>
                <th className="py-1 pr-2 font-medium">列</th>
                <th className="py-1 pr-2 font-medium">変更前</th>
                <th className="py-1 font-medium">変更後</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {changes?.map((c) => (
                <tr key={c.column}>
                  <td className="py-1.5 pr-2 text-slate-400">{c.column}</td>
                  <td className="py-1.5 pr-2 text-slate-500 line-through">{c.before || "（空）"}</td>
                  <td className="py-1.5 text-cyan-300">{c.after || "（空）"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </ConfirmModal>
    </form>
  );
}
