import { describe, expect, it } from "vitest";
import { rsdtKeyToId } from "@/domain/rsdt/rsdt-key";
import { EMPTY_CRITERIA } from "@/domain/rsdt/rsdt-repository";
import { InMemoryRsdtSearchIndex } from "@/test/in-memory-rsdt-search-index";
import { makeRsdt } from "@/test/rsdt-fixtures";
import { SearchRsdtEs } from "./search-rsdt-es";

/** rsdt_id が 001〜025 の 25 件 */
const rows = Array.from({ length: 25 }, (_, i) => makeRsdt({ rsdtId: String(i + 1).padStart(3, "0") }));
const search = new SearchRsdtEs(new InMemoryRsdtSearchIndex(rows));
const ids = (r: { rows: { rsdtId: string }[] }) => r.rows.map((x) => x.rsdtId);
const c = EMPTY_CRITERIA;

describe("SearchRsdtEs", () => {
  it("先頭の 1 ページと、件数・何件目か・次へのキーを返す", async () => {
    const r = await search.execute({ criteria: c, perPage: 10 });
    expect([r.total, r.from, r.prevKey, r.index, r.error]).toEqual([25, 1, null, "rsdt_20261121-215617", null]);
    expect(r.nextKey).toBe(rsdtKeyToId(rows[9]));
  });

  it("次へ・前へで、重ならずに行き来できる", async () => {
    const p1 = await search.execute({ criteria: c, perPage: 10 });
    const p2 = await search.execute({ criteria: c, perPage: 10, after: p1.nextKey! });
    const p3 = await search.execute({ criteria: c, perPage: 10, after: p2.nextKey! });
    expect([p1.from, p2.from, p3.from]).toEqual([1, 11, 21]);
    expect([...ids(p1), ...ids(p2), ...ids(p3)]).toEqual(rows.map((x) => x.rsdtId));
    expect(p3.nextKey).toBeNull();
    const back = await search.execute({ criteria: c, perPage: 10, before: p3.prevKey! });
    expect(ids(back)).toEqual(ids(p2));
  });

  it("前へで 1 ページに満たないときは、先頭の 1 ページを出す", async () => {
    const p2 = await search.execute({ criteria: c, perPage: 10, after: rsdtKeyToId(rows[4]) });
    const back = await search.execute({ criteria: c, perPage: 10, before: p2.prevKey! });
    expect([back.from, back.rows.length, back.prevKey]).toEqual([1, 10, null]);
  });

  it("最後へは、最後の 1 ページ分を出す", async () => {
    const r = await search.execute({ criteria: c, perPage: 10, last: true });
    expect([r.from, r.rows.length, r.nextKey]).toEqual([16, 10, null]);
  });

  it("0 件のときは、インデックスの名前を別に取る", async () => {
    const r = await search.execute({ criteria: { ...c, city: "存在しない市" }, perPage: 10 });
    expect([r.total, r.from, r.rows, r.index]).toEqual([0, 0, [], "rsdt_20261121-215617"]);
  });

  it("インデックスに接続できないときは、エラーの文を返す", async () => {
    const r = await new SearchRsdtEs(new InMemoryRsdtSearchIndex(rows, null, true)).execute({ criteria: c, perPage: 10 });
    expect([r.rows, r.total, r.error]).toEqual([[], 0, "接続できません（テスト）"]);
  });

  it("perPage が正しくなければ、エラーにする", async () => {
    await expect(search.execute({ criteria: c, perPage: 0 })).rejects.toThrow(RangeError);
  });
});
