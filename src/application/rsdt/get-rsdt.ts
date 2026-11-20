import type { Rsdt } from "@/domain/rsdt/rsdt";
import type { RsdtKey } from "@/domain/rsdt/rsdt-key";
import type { RsdtRepository } from "@/domain/rsdt/rsdt-repository";

/** 住居を 1 件取る。無ければ null */
export class GetRsdt {
  constructor(private readonly repository: RsdtRepository) {}

  execute(key: RsdtKey): Promise<Rsdt | null> {
    return this.repository.findByKey(key);
  }
}
