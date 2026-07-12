import { Redis } from "ioredis";
import env from "./env.js";
import logger from "./logger.js";

const parsedUrl = new URL(env.redisUrl);
const isTls = parsedUrl.protocol === "rediss:";

const redisOptions = {
  host: parsedUrl.hostname,
  port: Number(parsedUrl.port) || 6379,
  password: parsedUrl.password || undefined,
  ...(isTls && { tls: {} }),
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy(times: number) {
    if (times > 10) return null;
    return Math.min(times * 200, 2000);
  },
  reconnectOnError(err: Error) {
    return err.message.includes("ECONNRESET") || err.message.includes("ETIMEDOUT");
  },
};

export const redisConnection = redisOptions;

const redisClient = new Redis(redisOptions);

redisClient.on("error", (err: Error) => {
  logger.error({ error: err }, "Redis error");
});
redisClient.on("ready", () => {
  logger.info("Redis connected");
});

export default redisClient;
