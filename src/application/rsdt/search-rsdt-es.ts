import type { Rsdt } from "@/domain/rsdt/rsdt";
import { rsdtKeyToId } from "@/domain/rsdt/rsdt-key";
import type { RsdtSearchCriteria } from "@/domain/rsdt/rsdt-repository";
import { SearchIndexError, type RsdtSearchIndex } from "@/domain/rsdt/rsdt-search-index";

export type SearchRsdtEsInput = {
  criteria: RsdtSearchCriteria;
  perPage: number;
  /** このキーの次から 1 ページ分（「次へ」） */
  after?: string;
  /** このキーの手前の 1 ページ分（「前へ」） */
  before?: string;
  /** 最後の 1 ページ分（「最後へ」） */
  last?: boolean;
};

export type SearchRsdtEsOutput = {
  rows: Rsdt[];
  total: number;
  /** このページの先頭が何件目か（0 件なら 0） */
  from: number;
  /** 「前へ」「次へ」のリンクに使うキー。null ならそちらにページは無い */
  prevKey: string | null;
  nextKey: string | null;
  /** 検索したインデックスの名前（rsdt_日時） */
  index: string | null;
  /** 失敗したときの文 */
  error: string | null;
};

/**
 * 検索用インデックス（Elasticsearch）で住居を検索して、1 ページ分を返す
 * ページ番号ではなく、主キーの続きから取る（search_after）。Elasticsearch は先頭から 10,000 件より先へページ番号で進めないため
 */
export class SearchRsdtEs {
  constructor(private readonly index: RsdtSearchIndex) {}

  async execute({ criteria, perPage, after, before, last }: SearchRsdtEsInput): Promise<SearchRsdtEsOutput> {
    if (!Number.isInteger(perPage) || perPage < 1) throw new RangeError(`perPage が正しくありません: ${perPage}`);
    try {
      let page = await this.index.page(criteria, { size: perPage, after: after ?? before, desc: !!before || !!last });
      // 「前へ」で 1 ページに満たなかったら、先頭まで来ているので、先頭の 1 ページを出す
      if (before && page.rows.length < perPage) page = await this.index.page(criteria, { size: perPage });

      const { rows, total } = page;
      const firstKey = rows.length ? rsdtKeyToId(rows[0]) : null;
      // このページより前に何件あるか（何件目からかを出すため）
      const beforeCount = firstKey ? await this.index.countBefore(criteria, firstKey) : 0;
      return {
        rows,
        total,
        from: rows.length ? beforeCount + 1 : 0,
        prevKey: beforeCount > 0 ? firstKey : null,
        nextKey: beforeCount + rows.length < total ? rsdtKeyToId(rows[rows.length - 1]) : null,
        index: page.index ?? (await this.index.indexName()),
        error: null,
      };
    } catch (e) {
      if (!(e instanceof SearchIndexError)) throw e;
      return { rows: [], total: 0, from: 0, prevKey: null, nextKey: null, index: null, error: e.message };
    }
  }
}
