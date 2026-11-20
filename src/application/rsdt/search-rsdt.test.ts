import { describe, expect, it } from "vitest";
import { EMPTY_CRITERIA } from "@/domain/rsdt/rsdt-repository";
import { InMemoryRsdtRepository } from "@/test/in-memory-rsdt-repository";
import { makeRsdt } from "@/test/rsdt-fixtures";
import { SearchRsdt } from "./search-rsdt";

/** rsdt_id が 001〜025 の 25 件 */
const rows = Array.from({ length: 25 }, (_, i) =>
  makeRsdt({ rsdtId: String(i + 1).padStart(3, "0"), rsdtNum: String(i + 1) }),
);
const search = (repo = new InMemoryRsdtRepository(rows)) => new SearchRsdt(repo);

describe("SearchRsdt", () => {
  it("1 ページ分と、件数・ページ数を返す", async () => {
    const r = await search().execute({ criteria: EMPTY_CRITERIA, page: 1, perPage: 10 });
    expect(r.total).toBe(25);
    expect(r.totalPages).toBe(3);
    expect(r.page).toBe(1);
    expect(r.rows.map((x) => x.rsdtId)).toEqual(["001", "002", "003", "004", "005", "006", "007", "008", "009", "010"]);
  });

  it("最後のページは残りの件数だけ", async () => {
    const r = await search().execute({ criteria: EMPTY_CRITERIA, page: 3, perPage: 10 });
    expect(r.rows.map((x) => x.rsdtId)).toEqual(["021", "022", "023", "024", "025"]);
  });

  it("最後のページより後ろを指定されたら、最後のページを返す", async () => {
    const r = await search().execute({ criteria: EMPTY_CRITERIA, page: 999, perPage: 10 });
    expect(r.page).toBe(3);
    expect(r.rows).toHaveLength(5);
  });

  it("0 以下のページは 1 ページ目にする", async () => {
    const r = await search().execute({ criteria: EMPTY_CRITERIA, page: 0, perPage: 10 });
    expect(r.page).toBe(1);
  });

  it("0 件でもページ数は 1", async () => {
    const r = await search(new InMemoryRsdtRepository()).execute({ criteria: EMPTY_CRITERIA, page: 1, perPage: 10 });
    expect(r).toEqual({ rows: [], total: 0, page: 1, totalPages: 1 });
  });

  it("検索条件をリポジトリに渡す", async () => {
    const r = await search().execute({ criteria: { ...EMPTY_CRITERIA, rsdtNum: "12" }, page: 1, perPage: 10 });
    expect(r.total).toBe(1);
    expect(r.rows[0].rsdtNum).toBe("12");
  });

  it("perPage が正しくなければエラー", async () => {
    await expect(search().execute({ criteria: EMPTY_CRITERIA, page: 1, perPage: 0 })).rejects.toThrow(RangeError);
  });
});
