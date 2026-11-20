import { describe, expect, it } from "vitest";
import { makeRsdt } from "@/test/rsdt-fixtures";
import { formatAddress } from "./format";

describe("formatAddress", () => {
  it("市区町村・町字丁目・番号をつなぐ", () => {
    expect(formatAddress(makeRsdt())).toBe("千代田区 内幸町一丁目 6-1");
  });

  it("無い項目は飛ばす", () => {
    expect(formatAddress(makeRsdt({ chome: null, blkNum: null, rsdtNum: null }))).toBe("千代田区 内幸町");
  });

  it("ward・koaza・rsdt_num2 があれば入れる", () => {
    expect(formatAddress(makeRsdt({ ward: "区", koaza: "小字", rsdtNum2: "3" }))).toBe("千代田区 区 内幸町一丁目 小字 6-1-3");
  });
});
