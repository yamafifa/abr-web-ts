"use client";

import { useState, useTransition } from "react";
import { deleteRsdtAction } from "@/app/actions";
import { ConfirmModal } from "@/components/modal";

type Props = { id: string; address: string; back: string; variant?: "icon" | "button" };

export function DeleteButton({ id, address, back, variant = "icon" }: Props) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  const onConfirm = () =>
    startTransition(async () => {
      // 成功すると redirect するので、戻ってくるのは失敗したときだけ
      const res = await deleteRsdtAction(id, back);
      setMessage(res.message);
    });

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setMessage("");
          setOpen(true);
        }}
        className={
          variant === "icon"
            ? "rounded-md px-2.5 py-1 text-xs text-rose-300 ring-1 ring-rose-400/30 hover:bg-rose-500/10"
            : "rounded-lg px-4 py-2 text-sm text-rose-300 ring-1 ring-rose-400/40 hover:bg-rose-500/10"
        }
      >
        削除
      </button>
      <ConfirmModal
        open={open}
        title="この行を削除しますか？"
        confirmLabel="削除する"
        danger
        pending={pending}
        onConfirm={onConfirm}
        onClose={() => setOpen(false)}
      >
        <p className="rounded-lg bg-slate-950/60 px-3 py-2 font-medium text-white">{address}</p>
        <p className="mt-2 font-mono text-xs text-slate-500">{id}</p>
        <p className="mt-3">削除すると元に戻せません。</p>
        {message && <p className="mt-3 text-rose-400">{message}</p>}
      </ConfirmModal>
    </>
  );
}
