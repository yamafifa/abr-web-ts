import { describe, expect, it } from "vitest";
import { esListHref, indexBuiltAt, parseEsListQuery } from "./es-search-params";

const KEY = "131016_0001001_006_001_";

describe("parseEsListQuery・esListHref", () => {
  it("検索条件・件数・after を URL から読み、URL に戻せる", () => {
    const q = parseEsListQuery({ town: "上北沢", per: "30", after: KEY });
    expect([q.criteria.town, q.perPage, q.after, q.before, q.last]).toEqual(["上北沢", 30, KEY, undefined, undefined]);
    expect(esListHref(q)).toBe(`/es?town=%E4%B8%8A%E5%8C%97%E6%B2%A2&per=30&after=${KEY}`);
  });

  it("キーの形でない after・before は無視する", () => {
    const q = parseEsListQuery({ after: "1 OR 1=1", before: ["x"] });
    expect([q.after, q.before]).toEqual([undefined, undefined]);
  });

  it("条件が無ければ /es", () => {
    expect(esListHref(parseEsListQuery({}))).toBe("/es");
    expect(esListHref({ ...parseEsListQuery({}), last: true })).toBe("/es?last=1");
  });
});

describe("indexBuiltAt", () => {
  it("インデックスの名前から作った日時を読む", () => {
    expect(indexBuiltAt("rsdt_20261121-215617")).toBe("2026-11-21 21:56:17");
    expect(indexBuiltAt(null)).toBeNull();
  });
});
