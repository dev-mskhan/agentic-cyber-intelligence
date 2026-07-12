import { userRepository } from "../repositories/user.repository.js";
import { emailQueue } from "../jobs/queue.js";
import { reportEmailTemplate } from "../utils/emailTemplates.js";
import env from "../config/env.js";
import logger from "../config/logger.js";
import type { IOrganization } from "../types/organization.types.js";
import { emitToOrg, EVENTS } from "../events/eventBus.js";

interface RunResultForEmail {
  riskLevel: string;
  executiveSummary: string;
  threats: { title: string; severity: string; description: string }[];
  vulnerabilities: { cveId: string; severity: string; cvssScore?: number; isKnownExploited: boolean; title: string }[];
  mitigations: { title: string; priority: string; recommendation: string }[];
}

export const reportNotificationService = {
  // Only emails addresses that are BOTH in org.notificationPreferences.notifyEmails
  // AND belong to an actual current team member — prevents stale/removed
  // addresses left in notifyEmails from still receiving reports.
  sendReportToTeam: async (
    organization: IOrganization,
    reportId: string,
    result: RunResultForEmail
  ) => {
    const notifyEmails = organization.notificationPreferences?.notifyEmails ?? [];
    if (notifyEmails.length === 0) {
      logger.info({ organizationId: organization._id }, "No notifyEmails configured, skipping report email");
      return;
    }

    const teamMembers = await userRepository.findByOrganization(organization._id.toString());
    const teamEmailSet = new Set(teamMembers.map((m) => m.email));

    const recipients = notifyEmails.filter((email) => teamEmailSet.has(email));

    if (recipients.length === 0) {
      logger.info({ organizationId: organization._id }, "notifyEmails set but no matching current team members");
      return;
    }

    const reportUrl = `${env.clientUrl}/reports/${reportId}`;
    const html = reportEmailTemplate(organization.name, reportUrl, result);

    for (const to of recipients) {
      await emailQueue.add("send-report-notification", {
        to,
        type: "report",
        subject: `[${result.riskLevel.toUpperCase()}] New Security Report — ${organization.name}`,
        html,
        organizationId: organization._id.toString(),
        recipient: to.toString(),
        reportId,
      });
    }

    logger.info({ organizationId: organization._id, recipientCount: recipients.length }, "Report notification emails queued");
  },
};
