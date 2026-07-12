import { Worker, type Job } from "bullmq";
import { redisConnection } from "../config/redis.js";
import { fetchCpesFromNvd, groupCpeProducts } from "../utils/nvdClient.js";
import { productCatalogRepository } from "../repositories/productCatalog.repository.js";
import logger from "../config/logger.js";
import type { CatalogRefreshJobData } from "./queue.js";

const catalogWorker = new Worker<CatalogRefreshJobData>(
  "catalogQueue",
  async (job: Job<CatalogRefreshJobData>) => {
    const { query } = job.data;

    const liveProducts = await fetchCpesFromNvd(query);
    if (liveProducts.length === 0) {
      return { query, cached: 0 };
    }

    const grouped = groupCpeProducts(liveProducts);
    await productCatalogRepository.upsertMany(grouped);

    return { query, cached: grouped.length };
  },
  {
    connection: redisConnection,
    concurrency: 2, // NVD is rate-limited, keep this low regardless of email worker's concurrency
    limiter: {
      max: env_nvdApiKeyLimiterMax(), // see note below
      duration: 30_000,
    },
  },
);

// NVD's own rate limits: 5 req/30s without an API key, 50 req/30s with one.
// Keep the worker's own throughput under that ceiling.
function env_nvdApiKeyLimiterMax() {
  return process.env.NVD_API_KEY ? 45 : 4;
}

catalogWorker.on("completed", (job, result) => {
  logger.info({ jobId: job.id, ...result }, "Catalog refresh completed");
});

catalogWorker.on("failed", (job, err) => {
  logger.error(
    { jobId: job?.id, query: job?.data?.query, err },
    "Catalog refresh failed",
  );
});

catalogWorker.on("error", (err) => {
  logger.error({ err }, "Catalog worker error");
});

process.on("SIGTERM", async () => {
  await catalogWorker.close();
});
process.on("SIGINT", async () => {
  await catalogWorker.close();
});

export default catalogWorker;
