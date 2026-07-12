import type { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/apiResponse.js";
import { reportService } from "../services/report.service.js";

export const listReports = asyncHandler(async (req: Request, res: Response) => {
  const reports = await reportService.list((req as any).organizationId as string);
  res.json(new ApiResponse(200, reports, "Reports fetched"));
});

export const getReport = asyncHandler(async (req: Request, res: Response) => {
  const detail = await reportService.getFullDetail((req as any).organizationId as string, req.params.id as string);
  res.json(new ApiResponse(200, detail, "Report fetched"));
});

export const downloadReport = asyncHandler(async (req: Request, res: Response) => {
  const markdown = await reportService.generateMarkdown((req as any).organizationId as string, req.params.id as string);
  res.setHeader("Content-Type", "text/markdown");
  res.setHeader("Content-Disposition", `attachment; filename="report-${req.params.id}.md"`);
  res.send(markdown);
});

export const deleteReport = asyncHandler(async (req: Request, res: Response) => {
  await reportService.remove((req as any).organizationId as string, req.params.id as string);
  res.json(new ApiResponse(200, null, "Report deleted"));
});
