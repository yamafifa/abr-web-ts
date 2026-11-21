import { DeleteRsdt } from "@/application/rsdt/delete-rsdt";
import { GetRsdt } from "@/application/rsdt/get-rsdt";
import { SearchRsdt } from "@/application/rsdt/search-rsdt";
import { SearchRsdtEs } from "@/application/rsdt/search-rsdt-es";
import { UpdateRsdt } from "@/application/rsdt/update-rsdt";
import { prisma } from "@/infrastructure/prisma/client";
import { ElasticsearchRsdtSearchIndex } from "@/infrastructure/rsdt/elasticsearch-rsdt-search-index";
import { PrismaRsdtRepository } from "@/infrastructure/rsdt/prisma-rsdt-repository";

/**
 * 部品を組み立てる場所（composition root）
 * どのリポジトリを使うかを決めるのはここだけ。画面（app/）はここからユースケースを受け取る
 */
const rsdtRepository = new PrismaRsdtRepository(prisma);

export const searchRsdt = new SearchRsdt(rsdtRepository);
export const getRsdt = new GetRsdt(rsdtRepository);
export const updateRsdt = new UpdateRsdt(rsdtRepository);
export const deleteRsdt = new DeleteRsdt(rsdtRepository);

/** Elasticsearch 検索（abr-batch の es:index で作ったインデックス） */
export const searchRsdtEs = new SearchRsdtEs(new ElasticsearchRsdtSearchIndex());
