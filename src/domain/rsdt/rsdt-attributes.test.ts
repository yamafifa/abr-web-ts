import { describe, expect, it } from "vitest";
import { ATTRIBUTE_RULES, parseAttributes } from "./rsdt-attributes";

describe("parseAttributes", () => {
  it("17 列すべてに決まりがある", () => {
    expect(ATTRIBUTE_RULES).toHaveLength(17);
  });

  it("正しい入力は、そのまま保存できる値になる", () => {
    const r = parseAttributes({ city: "千代田区", oazaCho: "内幸町", efctDate: "1947-04-17" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.attributes.city).toBe("千代田区");
    expect(r.attributes.oazaCho).toBe("内幸町");
    expect(r.attributes.efctDate).toBe("1947-04-17");
  });

  it("空文字と、入力されなかった列は null になる", () => {
    const r = parseAttributes({ city: "千代田区", ward: "" });
    expect(r.ok && r.attributes.ward).toBeNull();
    expect(r.ok && r.attributes.remarks).toBeNull();
    expect(r.ok && r.attributes.abltDate).toBeNull();
  });

  it("前後の空白は取る。空白だけなら空文字と同じ扱い", () => {
    const r = parseAttributes({ city: "  千代田区 ", koaza: "   " });
    expect(r.ok && r.attributes.city).toBe("千代田区");
    expect(r.ok && r.attributes.koaza).toBeNull();
  });

  it("city は必須", () => {
    expect(parseAttributes({ city: " " })).toEqual({ ok: false, errors: { city: "必須です" } });
  });

  it("最大文字数は、日本語も 1 文字として数える", () => {
    expect(parseAttributes({ city: "あ".repeat(20) }).ok).toBe(true);
    const r = parseAttributes({ city: "あ".repeat(21) });
    expect(r.ok ? null : r.errors.city).toBe("20 文字以内で入力してください");
  });

  it("サロゲートペアの文字（𠮷）も 1 文字として数える", () => {
    expect(parseAttributes({ city: "𠮷".repeat(20) }).ok).toBe(true);
  });

  it.each(["2026-02-30", "2026/01/01", "2026-1-1", "abc"])("正しくない日付はエラー（%s）", (d) => {
    const r = parseAttributes({ city: "千代田区", abltDate: d });
    expect(r.ok ? null : r.errors.abltDate).toBe("日付の形式が正しくありません（YYYY-MM-DD）");
  });

  it("うるう日は通る", () => {
    expect(parseAttributes({ city: "千代田区", efctDate: "2024-02-29" }).ok).toBe(true);
  });

  it("エラーは、すべての列についてまとめて返す", () => {
    const r = parseAttributes({ city: "", statusFlg: "12", efctDate: "x" });
    expect(r.ok ? null : Object.keys(r.errors).sort()).toEqual(["city", "efctDate", "statusFlg"]);
  });
});
