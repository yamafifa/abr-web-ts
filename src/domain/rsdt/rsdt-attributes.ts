import type { RsdtAttributes } from "./rsdt";

type TextRule = {
  name: Exclude<keyof RsdtAttributes, "efctDate" | "abltDate">;
  /** CSV・テーブルの列名 */
  column: string;
  max: number;
  required?: boolean;
  type: "text";
};
type DateRule = { name: "efctDate" | "abltDate"; column: string; type: "date" };
export type AttributeRule = TextRule | DateRule;

/** 主キー以外の 17 列の決まり（最大文字数はテーブル定義に合わせる） */
export const ATTRIBUTE_RULES: readonly AttributeRule[] = [
  { name: "city", column: "city", max: 20, required: true, type: "text" },
  { name: "ward", column: "ward", max: 20, type: "text" },
  { name: "oazaCho", column: "oaza_cho", max: 80, type: "text" },
  { name: "chome", column: "chome", max: 20, type: "text" },
  { name: "koaza", column: "koaza", max: 80, type: "text" },
  { name: "machiazaDist", column: "machiaza_dist", max: 10, type: "text" },
  { name: "blkNum", column: "blk_num", max: 20, type: "text" },
  { name: "rsdtNum", column: "rsdt_num", max: 20, type: "text" },
  { name: "rsdtNum2", column: "rsdt_num2", max: 20, type: "text" },
  { name: "basicRsdtDiv", column: "basic_rsdt_div", max: 1, type: "text" },
  { name: "rsdtAddrFlg", column: "rsdt_addr_flg", max: 1, type: "text" },
  { name: "rsdtAddrMtdCode", column: "rsdt_addr_mtd_code", max: 1, type: "text" },
  { name: "statusFlg", column: "status_flg", max: 1, type: "text" },
  { name: "efctDate", column: "efct_date", type: "date" },
  { name: "abltDate", column: "ablt_date", type: "date" },
  { name: "srcCode", column: "src_code", max: 2, type: "text" },
  { name: "remarks", column: "remarks", max: 255, type: "text" },
];

export type AttributeErrors = Partial<Record<keyof RsdtAttributes, string>>;

/** 入力（列ごとの文字列）。無い列は空文字として扱う */
export type AttributeInput = Partial<Record<keyof RsdtAttributes, string>>;

export type ParseResult =
  | { ok: true; attributes: RsdtAttributes }
  | { ok: false; errors: AttributeErrors };

/** YYYY-MM-DD として正しい日付か（2026-02-30 のような日付は通さない） */
function isValidDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

/**
 * 入力を検査して、保存できる値にする
 * - 前後の空白は取る
 * - 空文字は null にする（abr-batch の取り込みと同じ扱い）
 * - 文字数は、コードポイント単位で数える（MySQL の VARCHAR と同じ）
 */
export function parseAttributes(input: AttributeInput): ParseResult {
  const errors: AttributeErrors = {};
  const values: Record<string, string | null> = {};

  for (const rule of ATTRIBUTE_RULES) {
    const raw = (input[rule.name] ?? "").trim();
    if (raw === "") {
      if (rule.type === "text" && rule.required) errors[rule.name] = "必須です";
      else values[rule.name] = null;
      continue;
    }
    if (rule.type === "date") {
      if (isValidDate(raw)) values[rule.name] = raw;
      else errors[rule.name] = "日付の形式が正しくありません（YYYY-MM-DD）";
      continue;
    }
    if ([...raw].length > rule.max) errors[rule.name] = `${rule.max} 文字以内で入力してください`;
    else values[rule.name] = raw;
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, attributes: values as RsdtAttributes };
}
