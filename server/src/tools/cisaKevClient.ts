import { withCache } from "./cache.js";
import logger from "../config/logger.js";

const KEV_URL =
  "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json";

export interface KevEntry {
  cveID: string;
  vendorProject: string;
  product: string;
  vulnerabilityName: string;
  dateAdded: string;
  dueDate: string;
  requiredAction: string;
}

interface KevFeed {
  vulnerabilities: KevEntry[];
}

// Cache the entire KEV catalog (it's a single feed, not per-query) — refresh every 4h
let kevIndexPromise: Promise<Map<string, KevEntry>> | null = null;

async function fetchKevCatalog(): Promise<Map<string, KevEntry>> {
  return withCache("cisa:kev:catalog", 60 * 60 * 4, async () => {
    try {
      const res = await fetch(KEV_URL);
      if (!res.ok) {
        logger.error({ status: res.status }, "CISA KEV fetch failed");
        return [];
      }
      const data = (await res.json()) as KevFeed;
      return data.vulnerabilities;
    } catch (err) {
      logger.error({ err }, "CISA KEV fetch error");
      return [];
    }
  }).then((entries) => new Map(entries.map((e) => [e.cveID, e])));
}

export async function isKnownExploited(
  cveId: string,
): Promise<KevEntry | null> {
  if (!kevIndexPromise) kevIndexPromise = fetchKevCatalog();
  const index = await kevIndexPromise;
  return index.get(cveId) ?? null;
}
