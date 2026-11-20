import type { RsdtKey } from "./rsdt-key";

/** 主キー以外の 17 列。値が無いものは null */
export type RsdtAttributes = {
  city: string;
  ward: string | null;
  oazaCho: string | null;
  chome: string | null;
  koaza: string | null;
  machiazaDist: string | null;
  blkNum: string | null;
  rsdtNum: string | null;
  rsdtNum2: string | null;
  basicRsdtDiv: string | null;
  rsdtAddrFlg: string | null;
  rsdtAddrMtdCode: string | null;
  statusFlg: string | null;
  /** 日付は YYYY-MM-DD の文字列で持つ（時刻やタイムゾーンを持ち込まないため） */
  efctDate: string | null;
  abltDate: string | null;
  srcCode: string | null;
  remarks: string | null;
};

/** 住居表示-住居マスターの 1 行（エンティティ） */
export type Rsdt = RsdtKey & RsdtAttributes;
