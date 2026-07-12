import { llm } from "../llm.js";
import { reportOutputSchema } from "../schemas.js";
import logger from "../../config/logger.js";
import type { GraphStateType } from "../state.js";
import { updateRunStage } from "../../repositories/run.repository.js";

export async function reportWriterNode(state: GraphStateType): Promise<Partial<GraphStateType>> {
  await updateRunStage(state.runId, "report_writing");

  try {
    const frameworks = state.organization.complianceFrameworks?.join(", ") || "none declared";

    const structuredLlm = llm.withStructuredOutput(reportOutputSchema);

    // agents/nodes/reportWriter.ts
    const result = await structuredLlm.invoke([
      {
        role: "system",
        content: `You are a cybersecurity report writer producing an executive-level report for "${state.organization.name}" (industry: ${state.organization.industry}, compliance frameworks: ${frameworks}).

    CRITICAL: You must only reference vulnerabilities, CVE IDs, and mitigations that are explicitly present in the data provided below. Never invent, assume, or generalize a CVE that is not listed in the "vulnerabilities" array. If the vulnerabilities array is empty, explicitly state in the report that no specific CVEs were matched against the organization's declared technology inventory for this run — do not substitute generic or example CVEs for other products.

    Write a concise executive summary (non-technical, for leadership), assign an overall riskLevel based on the most severe findings actually present (if no vulnerabilities were found, base riskLevel primarily on the threats list), and write a full reportBody in markdown covering: overview, key threats, vulnerabilities (only if present, with exact CVE IDs from the data), and recommended mitigations (only if present). If compliance frameworks are declared, add complianceNotes explaining relevance.`,
      },
      {
        role: "user",
        content: JSON.stringify(
          { threats: state.threats, vulnerabilities: state.vulnerabilities, mitigations: state.mitigations },
          null,
          2
        ),
      },
    ]);

    return { report: result };
  } catch (err) {
    logger.error({ err, runId: state.runId }, "Report writer node failed");
    return {
      errors: [`Report generation failed: ${(err as Error).message}`],
      report: {
        executiveSummary: "Report generation encountered an error. Partial findings are available below.",
        riskLevel: "medium",
        reportBody: "Automated report writing failed. Please review raw findings.",
      },
    };
  }
}
