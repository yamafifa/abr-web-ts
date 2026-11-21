import type { Rsdt } from "@/domain/rsdt/rsdt";
import type { RsdtSearchCriteria } from "@/domain/rsdt/rsdt-repository";
import { SearchIndexError, type RsdtSearchIndex, type SearchIndexPage } from "@/domain/rsdt/rsdt-search-index";
import { fold } from "@/infrastructure/elasticsearch/fold";

/** AP が検索に使う別名（abr-batch の es:index が rsdt_日時 のインデックスに付ける） */
const ALIAS = "rsdt";

/** 部分一致で探す条件 → 列（どれかに当たればよい） */
const WILDCARD_FIELDS = { city: ["city", "ward"], town: ["oaza_cho", "koaza"], chome: ["chome"] } as const;
/** 完全一致で探す条件 → 列 */
const EXACT_FIELDS = { blkNum: "blk_num", rsdtNum: "rsdt_num" } as const;

/** wildcard の特別な文字（* ? \）を、ただの文字として探す */
const escapeWildcard = (s: string) => s.replace(/[\\*?]/g, (c) => `\\${c}`);

/**
 * 検索条件を Elasticsearch の filter にする
 * 文字は fold でそろえてから探す（MySQL の utf8mb4_unicode_ci と同じように見つけるため）
 */
export function buildFilters(c: RsdtSearchCriteria): object[] {
  const filters: object[] = [];
  for (const [prop, cols] of Object.entries(WILDCARD_FIELDS) as [keyof typeof WILDCARD_FIELDS, readonly string[]][]) {
    if (!c[prop]) continue;
    const value = `*${escapeWildcard(fold(c[prop]))}*`;
    filters.push({
      bool: { should: cols.map((col) => ({ wildcard: { [`fold.${col}`]: { value } } })), minimum_should_match: 1 },
    });
  }
  for (const [prop, col] of Object.entries(EXACT_FIELDS) as [keyof typeof EXACT_FIELDS, string][]) {
    if (c[prop]) filters.push({ term: { [`fold.${col}`]: fold(c[prop]) } });
  }
  return filters;
}

/** インデックスの 1 件（列名は DB と同じ snake_case） */
type Source = Record<string, string | null>;

function toEntity(s: Source): Rsdt {
  return {
    lgCode: s.lg_code ?? "",
    machiazaId: s.machiaza_id ?? "",
    blkId: s.blk_id ?? "",
    rsdtId: s.rsdt_id ?? "",
    rsdt2Id: s.rsdt2_id ?? "",
    city: s.city ?? "",
    ward: s.ward,
    oazaCho: s.oaza_cho,
    chome: s.chome,
    koaza: s.koaza,
    machiazaDist: s.machiaza_dist,
    blkNum: s.blk_num,
    rsdtNum: s.rsdt_num,
    rsdtNum2: s.rsdt_num2,
    basicRsdtDiv: s.basic_rsdt_div,
    rsdtAddrFlg: s.rsdt_addr_flg,
    rsdtAddrMtdCode: s.rsdt_addr_mtd_code,
    statusFlg: s.status_flg,
    efctDate: s.efct_date,
    abltDate: s.ablt_date,
    srcCode: s.src_code,
    remarks: s.remarks,
  };
}

type SearchResponse = { hits: { total: { value: number }; hits: { _index: string; _source: Source }[] } };

/**
 * Elasticsearch（abr-batch の es:index で作ったインデックス）で住居を探す
 * 公式のクライアントは入れず、fetch で REST API を呼ぶ。接続先は .env の ES_URL（無ければ http://127.0.0.1:9200）
 */
export class ElasticsearchRsdtSearchIndex implements RsdtSearchIndex {
  private readonly url: string;

  constructor(url: string = process.env.ES_URL ?? "http://127.0.0.1:9200") {
    this.url = url.replace(/\/+$/, "");
  }

  private async request<T>(path: string, body?: object): Promise<T> {
    let res: Response;
    try {
      res = await fetch(`${this.url}${path}`, {
        method: body ? "POST" : "GET",
        headers: body ? { "Content-Type": "application/json" } : {},
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(10_000),
        cache: "no-store",
      });
    } catch (e) {
      throw new SearchIndexError(`Elasticsearch に接続できません（${this.url}）: ${e instanceof Error ? e.message : e}`);
    }
    if (res.status === 404) {
      throw new SearchIndexError(`Elasticsearch にインデックス ${ALIAS} がありません。abr-batch で npm run es:index を実行してください`);
    }
    if (!res.ok) throw new SearchIndexError(`Elasticsearch が ${res.status} を返しました: ${(await res.text()).slice(0, 300)}`);
    return (await res.json()) as T;
  }

  async page(criteria: RsdtSearchCriteria, { size, after, desc }: { size: number; after?: string; desc?: boolean }): Promise<SearchIndexPage> {
    const res = await this.request<SearchResponse>(`/${ALIAS}/_search`, {
      track_total_hits: true,
      size,
      sort: [{ key: desc ? "desc" : "asc" }],
      query: { bool: { filter: buildFilters(criteria) } },
      ...(after ? { search_after: [after] } : {}),
    });
    const hits = desc ? [...res.hits.hits].reverse() : res.hits.hits;
    return { rows: hits.map((h) => toEntity(h._source)), total: res.hits.total.value, index: res.hits.hits[0]?._index ?? null };
  }

  async countBefore(criteria: RsdtSearchCriteria, key: string): Promise<number> {
    const res = await this.request<{ count: number }>(`/${ALIAS}/_count`, {
      query: { bool: { filter: [...buildFilters(criteria), { range: { key: { lt: key } } }] } },
    });
    return res.count;
  }

  async indexName(): Promise<string | null> {
    const res = await this.request<Record<string, unknown>>(`/_alias/${ALIAS}`);
    return Object.keys(res)[0] ?? null;
  }
}
