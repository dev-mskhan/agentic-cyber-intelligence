import { Document, Types } from "mongoose";

export interface IProductCatalog extends Document {
  _id: Types.ObjectId;
  vendor: string;
  product: string;
  cpeName: string;
  commonVersions: string[];
  category?: string;
}
