"use client";

import { useEffect, useRef, type ReactNode } from "react";

type Props = {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  /** 削除など、取り消せない操作のときは赤くする */
  danger?: boolean;
  pending?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

/** 確認用のモーダル。ブラウザの <dialog> を使うので、Esc で閉じる・後ろを操作できない、が最初から付いている */
export function ConfirmModal({ open, title, children, confirmLabel, danger, pending, onConfirm, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      // 後ろの暗い部分をクリックしたら閉じる
      onClick={(e) => e.target === ref.current && !pending && onClose()}
      onCancel={(e) => pending && e.preventDefault()}
      className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-2xl border border-white/10 bg-slate-900/95 p-0 text-slate-200 shadow-2xl shadow-black/50"
    >
      <div className="p-6">
        <div className="flex items-center gap-3">
          <span
            className={`grid size-9 place-items-center rounded-full ${
              danger ? "bg-rose-500/15 text-rose-400" : "bg-cyan-500/15 text-cyan-300"
            }`}
          >
            {danger ? "!" : "?"}
          </span>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
        </div>
        <div className="mt-4 text-sm text-slate-300">{children}</div>
      </div>
      <div className="flex justify-end gap-2 border-t border-white/10 bg-slate-950/40 px-6 py-4">
        <button
          type="button"
          onClick={onClose}
          disabled={pending}
          className="rounded-lg px-4 py-2 text-sm text-slate-300 hover:bg-white/5 disabled:opacity-50"
        >
          キャンセル
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={pending}
          autoFocus
          className={`rounded-lg px-4 py-2 text-sm font-medium text-slate-950 shadow-lg disabled:opacity-60 ${
            danger
              ? "bg-rose-400 shadow-rose-500/20 hover:bg-rose-300"
              : "bg-cyan-400 shadow-cyan-500/20 hover:bg-cyan-300"
          }`}
        >
          {pending ? "処理中…" : confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
