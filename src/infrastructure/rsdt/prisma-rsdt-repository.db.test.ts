/**
 * 本物の DB（abr-batch の MySQL、全件 1,752,573 件が入っている前提）を使うテスト
 * 変更するテストは、トランザクションの中で実行して最後に取り消す（DB の中身は変わらない）
 */
import { afterAll, describe, expect, it } from "vitest";
import { RsdtNotFoundError } from "@/domain/rsdt/errors";
import type { RsdtAttributes } from "@/domain/rsdt/rsdt";
import { ATTRIBUTE_RULES } from "@/domain/rsdt/rsdt-attributes";
import { EMPTY_CRITERIA } from "@/domain/rsdt/rsdt-repository";
import { prisma } from "@/infrastructure/prisma/client";
import { PrismaRsdtRepository } from "./prisma-rsdt-repository";

const repo = new PrismaRsdtRepository(prisma);
const key = { lgCode: "131016", machiazaId: "0001001", blkId: "006", rsdtId: "001", rsdt2Id: "" };
const missingKey = { ...key, rsdtId: "999", rsdt2Id: "99999" };

class Rollback extends Error {}

/** トランザクションの中で fn を実行して、最後に必ず取り消す */
async function inRollback(fn: (repo: PrismaRsdtRepository) => Promise<void>) {
  await expect(
    prisma.$transaction(
      async (tx) => {
        await fn(new PrismaRsdtRepository(tx));
        throw new Rollback();
      },
      { timeout: 30_000 },
    ),
  ).rejects.toBeInstanceOf(Rollback);
}

afterAll(async () => {
  await prisma.$disconnect();
});

describe("PrismaRsdtRepository（読み取り）", () => {
  it("条件なしの件数は全件", async () => {
    expect(await repo.count(EMPTY_CRITERIA)).toBe(1_752_573);
  });

  it("主キー順に読み、DATE 列は YYYY-MM-DD の文字列になる", async () => {
    const rows = await repo.findMany(EMPTY_CRITERIA, 0, 2);
    expect(rows.map((r) => r.rsdtId)).toEqual(["001", "002"]);
    expect(rows[0]).toMatchObject({ ...key, city: "千代田区", oazaCho: "内幸町", efctDate: "1947-04-17", abltDate: null });
  });

  it("offset と limit でずらして読める", async () => {
    const [second] = await repo.findMany(EMPTY_CRITERIA, 1, 1);
    expect(second.rsdtId).toBe("002");
  });

  it("「%」「_」は、ただの文字として探す（全件が出ない）", async () => {
    expect(await repo.count({ ...EMPTY_CRITERIA, town: "%" })).toBe(0);
    expect(await repo.count({ ...EMPTY_CRITERIA, town: "_" })).toBe(0);
  });

  it("全角と半角は同じ文字として探せる（DB の照合順序による）", async () => {
    const c = { ...EMPTY_CRITERIA, town: "上北沢" };
    const zenkaku = await repo.count({ ...c, chome: "３" });
    expect(zenkaku).toBeGreaterThan(0);
    expect(await repo.count({ ...c, chome: "3" })).toBe(zenkaku);
  });

  it("blk_num は完全一致（「1」で 10 や 21 は出ない）", async () => {
    const rows = await repo.findMany({ ...EMPTY_CRITERIA, town: "上北沢", blkNum: "1" }, 0, 100);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.blkNum === "1")).toBe(true);
  });

  it("findByKey：無ければ null", async () => {
    expect((await repo.findByKey(key))?.city).toBe("千代田区");
    expect(await repo.findByKey(missingKey)).toBeNull();
  });
});

describe("PrismaRsdtRepository（書き込み。最後に取り消す）", () => {
  it("update：17 列を書き換え、DATE 列も文字列で読み戻せる", async () => {
    await inRollback(async (tx) => {
      const before = (await tx.findByKey(key))!;
      // 主キー以外の 17 列を取り出して、一部を書き換える
      const attrs = Object.fromEntries(ATTRIBUTE_RULES.map((r) => [r.name, before[r.name]])) as RsdtAttributes;
      const changed: RsdtAttributes = { ...attrs, remarks: "テスト 100%_", abltDate: "2026-11-20", koaza: null };
      await tx.update(key, changed);
      expect(await tx.findByKey(key)).toEqual({ ...key, ...changed });
    });
    // 取り消されている
    expect((await repo.findByKey(key))?.remarks).toBeNull();
  });

  it("delete：消える", async () => {
    await inRollback(async (tx) => {
      await tx.delete(key);
      expect(await tx.findByKey(key)).toBeNull();
    });
    expect(await repo.findByKey(key)).not.toBeNull();
  });

  it("無い行の update・delete は RsdtNotFoundError", async () => {
    const attrs = { city: "千代田区" } as RsdtAttributes;
    await expect(repo.update(missingKey, attrs)).rejects.toBeInstanceOf(RsdtNotFoundError);
    await expect(repo.delete(missingKey)).rejects.toBeInstanceOf(RsdtNotFoundError);
  });
});
