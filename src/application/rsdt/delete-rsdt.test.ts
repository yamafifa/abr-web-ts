import { describe, expect, it } from "vitest";
import { InMemoryRsdtRepository } from "@/test/in-memory-rsdt-repository";
import { makeRsdt } from "@/test/rsdt-fixtures";
import { DeleteRsdt } from "./delete-rsdt";
import { GetRsdt } from "./get-rsdt";

const row = makeRsdt();
const key = { lgCode: row.lgCode, machiazaId: row.machiazaId, blkId: row.blkId, rsdtId: row.rsdtId, rsdt2Id: row.rsdt2Id };

describe("DeleteRsdt", () => {
  it("削除する", async () => {
    const repo = new InMemoryRsdtRepository([row]);
    await new DeleteRsdt(repo).execute(key);
    expect(await new GetRsdt(repo).execute(key)).toBeNull();
  });

  it("すでに無くてもエラーにしない", async () => {
    await expect(new DeleteRsdt(new InMemoryRsdtRepository()).execute(key)).resolves.toBeUndefined();
  });

  it("リポジトリのほかのエラーは、そのまま投げる", async () => {
    const repo = new InMemoryRsdtRepository([row]);
    repo.delete = async () => {
      throw new Error("DB に接続できません");
    };
    await expect(new DeleteRsdt(repo).execute(key)).rejects.toThrow("DB に接続できません");
  });
});

describe("GetRsdt", () => {
  it("あれば返す", async () => {
    expect(await new GetRsdt(new InMemoryRsdtRepository([row])).execute(key)).toEqual(row);
  });
});
