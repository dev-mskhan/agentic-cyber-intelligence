import ProductCatalog from "../models/ProductCatalog.js";
import type { ParsedCatalogEntry } from "../utils/nvdClient.js";
export const productCatalogRepository = {
  search: (query: string, limit = 10) =>
    ProductCatalog.find(
      { $text: { $search: query } },
      { score: { $meta: "textScore" } },
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(limit),

  findById: (id: string) => ProductCatalog.findById(id),
  upsertMany: async (entries: ParsedCatalogEntry[], category?: string) => {
    const ops = entries.map((entry) => ({
      updateOne: {
        filter: { cpeName: entry.cpeName },
        update: {
          $set: {
            vendor: entry.vendor,
            product: entry.product,
            ...(category && { category }),
          },
          $addToSet: { commonVersions: { $each: entry.commonVersions } },
        },
        upsert: true,
      },
    }));
    if (ops.length === 0) return;
    await ProductCatalog.bulkWrite(ops);
  },
};
