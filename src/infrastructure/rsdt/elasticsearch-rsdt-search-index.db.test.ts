/**
 * 本物の Elasticsearch（abr-batch の npm run es:index で作ったインデックス）と DB を使うテスト（npm run test:db）
 */
import { describe, expect, it } from "vitest";
import { SearchRsdtEs } from "@/application/rsdt/search-rsdt-es";
import { rsdtKeyToId } from "@/domain/rsdt/rsdt-key";
import { EMPTY_CRITERIA } from "@/domain/rsdt/rsdt-repository";
import { prisma } from "@/infrastructure/prisma/client";
import { ElasticsearchRsdtSearchIndex } from "./elasticsearch-rsdt-search-index";
import { PrismaRsdtRepository } from "./prisma-rsdt-repository";

const index = new ElasticsearchRsdtSearchIndex();
const repo = new PrismaRsdtRepository(prisma);
/** 世田谷区 上北沢３丁目 の blk_num=1（21 件） */
const c = { ...EMPTY_CRITERIA, town: "上北沢", chome: "3", blkNum: "1" };

describe("ElasticsearchRsdtSearchIndex", () => {
  it("DB と同じ件数・同じ順・同じ値で返す", async () => {
    const es = await index.page(c, { size: 100 });
    const db = await repo.findMany(c, 0, 100);
    expect(es.total).toBe(21);
    expect(es.rows).toEqual(db);
    expect(es.index).toMatch(/^rsdt_\d{8}-\d{6}$/);
  });

  it("MySQL と同じく、全角と半角を同じ文字として探す（「3」で「３丁目」）", async () => {
    const cc = { ...EMPTY_CRITERIA, town: "上北沢", chome: "3" };
    expect((await index.page(cc, { size: 1 })).total).toBe(await repo.count(cc));
  });

  it("* ? \\ は、ただの文字として探す", async () => {
    expect((await index.page({ ...EMPTY_CRITERIA, city: "*" }, { size: 1 })).total).toBe(0);
    expect((await index.page({ ...EMPTY_CRITERIA, town: "?" }, { size: 1 })).total).toBe(0);
  });

  it("SearchRsdtEs と組み合わせて、次へ・前へ・最後へが動く", async () => {
    const search = new SearchRsdtEs(index);
    const p1 = await search.execute({ criteria: c, perPage: 10 });
    const p2 = await search.execute({ criteria: c, perPage: 10, after: p1.nextKey! });
    const last = await search.execute({ criteria: c, perPage: 10, last: true });
    expect([p1.from, p2.from, last.from, last.nextKey]).toEqual([1, 11, 12, null]);
    expect((await search.execute({ criteria: c, perPage: 10, before: p2.prevKey! })).rows.map(rsdtKeyToId)).toEqual(
      p1.rows.map(rsdtKeyToId),
    );
  });

  it("接続できないときは、エラーの文を返す", async () => {
    const r = await new SearchRsdtEs(new ElasticsearchRsdtSearchIndex("http://127.0.0.1:1")).execute({ criteria: c, perPage: 10 });
    expect(r.error).toContain("接続できません");
  });
});
