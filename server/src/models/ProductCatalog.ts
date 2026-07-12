import { Schema, model } from "mongoose";
import type { IProductCatalog } from "../types/productCatalog.types.js";

const ProductCatalogSchema = new Schema<IProductCatalog>({
  vendor: { type: String, required: true, index: true },
  product: { type: String, required: true, index: true },
  cpeName: { type: String, required: true, unique: true },
  commonVersions: { type: [String], default: [] },
  category: { type: String },
});

ProductCatalogSchema.index({ vendor: "text", product: "text" });

export default model<IProductCatalog>("ProductCatalog", ProductCatalogSchema);
