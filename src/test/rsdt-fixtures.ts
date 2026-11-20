import type { Rsdt } from "@/domain/rsdt/rsdt";

/** テスト用の住居。指定しなかった列は、千代田区 内幸町一丁目 6-1 の値にする */
export function makeRsdt(overrides: Partial<Rsdt> = {}): Rsdt {
  return {
    lgCode: "131016",
    machiazaId: "0001001",
    blkId: "006",
    rsdtId: "001",
    rsdt2Id: "",
    city: "千代田区",
    ward: null,
    oazaCho: "内幸町",
    chome: "一丁目",
    koaza: null,
    machiazaDist: null,
    blkNum: "6",
    rsdtNum: "1",
    rsdtNum2: null,
    basicRsdtDiv: "0",
    rsdtAddrFlg: "1",
    rsdtAddrMtdCode: "1",
    statusFlg: "0",
    efctDate: "1947-04-17",
    abltDate: null,
    srcCode: "0",
    remarks: null,
    ...overrides,
  };
}
