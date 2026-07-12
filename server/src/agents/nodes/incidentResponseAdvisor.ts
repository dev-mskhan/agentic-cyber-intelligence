import { llm } from "../llm.js";
import { mitigationOutputSchema } from "../schemas.js";
import logger from "../../config/logger.js";
import type { GraphStateType } from "../state.js";
import { updateRunStage } from "../../repositories/run.repository.js";

export async function incidentResponseAdvisorNode(state: GraphStateType): Promise<Partial<GraphStateType>> {
  await updateRunStage(state.runId, "incident_response");

  if (state.vulnerabilities.length === 0) {
    return { mitigations: [] };
  }

  try {
    // pull criticality of the underlying system for each vuln, to prioritize reasoning
    const enriched = state.vulnerabilities.map((v) => {
      const invItem = state.technologyInventory.find((t) => t._id.toString() === v.technologyInventoryId);
      return {
        ...v,
        systemCriticality: invItem?.criticality ?? "medium",
        systemPurpose: invItem?.purpose ?? "unknown",
        environment: invItem?.environment ?? "production",
      };
    });

    const structuredLlm = llm.withStructuredOutput(mitigationOutputSchema);

    const result = await structuredLlm.invoke([
      {
        role: "system",
        content: `You are an incident response advisor. For each vulnerability listed, recommend a specific, actionable mitigation. Prioritize by the criticality of the affected system and whether the CVE is actively exploited (isKnownExploited). Systems in "production" environment with "critical" or "high" criticality should get "urgent" or "high" priority mitigations first.`,
      },
      { role: "user", content: JSON.stringify(enriched, null, 2) },
    ]);

    return { mitigations: result.mitigations };
  } catch (err) {
    logger.error({ err, runId: state.runId }, "Incident response advisor node failed");
    return { errors: [`Mitigation planning failed: ${(err as Error).message}`], mitigations: [] };
  }
}
