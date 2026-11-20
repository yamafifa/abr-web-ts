/** 戻り先は、このサイトの中のパスだけを許す（外のサイトへ飛ばされないように） */
export function safeBack(back: unknown): string {
  return typeof back === "string" && back.startsWith("/") && !back.startsWith("//") ? back : "/";
}

export type Done = "updated" | "deleted";

/**
 * 更新・削除のあとに戻る URL。お知らせを出すために ?done= を付ける
 * n はお知らせを出し直すための目印（続けて同じ操作をしても出るように、Flash の key に使う）
 */
export function backWithDone(back: string, done: Done, now: number = Date.now()): string {
  const url = new URL(safeBack(back), "http://localhost");
  url.searchParams.set("done", done);
  url.searchParams.set("n", String(now));
  return `${url.pathname}${url.search}`;
}
