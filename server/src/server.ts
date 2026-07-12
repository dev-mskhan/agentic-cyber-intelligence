import "dotenv/config";
import mongoose from "mongoose";
import http from "http";
import app from "./app.js";
import env from "./config/env.js";
import logger from "./config/logger.js";
import { initSocketServer } from "./config/socket.js";
import { startEventBusSubscriber } from "./events/eventBus.js";
import "./jobs/emailWorker.js";
import "./jobs/catalogWorker.js";
import "./jobs/runWorker.js";

const server = http.createServer(app);

initSocketServer(server);
startEventBusSubscriber();

const startServer = async () => {
  try {
    await mongoose.connect(env.mongodbUri);
    logger.info("MongoDB connected");

    server.listen(env.port, () => {
      logger.info(`Server running on port ${env.port} [${env.nodeEnv}]`);
    });
  } catch (err) {
    logger.error({ err }, "Failed to start server");
    process.exit(1);
  }
};

startServer();

const shutdown = async (signal: string) => {
  logger.info(`${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    logger.info("HTTP server closed");
    try {
      await mongoose.connection.close();
      logger.info("MongoDB connection closed");
    } catch (err) {
      logger.error({ err }, "Error closing MongoDB connection");
    }
    process.exit(0);
  });
  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10_000).unref();
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (reason) => logger.error({ err: reason }, "Unhandled Promise Rejection"));
process.on("uncaughtException", (err) => {
  logger.error({ err }, "Uncaught Exception");
  process.exit(1);
});
