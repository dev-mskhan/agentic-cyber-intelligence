import type { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/apiResponse.js";
import { technologyService } from "../services/technology.service.js";
import { productCatalogRepository } from "../repositories/productCatalog.repository.js";
import logger from "../config/logger.js";

export const addTechnology = asyncHandler(
  async (req: Request, res: Response) => {
    const row = await technologyService.addOne(
      (req as any).organizationId! as string,
      req.body,
    );
    res.status(201).json(new ApiResponse(201, row, "Technology added"));
  },
);

export const bulkAddTechnology = asyncHandler(
  async (req: Request, res: Response) => {
    const rows = await technologyService.addBulk(
      (req as any).organizationId! as string,
      req.body.rows,
    );
    res
      .status(201)
      .json(new ApiResponse(201, rows, "Technology entries added"));
  },
);

export const listTechnology = asyncHandler(
  async (req: Request, res: Response) => {
    const rows = await technologyService.list(
      (req as any).organizationId! as string,
    );
    res.json(new ApiResponse(200, rows, "Technology inventory fetched"));
  },
);

export const removeTechnology = asyncHandler(
  async (req: Request, res: Response) => {
    await technologyService.remove(
      (req as any).organizationId! as string,
      req.params.id as string,
    );
    res.json(new ApiResponse(200, null, "Technology entry removed"));
  },
);

export const searchCatalog = asyncHandler(
  async (req: Request, res: Response) => {
    const { results, refreshTriggered } = await technologyService.search(
      req.query.q as string,
    );
    res.json(
      new ApiResponse(
        200,
        { results, refreshTriggered },
        "Catalog search results",
      ),
    );
  },
);
