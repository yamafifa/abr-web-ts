import type { Rsdt } from "@/domain/rsdt/rsdt";

/** 画面に出す住所（例：千代田区 内幸町一丁目 6-1） */
export function formatAddress(r: Rsdt): string {
  const town = [r.city, r.ward, `${r.oazaCho ?? ""}${r.chome ?? ""}`, r.koaza].filter((s) => s).join(" ");
  const num = [r.blkNum, r.rsdtNum, r.rsdtNum2].filter((s) => s).join("-");
  return num ? `${town} ${num}` : town;
}
