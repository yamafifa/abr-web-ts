import { describe, expect, it } from "vitest";
import { listHref, parseListQuery } from "./search-params";

describe("parseListQuery", () => {
  it("何も無ければ、条件なし・15 件・1 ページ目", () => {
    expect(parseListQuery({})).toEqual({
      criteria: { city: "", town: "", chome: "", blkNum: "", rsdtNum: "" },
      perPage: 15,
      page: 1,
    });
  });

  it("URL の名前（blk・rsdt）を検索条件の項目に読み替える。前後の空白は取る", () => {
    const q = parseListQuery({ city: " 世田谷 ", town: "上北沢", chome: "3", blk: "1", rsdt: "2", per: "30", page: "4" });
    expect(q).toEqual({
      criteria: { city: "世田谷", town: "上北沢", chome: "3", blkNum: "1", rsdtNum: "2" },
      perPage: 30,
      page: 4,
    });
  });

  it.each([["0"], ["20"], ["abc"]])("選べない件数（%s）は 15 件にする", (per) => {
    expect(parseListQuery({ per }).perPage).toBe(15);
  });

  it.each([["0"], ["-1"], ["1.5"], ["abc"]])("おかしなページ番号（%s）は 1 にする", (page) => {
    expect(parseListQuery({ page }).page).toBe(1);
  });

  it("同じ名前が複数あれば、最初のものを使う", () => {
    expect(parseListQuery({ city: ["新宿", "渋谷"] }).criteria.city).toBe("新宿");
  });

  it("長すぎる入力は切り詰める", () => {
    expect(parseListQuery({ blk: "1".repeat(50) }).criteria.blkNum).toHaveLength(20);
  });
});

describe("listHref", () => {
  it("条件なし・既定値なら /", () => {
    expect(listHref(parseListQuery({}))).toBe("/");
  });

  it("空の条件と既定値は省く", () => {
    expect(listHref(parseListQuery({ city: "世田谷", blk: "1", per: "15", page: "1" }))).toBe("/?city=%E4%B8%96%E7%94%B0%E8%B0%B7&blk=1");
  });

  it("parseListQuery で元に戻せる", () => {
    const q = parseListQuery({ city: "世田谷", town: "上北沢", chome: "3", blk: "1", rsdt: "2", per: "50", page: "7" });
    const sp = Object.fromEntries(new URL(listHref(q), "http://localhost").searchParams);
    expect(parseListQuery(sp)).toEqual(q);
  });
});
