import { describe, expect, it } from "vitest";
import { EMPTY_CRITERIA } from "@/domain/rsdt/rsdt-repository";
import { buildWhere, escapeLike } from "./prisma-rsdt-repository";

describe("escapeLike", () => {
  it("% _ \\ の前に \\ を付ける", () => {
    expect(escapeLike("100%_a\\b")).toBe("100\\%\\_a\\\\b");
  });
  it("ふつうの文字はそのまま", () => {
    expect(escapeLike("世田谷")).toBe("世田谷");
  });
});

describe("buildWhere", () => {
  it("条件が無ければ全件", () => {
    expect(buildWhere(EMPTY_CRITERIA)).toEqual({});
  });

  it("部分一致の条件は LIKE の特別な文字をエスケープし、blk_num・rsdt_num は完全一致にする", () => {
    expect(buildWhere({ city: "%", town: "", chome: "3", blkNum: "1", rsdtNum: "2" })).toEqual({
      AND: [
        { OR: [{ city: { contains: "\\%" } }, { ward: { contains: "\\%" } }] },
        { chome: { contains: "3" } },
        { blkNum: "1" },
        { rsdtNum: "2" },
      ],
    });
  });
});
