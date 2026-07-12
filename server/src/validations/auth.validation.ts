import { z } from "zod";

const passwordRule = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-z]/, "Must contain a lowercase letter")
  .regex(/[A-Z]/, "Must contain an uppercase letter")
  .regex(/\d/, "Must contain a number")
  .regex(/[@$!%*?&]/, "Must contain a special character");

export const signupSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(50)
      .trim(),
    email: z.string().email("Invalid email").toLowerCase().trim(),
    password: passwordRule,
    organizationName: z
      .string()
      .min(2, "Organization name is required")
      .max(100)
      .trim(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email").toLowerCase().trim(),
    password: z.string().min(1, "Password is required"),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email").toLowerCase().trim(),
  }),
});

export const resetPasswordSchema = z
  .object({
    params: z.object({
      token: z.string().min(1, "Token is required"),
    }),
    body: z.object({
      password: passwordRule,
      confirmPassword: z.string(),
    }),
  })
  .refine((data) => data.body.password === data.body.confirmPassword, {
    message: "Passwords do not match",
    path: ["body", "confirmPassword"],
  });

export const verifyEmailSchema = z.object({
  params: z.object({
    token: z.string().min(1, "Token is required"),
  }),
});

export const changePasswordSchema = z
  .object({
    body: z.object({
      currentPassword: z.string().min(1, "Current password is required"),
      newPassword: passwordRule,
      confirmPassword: z.string(),
    }),
  })
  .refine((data) => data.body.newPassword === data.body.confirmPassword, {
    message: "Passwords do not match",
    path: ["body", "confirmPassword"],
  });

// Frontend sends the Google ID token obtained from Google Identity Services
export const googleAuthSchema = z.object({
  body: z.object({
    idToken: z.string().min(1, "Google ID token is required"),
    // only needed on first-time signup via Google, to create the org
    organizationName: z.string().min(2).max(100).trim().optional(),
  }),
});
export const verificationStatusSchema = z.object({
  query: z.object({
    pendingToken: z.string().min(1, "pendingToken is required"),
  }),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;
