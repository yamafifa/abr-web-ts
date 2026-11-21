import { describe, expect, it } from "vitest";
import { EMPTY_CRITERIA } from "@/domain/rsdt/rsdt-repository";
import { fold } from "@/infrastructure/elasticsearch/fold";
import { buildFilters } from "./elasticsearch-rsdt-search-index";

describe("fold", () => {
  it("全角と半角、大文字と小文字をそろえる", () => expect(fold("３丁目ＡＢｃ")).toBe("3丁目abc"));
  it("カタカナをひらがなにして、濁点・半濁点を消す", () => expect(fold("パガあ")).toBe("はかあ"));
  it("小さい仮名を大きくする", () => expect(fold("ヶヵっ")).toBe("けかつ"));
  it("CJK 互換漢字はそのまま残す（MySQL は別の文字として扱う）", () => {
    const compat = String.fromCodePoint(0xfa10); // 塚（互換漢字）
    expect(fold(compat)).toBe(compat);
  });
});

describe("buildFilters", () => {
  it("空の条件は使わない", () => expect(buildFilters(EMPTY_CRITERIA)).toEqual([]));

  it("部分一致は wildcard（文字をそろえ、* ? \\ はただの文字にする）、完全一致は term", () => {
    expect(buildFilters({ ...EMPTY_CRITERIA, city: "ア*", blkNum: "１" })).toEqual([
      {
        bool: {
          should: [{ wildcard: { "fold.city": { value: "*あ\\**" } } }, { wildcard: { "fold.ward": { value: "*あ\\**" } } }],
          minimum_should_match: 1,
        },
      },
      { term: { "fold.blk_num": "1" } },
    ]);
  });
});
