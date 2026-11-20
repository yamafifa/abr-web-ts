"use server";

/**
 * 画面からの更新・削除を受け取る（Server Actions）
 * ここでやるのは「フォームの値をユースケースに渡す → 結果を画面の形にする → 戻り先へ redirect」だけ
 */
import { redirect } from "next/navigation";
import { deleteRsdt, updateRsdt } from "@/composition-root";
import type { AttributeErrors } from "@/domain/rsdt/rsdt-attributes";
import { rsdtKeyFromId } from "@/domain/rsdt/rsdt-key";
import { formDataToAttributeInput } from "@/presentation/form";
import { backWithDone } from "@/presentation/navigation";

export type UpdateState = { errors?: AttributeErrors; message?: string };

export async function updateRsdtAction(
  id: string,
  back: string,
  _prev: UpdateState,
  form: FormData,
): Promise<UpdateState> {
  const key = rsdtKeyFromId(id);
  if (!key) return { message: "対象の行を特定できません" };

  const result = await updateRsdt.execute(key, formDataToAttributeInput(form));
  switch (result.status) {
    case "invalid":
      return { errors: result.errors, message: "入力内容を確認してください" };
    case "notFound":
      return { message: "この行はすでに削除されています" };
    case "updated":
      redirect(backWithDone(back, "updated"));
  }
}

export async function deleteRsdtAction(id: string, back: string): Promise<{ message: string }> {
  const key = rsdtKeyFromId(id);
  if (!key) return { message: "対象の行を特定できません" };
  await deleteRsdt.execute(key);
  redirect(backWithDone(back, "deleted"));
}
