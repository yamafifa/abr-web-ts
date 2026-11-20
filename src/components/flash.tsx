"use client";

import { useEffect, useState } from "react";

const MESSAGES = { updated: "更新しました", deleted: "削除しました" } as const;

/**
 * 更新・削除のあとに出すお知らせ。表示したら URL の ?done= を消して、再読み込みで出ないようにする
 * 呼ぶ側で key を変えて、お知らせのたびに作り直す（続けて同じ操作をしても出るように）
 */
export function Flash({ done }: { done?: string }) {
  const [shown, setShown] = useState(done);

  useEffect(() => {
    if (!done) return;
    const url = new URL(window.location.href);
    url.searchParams.delete("done");
    url.searchParams.delete("n");
    window.history.replaceState(window.history.state, "", url);
    const t = setTimeout(() => setShown(undefined), 3000);
    return () => clearTimeout(t);
  }, [done]);

  if (shown !== "updated" && shown !== "deleted") return null;
  return (
    <div className="fixed right-4 top-20 z-50 flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/15 px-4 py-3 text-sm text-emerald-200 shadow-lg shadow-black/30 backdrop-blur">
      <span className="size-2 rounded-full bg-emerald-400" />
      {MESSAGES[shown]}
    </div>
  );
}
