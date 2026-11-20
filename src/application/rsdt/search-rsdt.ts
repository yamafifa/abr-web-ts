import type { Rsdt } from "@/domain/rsdt/rsdt";
import type { RsdtRepository, RsdtSearchCriteria } from "@/domain/rsdt/rsdt-repository";

export type SearchRsdtInput = {
  criteria: RsdtSearchCriteria;
  /** 1 から始まるページ番号 */
  page: number;
  perPage: number;
};

export type SearchRsdtOutput = {
  rows: Rsdt[];
  total: number;
  /** 実際に表示したページ（最後のページより後ろを指定されたら、最後のページ） */
  page: number;
  /** 0 件のときも 1 */
  totalPages: number;
};

/** 住居を検索して、1 ページ分を返す */
export class SearchRsdt {
  constructor(private readonly repository: RsdtRepository) {}

  async execute({ criteria, page, perPage }: SearchRsdtInput): Promise<SearchRsdtOutput> {
    if (!Number.isInteger(perPage) || perPage < 1) throw new RangeError(`perPage が正しくありません: ${perPage}`);
    const total = await this.repository.count(criteria);
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const current = Math.min(Math.max(1, Math.floor(page) || 1), totalPages);
    const rows = await this.repository.findMany(criteria, (current - 1) * perPage, perPage);
    return { rows, total, page: current, totalPages };
  }
}
