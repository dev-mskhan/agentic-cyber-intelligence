import mongoose from "mongoose";
import ProductCatalog from "../src/models/ProductCatalog.js";
import env from "../src/config/env.js";
import logger from "../src/config/logger.js";

const NVD_BASE_URL = "https://services.nvd.nist.gov/rest/json/cpes/2.0";

// Curated seed queries — the product categories relevant to a
// security-posture / vulnerability-matching tool. Extend this list over time.
const SEED_QUERIES: { keyword: string; category: string }[] = [
  { keyword: "cisco adaptive security appliance", category: "firewall" },
  { keyword: "cisco ios", category: "network_os" },
  { keyword: "cisco firepower", category: "firewall" },
  { keyword: "palo alto networks pan-os", category: "firewall" },
  { keyword: "fortinet fortigate", category: "firewall" },
  { keyword: "microsoft exchange server", category: "email" },
  { keyword: "microsoft windows server", category: "operating_system" },
  { keyword: "microsoft sql server", category: "database" },
  { keyword: "microsoft sharepoint", category: "collaboration" },
  { keyword: "vmware esxi", category: "hypervisor" },
  { keyword: "vmware vcenter", category: "hypervisor" },
  { keyword: "okta", category: "idp" },
  { keyword: "microsoft active directory", category: "idp" },
  { keyword: "amazon web services ec2", category: "cloud" },
  { keyword: "amazon web services s3", category: "cloud" },
  { keyword: "google workspace", category: "cloud" },
  { keyword: "atlassian jira", category: "collaboration" },
  { keyword: "atlassian confluence", category: "collaboration" },
  { keyword: "wordpress", category: "cms" },
  { keyword: "apache http server", category: "web_server" },
  { keyword: "nginx", category: "web_server" },
  { keyword: "docker", category: "container" },
  { keyword: "kubernetes", category: "container" },
  { keyword: "postgresql", category: "database" },
  { keyword: "mysql", category: "database" },
  { keyword: "mongodb", category: "database" },
  { keyword: "redis", category: "database" },
  { keyword: "gitlab", category: "devops" },
  { keyword: "jenkins", category: "devops" },
  { keyword: "citrix netscaler", category: "load_balancer" },
  { keyword: "f5 big-ip", category: "load_balancer" },
  { keyword: "zoom", category: "collaboration" },
  { keyword: "slack", category: "collaboration" },
  { keyword: "salesforce", category: "saas" },
  { keyword: "sap", category: "erp" },
];

interface CpeApiProduct {
  cpe: {
    cpeName: string; // e.g. "cpe:2.3:a:cisco:adaptive_security_appliance:9.16:*:*:*:*:*:*:*"
    titles?: { title: string; lang: string }[];
  };
}

interface CpeApiResponse {
  products: CpeApiProduct[];
  totalResults: number;
}

// Parses a CPE 2.3 formatted string name into structured parts.
// Format: cpe:2.3:part:vendor:product:version:update:edition:language:sw_edition:target_sw:target_hw:other
function parseCpeName(cpeName: string) {
  const parts = cpeName.split(":");
  // parts[0]="cpe", [1]="2.3", [2]=part, [3]=vendor, [4]=product, [5]=version
  const vendor = parts[3]?.replace(/_/g, " ") ?? "unknown";
  const product = parts[4]?.replace(/_/g, " ") ?? "unknown";
  const version = parts[5];
  return {
    vendor,
    product,
    version: version && version !== "*" ? version : undefined,
  };
}

const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchCpesForKeyword(keyword: string): Promise<CpeApiProduct[]> {
  const url = `${NVD_BASE_URL}?keywordSearch=${encodeURIComponent(keyword)}&resultsPerPage=200`;

  const headers: Record<string, string> = {};
  if (env.nvdApiKey) headers["apiKey"] = env.nvdApiKey;

  const res = await fetch(url, { headers });

  if (res.status === 403 || res.status === 429) {
    logger.warn({ keyword }, "NVD rate limit hit, backing off 30s");
    await sleep(30_000);
    return fetchCpesForKeyword(keyword); // retry once after backoff
  }

  if (!res.ok) {
    logger.error({ keyword, status: res.status }, "NVD API request failed");
    return [];
  }

  const data = (await res.json()) as CpeApiResponse;
  return data.products ?? [];
}

async function seed() {
  await mongoose.connect(env.mongodbUri);
  logger.info("Connected to MongoDB for seeding");

  // NVD public rate limit (no API key): 5 requests / 30s
  // With an API key: 50 requests / 30s — much faster, get one free at
  // https://nvd.nist.gov/developers/request-an-api-key
  const delayBetweenRequests = env.nvdApiKey ? 700 : 6500;

  let totalUpserted = 0;

  for (const { keyword, category } of SEED_QUERIES) {
    logger.info({ keyword }, "Fetching CPEs");
    const products = await fetchCpesForKeyword(keyword);

    // group parsed entries by vendor+product, collecting distinct versions
    const grouped = new Map<
      string,
      {
        vendor: string;
        product: string;
        cpeName: string;
        versions: Set<string>;
      }
    >();

    for (const { cpe } of products) {
      const { vendor, product, version } = parseCpeName(cpe.cpeName);
      const key = `${vendor}:${product}`;

      if (!grouped.has(key)) {
        grouped.set(key, {
          vendor: titleCase(vendor),
          product: titleCase(product),
          cpeName: `${vendor}:${product}`, // canonical vendor:product form, no version
          versions: new Set(),
        });
      }
      if (version) grouped.get(key)!.versions.add(version);
    }

    for (const entry of grouped.values()) {
      const commonVersions = Array.from(entry.versions)
        .sort((a, b) => b.localeCompare(a, undefined, { numeric: true })) // newest first
        .slice(0, 15); // cap so the dropdown doesn't get huge

      await ProductCatalog.findOneAndUpdate(
        { cpeName: entry.cpeName },
        {
          $set: {
            vendor: entry.vendor,
            product: entry.product,
            category,
          },
          $addToSet: { commonVersions: { $each: commonVersions } },
        },
        { upsert: true, new: true },
      );
      totalUpserted++;
    }

    logger.info(
      { keyword, entriesFound: grouped.size },
      "Upserted catalog entries",
    );
    await sleep(delayBetweenRequests); // respect NVD rate limits between queries
  }

  logger.info({ totalUpserted }, "Product catalog seeding complete");
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  logger.error({ err }, "Seeding failed");
  process.exit(1);
});
