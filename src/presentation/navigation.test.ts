import { describe, expect, it } from "vitest";
import { backWithDone, safeBack } from "./navigation";

describe("safeBack", () => {
  it("サイトの中のパスはそのまま", () => {
    expect(safeBack("/?city=x&page=2")).toBe("/?city=x&page=2");
  });

  it.each([["//evil.example"], ["https://evil.example"], ["javascript:alert(1)"], [""], [undefined], [["/"]]])(
    "外のサイトや、おかしな値は / にする（%s）",
    (back) => {
      expect(safeBack(back)).toBe("/");
    },
  );
});

describe("backWithDone", () => {
  it("今のクエリを残して done と n を付ける", () => {
    expect(backWithDone("/?city=x&page=2", "updated", 123)).toBe("/?city=x&page=2&done=updated&n=123");
  });

  it("外のサイトは / にしてから付ける", () => {
    expect(backWithDone("//evil.example", "deleted", 1)).toBe("/?done=deleted&n=1");
  });
});
