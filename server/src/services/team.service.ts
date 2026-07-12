import crypto from "crypto";
import { userRepository } from "../repositories/user.repository.js";
import { organizationRepository } from "../repositories/organization.repository.js";
import { emailQueue } from "../jobs/queue.js";
import { teamInviteTemplate } from "../utils/emailTemplates.js";
import env from "../config/env.js";
import ApiError from "../utils/apiError.js";
import User from "../models/User.js";
import type { Role } from "../models/User.js";
import { emitToOrg, EVENTS } from "../events/eventBus.js";
import Organization from "../models/Organization.js";

const hashToken = (raw: string) => crypto.createHash("sha256").update(raw).digest("hex");

export const teamService = {
  list: async (organizationId: string) => {
    const users = await userRepository.findByOrganization(organizationId);
    const org = await organizationRepository.findById(organizationId);
    if (!org) throw new ApiError(404, "Organization not found");
    const notifyEmails = org.notificationPreferences?.notifyEmails;
    return { users, notifyEmails };
  },

  invite: async (organizationId: string, inviterName: string, email: string, role: Role) => {
    const existing = await userRepository.findByEmail(email);
    if (existing) throw new ApiError(409, "A user with this email already exists");

    const org = await organizationRepository.findById(organizationId);
    if (!org) throw new ApiError(404, "Organization not found");

    const rawInviteToken = crypto.randomBytes(32).toString("hex");
    const hashedInviteToken = hashToken(rawInviteToken);

    const user = await User.create({
      name: email.split("@")[0],
      email,
      organizationId,
      role,
      authProvider: "local",
      password: crypto.randomBytes(16).toString("hex"), // placeholder, overwritten on accept
      emailVerified: false, // fixed — was incorrectly "isVerified", which doesn't exist on the schema
      emailVerificationToken: hashedInviteToken,
      emailVerificationExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    } as any);

    const inviteUrl = `${env.clientUrl}/accept-invite/${rawInviteToken}`;
    await emailQueue.add("send-team-invite", {
      type: "team_invite",
      to: email,
      subject: `You're invited to join ${org.name}`,
      html: teamInviteTemplate(inviterName, org.name, role, inviteUrl),
      organizationId,
      userId: user._id.toString(),
    });
    return user;
  },

  // Accepting an invite = verifying the email + setting a real name/password in one step.
  // Reuses the same emailVerificationToken/Expires fields as the normal signup verification flow.
  acceptInvite: async (token: string, name: string, password: string) => {
    const hashedToken = hashToken(token);

    const user = await User.findOne({
    emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: new Date() },
    }).select("+password +emailVerificationToken +emailVerificationExpires");

    if (!user) throw new ApiError(400, "Invalid or expired invite link");

    user.name = name;
    user.password = password; // pre-save hook re-hashes this
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();
    await emitToOrg(user.organizationId.toString(), EVENTS.TEAM_INVITE_ACCEPTED, {
      email: user.email,
      acceptedAt: new Date().toISOString(),
    });

    return user;
  },

  update: async (organizationId: string, targetUserId: string, newRole: Role, emailNotify: boolean, requesterId: string) => {
    const user = await User.findOne({ _id: targetUserId, organizationId });
    if (targetUserId === requesterId && user!.role !== "admin") {
      throw new ApiError(400, "You cannot change your own role");
    }
    if (!user) throw new ApiError(404, "User not found in this organization");
    user.role = newRole;
    if (emailNotify) {
      const organization = await Organization.findOne({ _id: organizationId });
      if (!organization) throw new ApiError(404, "Organization not found");
      if (!organization.notificationPreferences.notifyEmails.includes(user.email)) {
        organization.notificationPreferences.notifyEmails.push(user.email);
        await organization.save();
      } else {
        organization.notificationPreferences.notifyEmails = organization.notificationPreferences.notifyEmails.filter(email => email !== user.email);
        await organization.save();
      }
    }
    await user.save();
    return user;
  },

  remove: async (organizationId: string, targetUserId: string, requesterId: string) => {
    if (targetUserId === requesterId) {
      throw new ApiError(400, "You cannot remove yourself from the organization");
    }
    const user = await User.findOneAndDelete({ _id: targetUserId, organizationId });
    if (!user) throw new ApiError(404, "User not found in this organization");
    return user;
  },
};
