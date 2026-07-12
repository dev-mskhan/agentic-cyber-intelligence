import env from "../config/env.js";
import logger from "../config/logger.js";

const NVD_BASE_URL = "https://services.nvd.nist.gov/rest/json/cpes/2.0";

export interface CpeApiProduct {
  cpe: {
    cpeName: string;
    titles?: { title: string; lang: string }[];
  };
}

interface CpeApiResponse {
  products: CpeApiProduct[];
  totalResults: number;
}

export interface ParsedCatalogEntry {
  vendor: string;
  product: string;
  cpeName: string;
  commonVersions: string[];
}

const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

function parseCpeName(cpeName: string) {
  const parts = cpeName.split(":");
  const vendor = parts[3]?.replace(/_/g, " ") ?? "unknown";
  const product = parts[4]?.replace(/_/g, " ") ?? "unknown";
  const version = parts[5];
  return {
    vendor,
    product,
    version: version && version !== "*" ? version : undefined,
  };
}

export async function fetchCpesFromNvd(
  keyword: string,
): Promise<CpeApiProduct[]> {
  const url = `${NVD_BASE_URL}?keywordSearch=${encodeURIComponent(keyword)}&resultsPerPage=100`;

  const headers: Record<string, string> = {};
  if (env.nvdApiKey) headers["apiKey"] = env.nvdApiKey;

  const res = await fetch(url, { headers });

  if (res.status === 403 || res.status === 429) {
    logger.warn({ keyword }, "NVD rate limit hit during live lookup");
    return []; // fail soft — live fallback is best-effort, don't block the user's search
  }

  if (!res.ok) {
    logger.error({ keyword, status: res.status }, "NVD live lookup failed");
    return [];
  }

  const data = (await res.json()) as CpeApiResponse;
  return data.products ?? [];
}

// groups raw CPE products into vendor/product entries with collected versions —
// same grouping logic as the seed script, extracted here so both share it
export function groupCpeProducts(
  products: CpeApiProduct[],
): ParsedCatalogEntry[] {
  const grouped = new Map<
    string,
    { vendor: string; product: string; versions: Set<string> }
  >();

  for (const { cpe } of products) {
    const { vendor, product, version } = parseCpeName(cpe.cpeName);
    const key = `${vendor}:${product}`;

    if (!grouped.has(key)) {
      grouped.set(key, {
        vendor: titleCase(vendor),
        product: titleCase(product),
        versions: new Set(),
      });
    }
    if (version) grouped.get(key)!.versions.add(version);
  }

  return Array.from(grouped.entries()).map(([key, entry]) => ({
    vendor: entry.vendor,
    product: entry.product,
    cpeName: key,
    commonVersions: Array.from(entry.versions)
      .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
      .slice(0, 15),
  }));
}
