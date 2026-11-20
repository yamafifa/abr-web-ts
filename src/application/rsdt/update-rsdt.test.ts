import { describe, expect, it } from "vitest";
import { InMemoryRsdtRepository } from "@/test/in-memory-rsdt-repository";
import { makeRsdt } from "@/test/rsdt-fixtures";
import { UpdateRsdt } from "./update-rsdt";

const row = makeRsdt();
const key = { lgCode: row.lgCode, machiazaId: row.machiazaId, blkId: row.blkId, rsdtId: row.rsdtId, rsdt2Id: row.rsdt2Id };

describe("UpdateRsdt", () => {
  it("正しい入力なら更新する。入力されなかった列は null になる", async () => {
    const repo = new InMemoryRsdtRepository([row]);
    const r = await new UpdateRsdt(repo).execute(key, { city: "千代田区", remarks: "テスト", abltDate: "2026-11-20" });
    expect(r).toEqual({ status: "updated" });
    const saved = await repo.findByKey(key);
    expect(saved?.remarks).toBe("テスト");
    expect(saved?.abltDate).toBe("2026-11-20");
    expect(saved?.oazaCho).toBeNull();
    // 主キーは変わらない
    expect(saved?.rsdtId).toBe("001");
  });

  it("入力が正しくなければ、更新しないでエラーを返す", async () => {
    const repo = new InMemoryRsdtRepository([row]);
    const r = await new UpdateRsdt(repo).execute(key, { city: "", remarks: "テスト" });
    expect(r).toEqual({ status: "invalid", errors: { city: "必須です" } });
    expect((await repo.findByKey(key))?.remarks).toBeNull();
  });

  it("行が無ければ notFound", async () => {
    const r = await new UpdateRsdt(new InMemoryRsdtRepository()).execute(key, { city: "千代田区" });
    expect(r).toEqual({ status: "notFound" });
  });

  it("リポジトリのほかのエラーは、そのまま投げる", async () => {
    const repo = new InMemoryRsdtRepository([row]);
    repo.update = async () => {
      throw new Error("DB に接続できません");
    };
    await expect(new UpdateRsdt(repo).execute(key, { city: "千代田区" })).rejects.toThrow("DB に接続できません");
  });
});
