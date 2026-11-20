import { DeleteRsdt } from "@/application/rsdt/delete-rsdt";
import { GetRsdt } from "@/application/rsdt/get-rsdt";
import { SearchRsdt } from "@/application/rsdt/search-rsdt";
import { UpdateRsdt } from "@/application/rsdt/update-rsdt";
import { prisma } from "@/infrastructure/prisma/client";
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
