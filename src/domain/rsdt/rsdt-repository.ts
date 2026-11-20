import type { Rsdt, RsdtAttributes } from "./rsdt";
import type { RsdtKey } from "./rsdt-key";

/** 検索条件。空文字の条件は使わない */
export type RsdtSearchCriteria = {
  /** city・ward の部分一致 */
  city: string;
  /** oaza_cho・koaza の部分一致 */
  town: string;
  /** chome の部分一致 */
  chome: string;
  /** blk_num の完全一致（値はすべて数字なので、部分一致だと「1」で 10・21 なども出てしまうため） */
  blkNum: string;
  /** rsdt_num の完全一致 */
  rsdtNum: string;
};

export const EMPTY_CRITERIA: RsdtSearchCriteria = { city: "", town: "", chome: "", blkNum: "", rsdtNum: "" };

/**
 * 住居の読み書き（リポジトリ）。ここではできることだけを決め、DB での実装は infrastructure に置く
 */
export interface RsdtRepository {
  /** 条件に合う件数 */
  count(criteria: RsdtSearchCriteria): Promise<number>;
  /** 条件に合うものを主キー順に、offset 件飛ばして limit 件まで */
  findMany(criteria: RsdtSearchCriteria, offset: number, limit: number): Promise<Rsdt[]>;
  findByKey(key: RsdtKey): Promise<Rsdt | null>;
  /** 無ければ RsdtNotFoundError を投げる */
  update(key: RsdtKey, attributes: RsdtAttributes): Promise<void>;
  /** 無ければ RsdtNotFoundError を投げる */
  delete(key: RsdtKey): Promise<void>;
}
