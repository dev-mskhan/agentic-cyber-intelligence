// threatIntelligenceAnalystNode.ts
import { searchExa } from "../../tools/exaClient.js";
import { searchOtxPulses } from "../../tools/otxClient.js";
import { llm } from "../llm.js";
import { threatOutputSchema, THREAT_CATEGORIES } from "../schemas.js";
import logger from "../../config/logger.js";
import type { GraphStateType } from "../state.js";
import { updateRunStage } from "../../repositories/run.repository.js";

// Map common near-misses the model tends to produce onto your canonical enum.
const CATEGORY_ALIASES: Record<string, (typeof THREAT_CATEGORIES)[number]> = {
  cyberattack: "other",
  cybersecurity: "other",
  cyberthreat: "other",
  vulnerability: "zero_day",
  breach: "data_breach",
  "data breach": "data_breach",
  "denial of service": "ddos",
  "supply chain": "supply_chain",
  "insider threat": "insider_threat",
};

function normalizeCategory(raw: string): (typeof THREAT_CATEGORIES)[number] {
  const key = raw.trim().toLowerCase();
  if ((THREAT_CATEGORIES as readonly string[]).includes(key)) {
    return key as (typeof THREAT_CATEGORIES)[number];
  }
  return CATEGORY_ALIASES[key] ?? "other";
}

export async function threatIntelligenceAnalystNode(state: GraphStateType): Promise<Partial<GraphStateType>> {
  await updateRunStage(state.runId, "threat_intelligence");
  const industry = state.organization.industry ?? "technology";
  const productNames = [...new Set(state.technologyInventory.map((t: any) => t.product))];
  try {
    const [exaResults, otxResults] = await Promise.all([
      searchExa(`latest cybersecurity threats targeting ${industry} industry`, { numResults: 8 }),
      searchOtxPulses(industry),
    ]);
    const productExaResults = await Promise.all(
      productNames.slice(0, 5).map((p) => searchExa(`${p} security vulnerability threat`, { numResults: 3 }))
    );
    const context = [
      ...exaResults.map((r) => `[Exa] ${r.title} — ${r.text ?? ""} (${r.url})`),
      ...otxResults.map((p) => `[OTX] ${p.name} — ${p.description} tags: ${p.tags.join(", ")}`),
      ...productExaResults.flat().map((r) => `[Exa/Product] ${r.title} — ${r.text ?? ""} (${r.url})`),
    ].join("\n\n");

    const structuredLlm = llm.withStructuredOutput(threatOutputSchema);
    const result = await structuredLlm.invoke([
      {
        role: "system",
        content: `You are a threat intelligence analyst. Given raw search results about current cybersecurity threats, extract and summarize distinct, relevant threats for a company in the ${industry} industry running: ${productNames.join(", ")}. Only include threats with clear relevance. Assign severity based on potential business impact. The "category" field must be exactly one of: ${THREAT_CATEGORIES.join(", ")}. If nothing fits well, use "other".`,
      },
      { role: "user", content: context || "No search results found — return an empty threats array." },
    ]);

    const normalizedThreats = result.threats.map((t) => ({
      ...t,
      category: normalizeCategory(t.category),
    }));

    return { threats: normalizedThreats };
  } catch (err) {
    logger.error({ err, runId: state.runId }, "Threat intelligence analyst node failed");
    return { errors: [`Threat intelligence analysis failed: ${(err as Error).message}`], threats: [] };
  }
}
