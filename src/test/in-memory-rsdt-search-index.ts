import type { Rsdt } from "@/domain/rsdt/rsdt";
import { rsdtKeyToId } from "@/domain/rsdt/rsdt-key";
import type { RsdtSearchCriteria } from "@/domain/rsdt/rsdt-repository";
import { SearchIndexError, type RsdtSearchIndex, type SearchIndexPage } from "@/domain/rsdt/rsdt-search-index";
import { InMemoryRsdtRepository } from "./in-memory-rsdt-repository";

/** テスト用の検索用インデックス。メモリ上の配列を使う（条件の意味は InMemoryRsdtRepository と同じ） */
export class InMemoryRsdtSearchIndex implements RsdtSearchIndex {
  constructor(
    private readonly rows: Rsdt[] = [],
    private readonly index: string | null = "rsdt_20261121-215617",
    private readonly fail = false,
  ) {}

  private async sorted(c: RsdtSearchCriteria): Promise<Rsdt[]> {
    if (this.fail) throw new SearchIndexError("接続できません（テスト）");
    const repo = new InMemoryRsdtRepository(this.rows);
    return repo.findMany(c, 0, Number.MAX_SAFE_INTEGER);
  }

  async page(c: RsdtSearchCriteria, { size, after, desc }: { size: number; after?: string; desc?: boolean }): Promise<SearchIndexPage> {
    const all = await this.sorted(c);
    const picked = desc
      ? all.filter((r) => !after || rsdtKeyToId(r) < after).slice(-size)
      : all.filter((r) => !after || rsdtKeyToId(r) > after).slice(0, size);
    return { rows: picked, total: all.length, index: picked.length ? this.index : null };
  }

  async countBefore(c: RsdtSearchCriteria, key: string): Promise<number> {
    return (await this.sorted(c)).filter((r) => rsdtKeyToId(r) < key).length;
  }

  async indexName(): Promise<string | null> {
    return this.index;
  }
}
