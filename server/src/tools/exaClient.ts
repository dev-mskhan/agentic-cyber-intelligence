import env from "../config/env.js";
import { withCache } from "./cache.js";
import logger from "../config/logger.js";

export interface ExaSearchResult {
  title: string;
  url: string;
  publishedDate?: string;
  author?: string;
  text?: string;
  score?: number;
}

interface ExaApiResponse {
  results: ExaSearchResult[];
}

export async function searchExa(query: string, opts: { numResults?: number; startPublishedDate?: string } = {}): Promise<ExaSearchResult[]> {
  const cacheKey = `exa:${query}:${opts.numResults ?? 10}`;

  return withCache(cacheKey, 60 * 30, async () => {
    try {
      const res = await fetch("https://api.exa.ai/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": env.exaApiKey,
        },
        body: JSON.stringify({
          query,
          numResults: opts.numResults ?? 10,
          startPublishedDate: opts.startPublishedDate,
          useAutoprompt: true,
          category: "news",
          contents: { text: { maxCharacters: 1000 } },
        }),
      });

      if (!res.ok) {
        logger.error({ status: res.status, query }, "Exa search failed");
        return [];
      }

      const data = (await res.json()) as ExaApiResponse;
      return data.results ?? [];
    } catch (err) {
      logger.error({ err, query }, "Exa search request error");
      return [];
    }
  });
}
