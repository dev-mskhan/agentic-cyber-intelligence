interface BaseTemplateOptions {
  previewText: string;
  heading: string;
  bodyHtml: string; // the middle content, inserted as-is
  ctaText?: string;
  ctaUrl?: string;
  footerNote?: string;
}

// Shared layout — every email goes through this so branding stays consistent
const baseTemplate = ({
  previewText,
  heading,
  bodyHtml,
  ctaText,
  ctaUrl,
  footerNote,
}: BaseTemplateOptions): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${heading}</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <!-- preview text, hidden, shows in inbox preview -->
  <div style="display:none; max-height:0; overflow:hidden;">${previewText}</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7; padding: 32px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius: 8px; overflow:hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">

          <!-- header -->
          <tr>
            <td style="background-color:#111827; padding: 24px 32px;">
              <span style="color:#ffffff; font-size:18px; font-weight:600;">SentinelWatch</span>
            </td>
          </tr>

          <!-- body -->
          <tr>
            <td style="padding: 32px;">
              <h1 style="margin:0 0 16px 0; font-size:20px; color:#111827;">${heading}</h1>
              <div style="font-size:14px; line-height:22px; color:#374151;">
                ${bodyHtml}
              </div>

              ${
                ctaText && ctaUrl
                  ? `
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top: 24px;">
                <tr>
                  <td style="border-radius:6px; background-color:#2563eb;">
                    <a href="${ctaUrl}" target="_blank"
                      style="display:inline-block; padding:12px 24px; font-size:14px; font-weight:600; color:#ffffff; text-decoration:none;">
                      ${ctaText}
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin-top:16px; font-size:12px; color:#9ca3af; word-break:break-all;">
                Or copy this link into your browser:<br />
                <a href="${ctaUrl}" style="color:#2563eb;">${ctaUrl}</a>
              </p>`
                  : ""
              }

              ${
                footerNote
                  ? `<p style="margin-top:24px; font-size:12px; color:#9ca3af;">${footerNote}</p>`
                  : ""
              }
            </td>
          </tr>

          <!-- footer -->
          <tr>
            <td style="padding: 20px 32px; background-color:#f9fafb; border-top:1px solid #e5e7eb;">
              <p style="margin:0; font-size:12px; color:#9ca3af;">
                © ${new Date().getFullYear()} SentinelWatch. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// --- Specific templates ---

export const emailVerificationTemplate = (name: string, verifyUrl: string) =>
  baseTemplate({
    previewText: "Verify your email to activate your account",
    heading: `Welcome, ${name}`,
    bodyHtml: `
      <p>Thanks for signing up. Please verify your email address to activate your account and start onboarding.</p>
      <p>This link will expire in 24 hours.</p>
    `,
    ctaText: "Verify Email",
    ctaUrl: verifyUrl,
    footerNote:
      "If you didn't create this account, you can safely ignore this email.",
  });

export const passwordResetTemplate = (name: string, resetUrl: string) =>
  baseTemplate({
    previewText: "Reset your password",
    heading: `Hi ${name}, reset your password`,
    bodyHtml: `
      <p>We received a request to reset your password. Click the button below to choose a new one.</p>
      <p>This link will expire in 1 hour.</p>
    `,
    ctaText: "Reset Password",
    ctaUrl: resetUrl,
    footerNote:
      "If you didn't request this, you can safely ignore this email — your password won't change.",
  });

export const teamInviteTemplate = (
  inviterName: string,
  organizationName: string,
  role: string,
  inviteUrl: string,
) =>
  baseTemplate({
    previewText: `${inviterName} invited you to join ${organizationName}`,
    heading: `You've been invited to ${organizationName}`,
    bodyHtml: `
      <p><strong>${inviterName}</strong> has invited you to join <strong>${organizationName}</strong> on SentinelWatch as a <strong>${role}</strong>.</p>
      <p>Click below to set your password and get started.</p>
    `,
    ctaText: "Accept Invite",
    ctaUrl: inviteUrl,
    footerNote:
      "If you weren't expecting this invite, you can safely ignore this email.",
  });
export const reportEmailTemplate = (
  orgName: string,
  reportUrl: string,
  data: {
    riskLevel: string;
    executiveSummary: string;
    threats: { title: string; severity: string; description: string }[];
    vulnerabilities: { cveId: string; severity: string; cvssScore?: number; isKnownExploited: boolean; title: string }[];
    mitigations: { title: string; priority: string; recommendation: string }[];
  }
) => {
  const riskColor: Record<string, string> = {
    critical: "#dc2626",
    high: "#ea580c",
    medium: "#d97706",
    low: "#16a34a",
  };

  const threatsHtml = data.threats
    .slice(0, 8)
    .map(
      (t) => `
    <tr>
      <td style="padding:8px 0; border-bottom:1px solid #e5e7eb;">
        <span style="display:inline-block; font-size:11px; font-weight:600; text-transform:uppercase; color:${riskColor[t.severity] ?? "#374151"};">${t.severity}</span><br/>
        <span style="font-size:14px; color:#111827; font-weight:600;">${t.title}</span><br/>
        <span style="font-size:13px; color:#6b7280;">${t.description}</span>
      </td>
    </tr>`
    )
    .join("");

  const vulnsHtml = data.vulnerabilities
    .slice(0, 8)
    .map(
      (v) => `
    <tr>
      <td style="padding:8px 0; border-bottom:1px solid #e5e7eb;">
        <span style="display:inline-block; font-size:11px; font-weight:600; text-transform:uppercase; color:${riskColor[v.severity] ?? "#374151"};">${v.severity}${v.isKnownExploited ? " · ACTIVELY EXPLOITED" : ""}</span><br/>
        <span style="font-size:14px; color:#111827; font-weight:600;">${v.cveId}</span> — <span style="font-size:13px; color:#6b7280;">${v.title}</span>
        ${v.cvssScore ? `<br/><span style="font-size:12px; color:#9ca3af;">CVSS ${v.cvssScore}</span>` : ""}
      </td>
    </tr>`
    )
    .join("");

  const mitigationsHtml = data.mitigations
    .slice(0, 8)
    .map(
      (m) => `
    <tr>
      <td style="padding:8px 0; border-bottom:1px solid #e5e7eb;">
        <span style="display:inline-block; font-size:11px; font-weight:600; text-transform:uppercase; color:#2563eb;">${m.priority}</span><br/>
        <span style="font-size:14px; color:#111827; font-weight:600;">${m.title}</span><br/>
        <span style="font-size:13px; color:#6b7280;">${m.recommendation}</span>
      </td>
    </tr>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0; padding:0; background-color:#f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7; padding: 32px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius: 8px; overflow:hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">

          <tr>
            <td style="background-color:#111827; padding: 24px 32px;">
              <span style="color:#ffffff; font-size:18px; font-weight:600;">SentinelWatch</span>
            </td>
          </tr>

          <tr>
            <td style="padding: 32px;">
              <h1 style="margin:0 0 8px 0; font-size:20px; color:#111827;">New Security Report — ${orgName}</h1>
              <p style="margin:0 0 20px 0;">
                <span style="display:inline-block; padding:4px 10px; border-radius:4px; background-color:${riskColor[data.riskLevel] ?? "#374151"}1a; color:${riskColor[data.riskLevel] ?? "#374151"}; font-size:12px; font-weight:700; text-transform:uppercase;">
                  ${data.riskLevel} risk
                </span>
              </p>

              <h2 style="font-size:14px; color:#111827; margin:24px 0 8px 0;">Executive Summary</h2>
              <p style="font-size:14px; line-height:22px; color:#374151;">${data.executiveSummary}</p>

              ${data.threats.length > 0 ? `<h2 style="font-size:14px; color:#111827; margin:24px 0 8px 0;">Threats (${data.threats.length})</h2><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${threatsHtml}</table>` : ""}

              ${data.vulnerabilities.length > 0 ? `<h2 style="font-size:14px; color:#111827; margin:24px 0 8px 0;">Vulnerabilities (${data.vulnerabilities.length})</h2><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${vulnsHtml}</table>` : ""}

              ${data.mitigations.length > 0 ? `<h2 style="font-size:14px; color:#111827; margin:24px 0 8px 0;">Recommended Mitigations (${data.mitigations.length})</h2><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${mitigationsHtml}</table>` : ""}

              <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top: 28px;">
                <tr>
                  <td style="border-radius:6px; background-color:#2563eb;">
                    <a href="${reportUrl}" target="_blank" style="display:inline-block; padding:12px 24px; font-size:14px; font-weight:600; color:#ffffff; text-decoration:none;">
                      View Full Report
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 20px 32px; background-color:#f9fafb; border-top:1px solid #e5e7eb;">
              <p style="margin:0; font-size:12px; color:#9ca3af;">
                You're receiving this because you're subscribed to security reports for ${orgName}. You can change this in your notification settings.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};
