import env from "../config/env.js";
import { withCache } from "./cache.js";
import logger from "../config/logger.js";

const OTX_BASE_URL = "https://otx.alienvault.com/api/v1";

export interface OtxPulse {
  id: string;
  name: string;
  description: string;
  created: string;
  tags: string[];
  malware_families?: string[];
}

interface OtxSearchResponse {
  results: OtxPulse[];
}

// Searches OTX pulses (threat intel reports) related to a keyword — supplements Exa's general web search
export async function searchOtxPulses(query: string): Promise<OtxPulse[]> {
  const cacheKey = `otx:${query}`;

  return withCache(cacheKey, 60 * 60, async () => {
    try {
      const res = await fetch(
        `${OTX_BASE_URL}/search/pulses?q=${encodeURIComponent(query)}&limit=10`,
        {
          headers: { "X-OTX-API-KEY": env.otxApiKey },
        },
      );

      if (!res.ok) {
        logger.error({ status: res.status, query }, "OTX search failed");
        return [];
      }

      const data = (await res.json()) as OtxSearchResponse;
      return data.results ?? [];
    } catch (err) {
      logger.error({ err, query }, "OTX search error");
      return [];
    }
  });
}
