import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import logger from "./config/logger.js";
import env from "./config/env.js";
import errorHandler from "./middlewares/errorHandler.js";
import ApiError from "./utils/apiError.js";
import appRouter from "./routes.js";
import webhookRoutes from "./routes/webhook.routes.js";
import type { Request, Response, NextFunction } from "express";

const app = express();

// --- security & parsing middleware ---
app.use(helmet());
app.use(
  cors({
    origin: true,
    credentials: true, // required so cookies (access_token/refresh_token) are sent
  }),
);
// Stripe webhook
app.use(
  "/api/webhooks",
  express.raw({ type: "application/json" }),
  webhookRoutes,
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(env.cookieSecret)); // needed for req.signedCookies used in auth

// --- request logging ---
app.use(
  pinoHttp({
    logger,
    customLogLevel: (req, res, err) => {
      if (err || res.statusCode >= 500) return "silent"; // errorHandler logs these
      if (res.statusCode >= 400) return "warn";
      return "info";
    },
    serializers: {
      req: (req) => ({ method: req.method, url: req.url, id: req.id }),
      res: (res) => ({ statusCode: res.statusCode }),
    },
  }),
);

// --- health check (for uptime monitors / load balancers) ---
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// --- routes ---
app.use("/api/v1", appRouter);

// --- 404 handler for unmatched routes ---
app.use((req: Request, _res: Response, next: NextFunction) => {
  next(new ApiError(404, `Route ${req.method} ${req.originalUrl} not found`));
});

// --- centralized error handler — must be last ---
app.use(errorHandler);

export default app;
