import { ATTRIBUTE_RULES, type AttributeInput } from "@/domain/rsdt/rsdt-attributes";
import type { Rsdt } from "@/domain/rsdt/rsdt";

/** フォームの値（FormData）を、ドメインの入力の形にする */
export function formDataToAttributeInput(form: FormData): AttributeInput {
  return Object.fromEntries(ATTRIBUTE_RULES.map((r) => [r.name, String(form.get(r.name) ?? "")]));
}

/** 編集フォームの初期値（null は空文字にする） */
export type AttributeFormValues = Required<{ [K in keyof AttributeInput]: string }>;

export function toFormValues(r: Rsdt): AttributeFormValues {
  return Object.fromEntries(ATTRIBUTE_RULES.map((rule) => [rule.name, r[rule.name] ?? ""])) as AttributeFormValues;
}
