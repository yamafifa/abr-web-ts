import { Prisma, type PrismaClient, type RsdtdspRsdt } from "@/generated/prisma/client";
import { RsdtNotFoundError } from "@/domain/rsdt/errors";
import type { Rsdt, RsdtAttributes } from "@/domain/rsdt/rsdt";
import type { RsdtKey } from "@/domain/rsdt/rsdt-key";
import type { RsdtRepository, RsdtSearchCriteria } from "@/domain/rsdt/rsdt-repository";

/** PrismaClient でも、トランザクションの中のクライアントでも使えるように、必要な部分だけ受け取る */
type Db = Pick<PrismaClient, "rsdtdspRsdt">;

const ORDER_BY_KEY: Prisma.RsdtdspRsdtOrderByWithRelationInput[] = [
  { lgCode: "asc" },
  { machiazaId: "asc" },
  { blkId: "asc" },
  { rsdtId: "asc" },
  { rsdt2Id: "asc" },
];

/** LIKE の特別な文字（% _ \）を、ただの文字として探すようにする（Prisma の contains はそのまま LIKE に渡すため） */
export const escapeLike = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

/** DATE 列は UTC の 0 時として読み書きする */
const dateToString = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null);
const stringToDate = (s: string | null) => (s ? new Date(`${s}T00:00:00Z`) : null);

function toEntity(r: RsdtdspRsdt): Rsdt {
  return { ...r, efctDate: dateToString(r.efctDate), abltDate: dateToString(r.abltDate) };
}

function toData(a: RsdtAttributes): Prisma.RsdtdspRsdtUpdateInput {
  return { ...a, efctDate: stringToDate(a.efctDate), abltDate: stringToDate(a.abltDate) };
}

const whereKey = (key: RsdtKey): Prisma.RsdtdspRsdtWhereUniqueInput => ({
  lgCode_machiazaId_blkId_rsdtId_rsdt2Id: key,
});

/** 部分一致はインデックスが効かないので、全件を読む（全件 175 万件で約 1 秒） */
export function buildWhere(c: RsdtSearchCriteria): Prisma.RsdtdspRsdtWhereInput {
  const and: Prisma.RsdtdspRsdtWhereInput[] = [];
  if (c.city) {
    const city = escapeLike(c.city);
    and.push({ OR: [{ city: { contains: city } }, { ward: { contains: city } }] });
  }
  if (c.town) {
    const town = escapeLike(c.town);
    and.push({ OR: [{ oazaCho: { contains: town } }, { koaza: { contains: town } }] });
  }
  if (c.chome) and.push({ chome: { contains: escapeLike(c.chome) } });
  if (c.blkNum) and.push({ blkNum: c.blkNum });
  if (c.rsdtNum) and.push({ rsdtNum: c.rsdtNum });
  return and.length ? { AND: and } : {};
}

/** 対象の行が無いときに Prisma が投げるエラーか */
const isNotFound = (e: unknown) =>
  e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025";

export class PrismaRsdtRepository implements RsdtRepository {
  constructor(private readonly db: Db) {}

  count(criteria: RsdtSearchCriteria): Promise<number> {
    return this.db.rsdtdspRsdt.count({ where: buildWhere(criteria) });
  }

  async findMany(criteria: RsdtSearchCriteria, offset: number, limit: number): Promise<Rsdt[]> {
    const rows = await this.db.rsdtdspRsdt.findMany({
      where: buildWhere(criteria),
      orderBy: ORDER_BY_KEY,
      skip: offset,
      take: limit,
    });
    return rows.map(toEntity);
  }

  async findByKey(key: RsdtKey): Promise<Rsdt | null> {
    const row = await this.db.rsdtdspRsdt.findUnique({ where: whereKey(key) });
    return row ? toEntity(row) : null;
  }

  async update(key: RsdtKey, attributes: RsdtAttributes): Promise<void> {
    try {
      await this.db.rsdtdspRsdt.update({ where: whereKey(key), data: toData(attributes) });
    } catch (e) {
      throw isNotFound(e) ? new RsdtNotFoundError(key) : e;
    }
  }

  async delete(key: RsdtKey): Promise<void> {
    try {
      await this.db.rsdtdspRsdt.delete({ where: whereKey(key) });
    } catch (e) {
      throw isNotFound(e) ? new RsdtNotFoundError(key) : e;
    }
  }
}
