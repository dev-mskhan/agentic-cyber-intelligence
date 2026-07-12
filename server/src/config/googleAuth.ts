import { OAuth2Client } from "google-auth-library";
import env from "../config/env.js";
import ApiError from "../utils/apiError.js";

const client = new OAuth2Client(env.googleClientId);

export interface GoogleProfile {
  googleId: string;
  email: string;
  name: string | undefined;
  avatarUrl?: string;
  emailVerified: boolean;
}

export const verifyGoogleIdToken = async (
  idToken: string,
): Promise<GoogleProfile> => {
  let ticket;
  try {
    ticket = await client.verifyIdToken({
      idToken,
      audience: env.googleClientId,
    });
  } catch (err) {
    throw new ApiError(401, "Invalid Google token");
  }

  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    throw new ApiError(401, "Google token did not include an email");
  }

  const profile: GoogleProfile = {
    googleId: payload.sub,
    email: payload.email,
    name: payload.name ?? payload.email.split("@")[0],
    emailVerified: payload.email_verified ?? false,
  };
  if (payload.picture) {
    profile.avatarUrl = payload.picture;
  }

  return profile;
};
