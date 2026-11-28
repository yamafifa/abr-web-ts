import type { RsdtSearchCriteria } from "@/domain/rsdt/rsdt-repository";

/** 一覧の 1 ページの件数として選べる値 */
export const PER_PAGE_OPTIONS = [15, 30, 50, 100] as const;
export const DEFAULT_PER_PAGE = 15;

/** 一覧画面の URL が表す状態 */
export type ListQuery = { criteria: RsdtSearchCriteria; perPage: number; page: number };

type RawParams = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined): string => (Array.isArray(v) ? v[0] : v)?.trim() ?? "";

/** URL のクエリ名 ⇔ 検索条件の項目（URL は短くしたいので、blk・rsdt にしている） */
const PARAM_NAMES = { city: "city", town: "town", chome: "chome", blkNum: "blk", rsdtNum: "rsdt" } as const;
/** 入力の長さの上限（テーブルの列の長さに合わせる） */
const MAX_LENGTH = { city: 80, town: 80, chome: 20, blkNum: 20, rsdtNum: 20 } as const;

/**
 * 半角カナ（U+FF61〜U+FF9F）だけを全角カナにする（「ﾊﾟ」→「パ」）。ほかの文字は変えない
 * - MySQL は「ﾊﾟ」を「ﾊ」と「ﾟ」の 2 文字として探すので、Elasticsearch 検索（fold で 1 文字にする）と件数が合わなくなるため
 * - NFKC を全体にかけると、互換漢字（例：U+FA10 の「塚」）や「①」まで変わるので、半角カナの並びにだけかける
 * - ほかの版（abr-web-rails・abr-web-laravel・abr-web-symfony・abr-web-spring）と abr-batch の es:verify にも同じ処理がある。直すときはすべてを直す
 */
export const zenkakuKana = (s: string): string => s.replace(/[｡-ﾟ]+/g, (m) => m.normalize("NFKC"));

/** URL のクエリを一覧の状態にする。おかしな値は既定値にする。半角カナは全角カナにする */
export function parseListQuery(sp: RawParams): ListQuery {
  const criteria = Object.fromEntries(
    (Object.keys(PARAM_NAMES) as (keyof RsdtSearchCriteria)[]).map((k) => [
      k,
      zenkakuKana(first(sp[PARAM_NAMES[k]])).slice(0, MAX_LENGTH[k]),
    ]),
  ) as RsdtSearchCriteria;
  const per = Number(first(sp.per));
  const page = Number(first(sp.page));
  return {
    criteria,
    perPage: (PER_PAGE_OPTIONS as readonly number[]).includes(per) ? per : DEFAULT_PER_PAGE,
    page: Number.isInteger(page) && page >= 1 ? page : 1,
  };
}

/** 一覧の状態を URL にする（空の条件・既定値は省く） */
export function listHref(q: ListQuery): string {
  const p = new URLSearchParams();
  for (const k of Object.keys(PARAM_NAMES) as (keyof RsdtSearchCriteria)[]) {
    if (q.criteria[k]) p.set(PARAM_NAMES[k], q.criteria[k]);
  }
  if (q.perPage !== DEFAULT_PER_PAGE) p.set("per", String(q.perPage));
  if (q.page > 1) p.set("page", String(q.page));
  const s = p.toString();
  return s ? `/?${s}` : "/";
}
