/** 主キー 5 列。この 5 つで住居 1 件が決まる */
export type RsdtKey = {
  lgCode: string;
  machiazaId: string;
  blkId: string;
  rsdtId: string;
  /** 空文字のことが多い */
  rsdt2Id: string;
};

const SEPARATOR = "_";

/**
 * 主キーを 1 つの文字列にする（例：131016_0001001_006_001_）
 * URL など、1 つの値で住居を指したいときに使う。rsdt2_id が空なら末尾が "_" で終わる
 */
export function rsdtKeyToId(k: RsdtKey): string {
  return [k.lgCode, k.machiazaId, k.blkId, k.rsdtId, k.rsdt2Id].join(SEPARATOR);
}

/** rsdtKeyToId の逆。形がおかしければ null */
export function rsdtKeyFromId(id: string): RsdtKey | null {
  const parts = id.split(SEPARATOR);
  if (parts.length !== 5) return null;
  const [lgCode, machiazaId, blkId, rsdtId, rsdt2Id] = parts;
  if (!lgCode || !machiazaId || !blkId || !rsdtId) return null;
  return { lgCode, machiazaId, blkId, rsdtId, rsdt2Id };
}
