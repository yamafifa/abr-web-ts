import { describe, expect, it } from "vitest";
import { rsdtKeyFromId, rsdtKeyToId } from "./rsdt-key";

const key = { lgCode: "131016", machiazaId: "0001001", blkId: "006", rsdtId: "001", rsdt2Id: "" };

describe("rsdtKeyToId / rsdtKeyFromId", () => {
  it("5 列を _ でつなぐ。rsdt2_id が空なら末尾が _ になる", () => {
    expect(rsdtKeyToId(key)).toBe("131016_0001001_006_001_");
  });

  it("元に戻せる", () => {
    expect(rsdtKeyFromId(rsdtKeyToId(key))).toEqual(key);
    const withRsdt2 = { ...key, rsdt2Id: "00001" };
    expect(rsdtKeyFromId(rsdtKeyToId(withRsdt2))).toEqual(withRsdt2);
  });

  it.each([
    ["区切りが足りない", "131016_0001001_006_001"],
    ["区切りが多い", "131016_0001001_006_001__"],
    ["必須の列が空", "131016__006_001_"],
    ["空文字", ""],
  ])("形がおかしければ null（%s）", (_, id) => {
    expect(rsdtKeyFromId(id)).toBeNull();
  });
});
