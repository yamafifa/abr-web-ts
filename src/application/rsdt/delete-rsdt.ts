import { RsdtNotFoundError } from "@/domain/rsdt/errors";
import type { RsdtKey } from "@/domain/rsdt/rsdt-key";
import type { RsdtRepository } from "@/domain/rsdt/rsdt-repository";

/** 住居を削除する。すでに無ければ、消せたものとして扱う（同じ削除を 2 回送られても失敗にしない） */
export class DeleteRsdt {
  constructor(private readonly repository: RsdtRepository) {}

  async execute(key: RsdtKey): Promise<void> {
    try {
      await this.repository.delete(key);
    } catch (e) {
      if (!(e instanceof RsdtNotFoundError)) throw e;
    }
  }
}
