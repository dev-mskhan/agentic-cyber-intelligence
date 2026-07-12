import { reportRepository } from "../repositories/report.repository.js";
import { threatRepository } from "../repositories/threat.repository.js";
import { vulnerabilityRepository } from "../repositories/vulnerability.repository.js";
import { mitigationRepository } from "../repositories/mitigation.repository.js";
import ApiError from "../utils/apiError.js";

export const reportService = {
  list: async (organizationId: string) => reportRepository.findByOrganization(organizationId),

  getById: async (organizationId: string, reportId: string) => {
    const report = await reportRepository.findById(reportId);
    if (!report || report.organizationId.toString() !== organizationId) {
      throw new ApiError(404, "Report not found");
    }
    return report;
  },

  getFullDetail: async (organizationId: string, reportId: string) => {
    const report = await reportService.getById(organizationId, reportId);
    const [threats, vulnerabilities, mitigations] = await Promise.all([
      threatRepository.findByRun(report.runId.toString()),
      vulnerabilityRepository.findByRun(report.runId.toString()),
      mitigationRepository.findByRun(report.runId.toString()),
    ]);
    return { report, threats, vulnerabilities, mitigations };
  },

  generateMarkdown: async (organizationId: string, reportId: string): Promise<string> => {
    const { report, threats, vulnerabilities, mitigations } = await reportService.getFullDetail(organizationId, reportId);

    const lines: string[] = [
      `# Security Report`,
      `Generated: ${report.generatedAt.toISOString()}`,
      `Overall Risk Level: **${report.riskLevel.toUpperCase()}**`,
      ``,
      `## Executive Summary`,
      report.executiveSummary,
      ``,
      `## Full Report`,
      report.reportBody,
      ``,
    ];

    if (report.complianceNotes) {
      lines.push(`## Compliance Notes`, report.complianceNotes, ``);
    }

    lines.push(`## Threats (${threats.length})`);
    for (const t of threats) {
      lines.push(`- **${t.title}** [${t.severity}] — ${t.description}${t.sourceUrl ? ` ([source](${t.sourceUrl}))` : ""}`);
    }

    lines.push(``, `## Vulnerabilities (${vulnerabilities.length})`);
    for (const v of vulnerabilities) {
      lines.push(
        `- **${v.cveId}** [${v.severity}${v.isKnownExploited ? ", ACTIVELY EXPLOITED" : ""}] CVSS ${v.cvssScore ?? "N/A"} — ${v.title}`
      );
    }

    lines.push(``, `## Recommended Mitigations (${mitigations.length})`);
    for (const m of mitigations) {
      lines.push(`- [${m.priority.toUpperCase()}] **${m.title}** — ${m.recommendation}`);
    }

    return lines.join("\n");
  },

  remove: async (organizationId: string, reportId: string) => {
    const deleted = await reportRepository.deleteById(reportId, organizationId);
    if (!deleted) throw new ApiError(404, "Report not found");
    return deleted;
  },
};
