import { RsdtNotFoundError } from "@/domain/rsdt/errors";
import { parseAttributes, type AttributeErrors, type AttributeInput } from "@/domain/rsdt/rsdt-attributes";
import type { RsdtKey } from "@/domain/rsdt/rsdt-key";
import type { RsdtRepository } from "@/domain/rsdt/rsdt-repository";

export type UpdateRsdtOutput =
  | { status: "updated" }
  | { status: "invalid"; errors: AttributeErrors }
  | { status: "notFound" };

/** 入力を検査して、住居の主キー以外の列を更新する */
export class UpdateRsdt {
  constructor(private readonly repository: RsdtRepository) {}

  async execute(key: RsdtKey, input: AttributeInput): Promise<UpdateRsdtOutput> {
    const parsed = parseAttributes(input);
    if (!parsed.ok) return { status: "invalid", errors: parsed.errors };
    try {
      await this.repository.update(key, parsed.attributes);
      return { status: "updated" };
    } catch (e) {
      if (e instanceof RsdtNotFoundError) return { status: "notFound" };
      throw e;
    }
  }
}
