import { rsdtKeyToId, type RsdtKey } from "./rsdt-key";

/** 指定した住居が無い（ほかの画面で消された、など） */
export class RsdtNotFoundError extends Error {
  constructor(readonly key: RsdtKey) {
    super(`住居が見つかりません: ${rsdtKeyToId(key)}`);
    this.name = "RsdtNotFoundError";
  }
}
