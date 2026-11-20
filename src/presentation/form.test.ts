import { describe, expect, it } from "vitest";
import { makeRsdt } from "@/test/rsdt-fixtures";
import { formDataToAttributeInput, toFormValues } from "./form";

describe("formDataToAttributeInput", () => {
  it("17 列を取り出す。無い列は空文字、関係ない項目は捨てる", () => {
    const form = new FormData();
    form.set("city", "千代田区");
    form.set("lgCode", "999999");
    const input = formDataToAttributeInput(form);
    expect(Object.keys(input)).toHaveLength(17);
    expect(input.city).toBe("千代田区");
    expect(input.remarks).toBe("");
    expect("lgCode" in input).toBe(false);
  });
});

describe("toFormValues", () => {
  it("null は空文字にする", () => {
    const v = toFormValues(makeRsdt());
    expect(v.city).toBe("千代田区");
    expect(v.ward).toBe("");
    expect(v.efctDate).toBe("1947-04-17");
    expect("lgCode" in v).toBe(false);
  });
});
