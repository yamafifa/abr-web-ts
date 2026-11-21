import type { Rsdt } from "./rsdt";
import type { RsdtSearchCriteria } from "./rsdt-repository";

/** 検索用インデックスから取った 1 ページ分（主キー順） */
export type SearchIndexPage = {
  rows: Rsdt[];
  /** 条件に合う全件数 */
  total: number;
  /** 検索したインデックスの名前（例：rsdt_20261121-215617）。0 件のときは null のことがある */
  index: string | null;
};

/**
 * 住居の検索用インデックス（Elasticsearch など）。DB のコピーなので、読むだけ
 * ここではできることだけを決め、実装は infrastructure に置く
 */
export interface RsdtSearchIndex {
  /**
   * 条件に合うものを、主キー（rsdtKeyToId の文字列）の順に size 件まで
   * - after があれば、そのキーより後ろ（desc のときは手前）から
   * - desc のときは逆順に取り、主キー順に並べ直して返す
   */
  page(criteria: RsdtSearchCriteria, opts: { size: number; after?: string; desc?: boolean }): Promise<SearchIndexPage>;
  /** 条件に合うもののうち、主キーが key より前の件数 */
  countBefore(criteria: RsdtSearchCriteria, key: string): Promise<number>;
  /** 今のインデックスの名前（無ければ null） */
  indexName(): Promise<string | null>;
}

/** 検索用インデックスに接続できない・インデックスが無い */
export class SearchIndexError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SearchIndexError";
  }
}
