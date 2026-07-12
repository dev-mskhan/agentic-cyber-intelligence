import env from "../config/env.js";
import { withCache } from "./cache.js";
import logger from "../config/logger.js";

const NVD_CVE_BASE_URL = "https://services.nvd.nist.gov/rest/json/cves/2.0";

export interface NvdCveItem {
  cve: {
    id: string;
    descriptions: { lang: string; value: string }[];
    published: string;
    metrics?: {
      cvssMetricV31?: { cvssData: { baseScore: number; baseSeverity: string } }[];
      cvssMetricV30?: { cvssData: { baseScore: number; baseSeverity: string } }[];
      cvssMetricV2?: { cvssData: { baseScore: number }; baseSeverity: string }[];
    };
  };
}

interface NvdCveApiResponse {
  vulnerabilities: NvdCveItem[];
  totalResults: number;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Finds CVEs affecting a given CPE match string (vendor:product, optionally :version)
export async function fetchCvesByCpe(cpeMatchString: string): Promise<NvdCveItem[]> {
  const cacheKey = `nvd:cve:cpe:${cpeMatchString}`;

  return withCache(cacheKey, 60 * 60 * 4, async () => {
    const url = `${NVD_CVE_BASE_URL}?cpeName=${encodeURIComponent(cpeMatchString)}&resultsPerPage=50`;
    const headers: Record<string, string> = {};
    if (env.nvdApiKey) headers["apiKey"] = env.nvdApiKey;

    const res = await fetch(url, { headers });

    if (res.status === 403 || res.status === 429) {
      logger.warn({ cpeMatchString }, "NVD CVE (CPE) rate limit hit, backing off");
      await sleep(env.nvdApiKey ? 1000 : 6500);
      return [];
    }

    if (!res.ok) {
      logger.error({ cpeMatchString, status: res.status }, "NVD CVE (CPE) lookup failed");
      return [];
    }

    const data = (await res.json()) as NvdCveApiResponse;
    return data.vulnerabilities ?? [];
  });
}

// Fallback for inventory items with no catalogRef (manually typed products) —
// searches NVD by free-text keyword instead of a structured CPE match.
// Less precise than fetchCvesByCpe, but ensures manually-entered systems
// still get real CVE coverage instead of being skipped entirely.
export async function fetchCvesByKeyword(keyword: string): Promise<NvdCveItem[]> {
  const cacheKey = `nvd:cve:keyword:${keyword.toLowerCase().trim()}`;

  return withCache(cacheKey, 60 * 60 * 4, async () => {
    const url = `${NVD_CVE_BASE_URL}?keywordSearch=${encodeURIComponent(keyword)}&resultsPerPage=20`;
    const headers: Record<string, string> = {};
    if (env.nvdApiKey) headers["apiKey"] = env.nvdApiKey;

    const res = await fetch(url, { headers });

    if (res.status === 403 || res.status === 429) {
      logger.warn({ keyword }, "NVD CVE (keyword) rate limit hit, backing off");
      await sleep(env.nvdApiKey ? 1000 : 6500);
      return [];
    }

    if (!res.ok) {
      logger.error({ keyword, status: res.status }, "NVD CVE (keyword) lookup failed");
      return [];
    }

    const data = (await res.json()) as NvdCveApiResponse;
    return data.vulnerabilities ?? [];
  });
}

export function extractCvssScore(item: NvdCveItem): { score: number; severity: string } | null {
  const metrics = item.cve.metrics;
  const v31 = metrics?.cvssMetricV31?.[0]?.cvssData;
  if (v31) return { score: v31.baseScore, severity: v31.baseSeverity.toLowerCase() };

  const v30 = metrics?.cvssMetricV30?.[0]?.cvssData;
  if (v30) return { score: v30.baseScore, severity: v30.baseSeverity.toLowerCase() };

  const v2 = metrics?.cvssMetricV2?.[0];
  if (v2) return { score: v2.cvssData.baseScore, severity: v2.baseSeverity.toLowerCase() };

  return null;
}
