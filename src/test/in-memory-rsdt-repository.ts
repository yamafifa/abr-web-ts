import { RsdtNotFoundError } from "@/domain/rsdt/errors";
import type { Rsdt, RsdtAttributes } from "@/domain/rsdt/rsdt";
import { rsdtKeyToId, type RsdtKey } from "@/domain/rsdt/rsdt-key";
import type { RsdtRepository, RsdtSearchCriteria } from "@/domain/rsdt/rsdt-repository";

const includes = (value: string | null, word: string) => (value ?? "").includes(word);

/** テスト用のリポジトリ。DB の代わりにメモリ上の配列を使う */
export class InMemoryRsdtRepository implements RsdtRepository {
  private readonly rows = new Map<string, Rsdt>();

  constructor(rows: Rsdt[] = []) {
    for (const r of rows) this.rows.set(rsdtKeyToId(r), { ...r });
  }

  private match(r: Rsdt, c: RsdtSearchCriteria): boolean {
    return (
      (!c.city || includes(r.city, c.city) || includes(r.ward, c.city)) &&
      (!c.town || includes(r.oazaCho, c.town) || includes(r.koaza, c.town)) &&
      (!c.chome || includes(r.chome, c.chome)) &&
      (!c.blkNum || r.blkNum === c.blkNum) &&
      (!c.rsdtNum || r.rsdtNum === c.rsdtNum)
    );
  }

  private sorted(c: RsdtSearchCriteria): Rsdt[] {
    return [...this.rows.entries()]
      .filter(([, r]) => this.match(r, c))
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([, r]) => ({ ...r }));
  }

  async count(c: RsdtSearchCriteria) {
    return this.sorted(c).length;
  }

  async findMany(c: RsdtSearchCriteria, offset: number, limit: number) {
    return this.sorted(c).slice(offset, offset + limit);
  }

  async findByKey(key: RsdtKey) {
    const r = this.rows.get(rsdtKeyToId(key));
    return r ? { ...r } : null;
  }

  async update(key: RsdtKey, attributes: RsdtAttributes) {
    const id = rsdtKeyToId(key);
    const r = this.rows.get(id);
    if (!r) throw new RsdtNotFoundError(key);
    this.rows.set(id, { ...r, ...attributes });
  }

  async delete(key: RsdtKey) {
    if (!this.rows.delete(rsdtKeyToId(key))) throw new RsdtNotFoundError(key);
  }
}
