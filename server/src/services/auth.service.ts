import crypto from "crypto";
import Organization from "../models/Organization.js";
import { userRepository } from "../repositories/user.repository.js";
import ApiError from "../utils/apiError.js";
import { emailQueue } from "../jobs/queue.js";
import env from "../config/env.js";
import { verifyGoogleIdToken } from "../config/googleAuth.js";
import { generateScopedSocketToken } from "../utils/generateToken.js";
import {
  emailVerificationTemplate,
passwordResetTemplate,
} from "../utils/emailTemplates.js";
import type { IUser } from "../models/User.js";
import mongoose from "mongoose";
import { emitToUser, EVENTS } from "../events/eventBus.js";
import { organizationRepository } from "../repositories/organization.repository.js";
import logger from "../config/logger.js";

const hashToken = (raw: string) =>
  crypto.createHash("sha256").update(raw).digest("hex");

export const authService = {
  // --- Local signup ---
  // services/auth.service.ts
  signup: async (name: string, email: string, password: string, organizationName: string) => {
    const existing = await userRepository.findByEmail(email);
    if (existing) throw new ApiError(409, "Email already in use");

    const session = await mongoose.startSession();
    session.startTransaction();

    let user;
    let org;
    let rawToken: string;

    try {
      const orgDocs = await Organization.create([{ name: organizationName }], { session });
      org = orgDocs[0]!;

      rawToken = crypto.randomBytes(32).toString("hex");
      user = await userRepository.create(
        {
          name,
          email,
          password,
          role: "admin",
          organizationId: org._id,
          authProvider: "local",
          emailVerificationToken: hashToken(rawToken),
          emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        } as Partial<IUser>,
        session
      );

      org.createdBy = user!._id;
      org.notificationPreferences.notifyEmails = [email];
      await org.save({ session });

      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      throw err instanceof ApiError ? err : new ApiError(500, "Failed to signup");
    } finally {
      session.endSession();
    }
    try {
      const verifyUrl = `${env.clientUrl}/verify-email/${rawToken!}`;
      await emailQueue.add("send-verification-email", {
        type: "email_verification",
        to: email,
        subject: "Verify your email address",
        html: emailVerificationTemplate(name, verifyUrl),
        userId: user!._id.toString(),
        correlationId: crypto.randomUUID(),
      });
    } catch (err) {
      logger.error({ err, userId: user!._id }, "Failed to enqueue verification email after signup");
    }

    const pendingToken = generateScopedSocketToken(user!._id.toString(), "pending_verification");

    return { user, pendingToken };
  },

  verifyEmail: async (token: string) => {
    const user = await userRepository.findByVerificationToken(hashToken(token));
    if (!user) throw new ApiError(400, "Invalid or expired verification token");

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();
    await emitToUser(user._id.toString(), EVENTS.EMAIL_VERIFIED, {
      email: user.email,
      verifiedAt: new Date().toISOString(),
    });
    return user;
  },

  login: async (email: string, password: string) => {
    const user = await userRepository.findByEmailWithPassword(email);
    if (!user) throw new ApiError(401, "Invalid email or password");

    if (user.authProvider === "google") {
      throw new ApiError(
        400,
        "This account uses Google Sign-In. Please continue with Google.",
      );
    }
    const org = await Organization.findOne({ _id: user.organizationId });
    const valid = await user.comparePassword(password);
    if (!valid) throw new ApiError(401, "Invalid email or password");

    if (!user.emailVerified)
      throw new ApiError(403, "Please verify your email first");

    return {user, isOnboarded: org?.isOnboarded ?? false};
  },

  // --- Google OAuth ---
  // organizationName is only used if this is a brand-new user (first-time Google signup)
  loginOrSignupWithGoogle: async (
    idToken: string,
    organizationName?: string,
  ) => {
    const profile = await verifyGoogleIdToken(idToken);

    // 1. Already linked via googleId
    let user = await userRepository.findByGoogleId(profile.googleId);
    if (user) {
      const org = await Organization.findOne({ _id: user.organizationId });
      return {user, isOnboarded: org?.isOnboarded ?? false};
    }

    // 2. Existing local account with same email -> link Google to it
    const existingLocal = await userRepository.findByEmail(profile.email);
    if (existingLocal) {
      existingLocal.googleId = profile.googleId;
      existingLocal.authProvider = existingLocal.authProvider; // keep "local" as primary, googleId just links
      existingLocal.emailVerified = true; // Google already verified the email
      if (!existingLocal.avatarUrl && profile.avatarUrl) {
        existingLocal.avatarUrl = profile.avatarUrl;
      }
      const org = await Organization.findOne({ _id: existingLocal.organizationId });
      await existingLocal.save();
      return {user: existingLocal, isOnboarded: org?.isOnboarded ?? false};
    }

    // 3. Brand-new user via Google -> needs an organization
    if (!organizationName) {
      throw new ApiError(
        400,
        "organizationName is required for first-time Google sign-up",
      );
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const org = await Organization.create([{ name: organizationName }], {
        session,
      });

      const newUser = await userRepository.create(
        {
          name: profile.name,
          email: profile.email,
          role: "admin",
          organizationId: org[0]!._id,
          authProvider: "google",
          googleId: profile.googleId,
          avatarUrl: profile.avatarUrl,
          isVerified: profile.emailVerified,
        } as Partial<IUser>,
        session,
      );

      org[0]!.createdBy = user!._id;
      org[0]!.notificationPreferences.notifyEmails.push(newUser!.email);
      org[0]!.isOnboarded = false;
      await org[0]!.save({ session });

      await session.commitTransaction();
      return {user: newUser, isOnboarded: false};
    } catch (err) {
      await session.abortTransaction();
      throw err instanceof ApiError
        ? err
        : new ApiError(500, "Failed to sign up with Google");
    } finally {
      session.endSession();
    }
  },

  refreshAccessToken: async (token: string) => {
    const user = await userRepository.findByRefreshToken(token);
    if (!user) throw new ApiError(401, "Invalid refresh token");
    return user;
  },

  logout: async (token: string) => {
    if (token) await userRepository.clearRefreshTokenByToken(token);
  },

  forgotPassword: async (email: string) => {
    const user = await userRepository.findByEmail(email);
    if (!user) throw new ApiError(404, "No account with that email");

    if (user.authProvider === "google") {
      throw new ApiError(
        400,
        "This account uses Google Sign-In and has no password to reset",
      );
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = hashToken(rawToken);
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const resetUrl = `${env.clientUrl}/reset-password/${rawToken}`;
    await emailQueue.add("send-reset-password-email", {
      type: "password_reset",
      to: email,
      subject: "Reset your password",
      html: passwordResetTemplate(user.name, resetUrl),
      userId: user._id.toString(),
    });

    // Same pattern as signup: lets the "check your email" screen for
    // password reset receive PASSWORD_RESET_EMAIL_SENT / FAILED live,
    // without requiring an authenticated session.
    const pendingToken = generateScopedSocketToken(
      user._id.toString(),
      "pending_password_reset",
    );

    return { pendingToken };
  },

  resetPassword: async (token: string, password: string) => {
    const user = await userRepository.findByResetToken(hashToken(token));
    if (!user) throw new ApiError(400, "Invalid or expired reset token");

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    await emitToUser(user._id.toString(), EVENTS.PASSWORD_RESET_COMPLETED, {
      email: user.email,
      resetAt: new Date().toISOString(),
    });
  },
};
