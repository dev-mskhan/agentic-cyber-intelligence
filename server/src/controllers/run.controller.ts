import type { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/apiResponse.js";
import { runService } from "../services/run.service.js";
import redisConnection from "../config/redis.js";
import type { JwtPayload } from "../utils/generateToken.js";

export const startRun = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = (req as any).organizationId as string;
  const userId = ((req as any).user as JwtPayload).id;
  const run = await runService.startManualRun(organizationId, userId);
  res.status(201).json(new ApiResponse(201, run, "Run started"));
});

export const stopRun = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = (req as any).organizationId as string;
  const run = await runService.stopRun(organizationId, req.params.id as string);
  res.json(new ApiResponse(200, run, "Run stopped"));
});

export const listRuns = asyncHandler(async (req: Request, res: Response) => {
  const runs = await runService.list((req as any).organizationId as string);
  res.json(new ApiResponse(200, runs, "Runs fetched"));
});

export const getRun = asyncHandler(async (req: Request, res: Response) => {
  const run = await runService.getById((req as any).organizationId as string, req.params.id as string);
  res.json(new ApiResponse(200, run, "Run fetched"));
});

// Server-Sent Events — live run status via Redis pub/sub, published by the worker
export const streamRunStatus = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = (req as any).organizationId as string;
  const runId = req.params.id as string;

  // confirm the run belongs to this org before subscribing
  await runService.getById(organizationId, runId);

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.write(`event: connected\ndata: {}\n\n`);

  const subscriber = redisConnection.duplicate();
  const channel = `run:${runId}:progress`;
  await subscriber.subscribe(channel);

  subscriber.on("message", (_ch, message) => {
    res.write(`event: progress\ndata: ${message}\n\n`);
    try {
      const parsed = JSON.parse(message);
      if (parsed.status === "completed" || parsed.status === "failed") {
        res.write(`event: done\ndata: ${message}\n\n`);
        cleanup();
      }
    } catch {}
  });

  const heartbeat = setInterval(() => res.write(`: heartbeat\n\n`), 15_000);

  const cleanup = () => {
    clearInterval(heartbeat);
    subscriber.unsubscribe(channel);
    subscriber.quit();
    res.end();
  };

  req.on("close", cleanup);
});
