import { listHref, parseListQuery, type ListQuery } from "./search-params";

/**
 * Elasticsearch 検索の画面の URL が表す状態（検索条件・1 ページの件数・どこから表示するか）
 * ページ番号の代わりに、主キーの文字列（キー）でページを送る（search_after）
 * - after：このキーの次から 1 ページ分（「次へ」）
 * - before：このキーの手前の 1 ページ分（「前へ」）
 * - last：最後の 1 ページ分（「最後へ」）
 * - どれも無ければ、先頭から 1 ページ分
 */
export type EsListQuery = Omit<ListQuery, "page"> & { after?: string; before?: string; last?: boolean };

type RawParams = Record<string, string | string[] | undefined>;

/** キーの形（例：131016_0001001_006_001_）。おかしな値は無視する */
const KEY_FORMAT = /^\d{6}_\d{7}_\d{3}_\d{3}_(\d{5})?$/;

const key = (v: string | string[] | undefined) => (typeof v === "string" && KEY_FORMAT.test(v) ? v : undefined);

/** URL のクエリを Elasticsearch 検索の状態にする（検索条件と件数の読み方は DB 検索と同じ） */
export function parseEsListQuery(sp: RawParams): EsListQuery {
  const { criteria, perPage } = parseListQuery(sp);
  return { criteria, perPage, after: key(sp.after), before: key(sp.before), last: sp.last === "1" || undefined };
}

/** Elasticsearch 検索の状態を URL にする（空の条件・既定値は省く） */
export function esListHref(q: EsListQuery): string {
  const p = new URLSearchParams(listHref({ criteria: q.criteria, perPage: q.perPage, page: 1 }).slice(2));
  if (q.after) p.set("after", q.after);
  if (q.before) p.set("before", q.before);
  if (q.last) p.set("last", "1");
  const s = p.toString();
  return s ? `/es?${s}` : "/es";
}

/** インデックスの名前（rsdt_20261121-215617）から、作った日時を読む */
export function indexBuiltAt(index: string | null): string | null {
  const m = index?.match(/_(\d{4})(\d\d)(\d\d)-(\d\d)(\d\d)(\d\d)$/);
  return m ? `${m[1]}-${m[2]}-${m[3]} ${m[4]}:${m[5]}:${m[6]}` : null;
}
