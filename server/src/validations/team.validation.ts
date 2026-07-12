import { z } from "zod";

const passwordRule = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-z]/, "Must contain a lowercase letter")
  .regex(/[A-Z]/, "Must contain an uppercase letter")
  .regex(/\d/, "Must contain a number")
  .regex(/[@$!%*?&]/, "Must contain a special character");

export const inviteMemberSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().email(),
    role: z.enum(["admin", "analyst", "viewer"]),
  }),
});

export const updateSchema = z.object({
  params: z.object({ userId: z.string().min(1) }),
  body: z.object({ role: z.enum(["admin", "analyst", "viewer"]), emailNotify: z.boolean().default(false) }),
});

export const acceptInviteSchema = z
  .object({
    params: z.object({ token: z.string().min(1) }),
    body: z.object({
      name: z.string().min(2, "Name must be at least 2 characters").max(50).trim(),
      password: passwordRule,
      confirmPassword: z.string(),
    }),
  })
  .refine((data) => data.body.password === data.body.confirmPassword, {
    message: "Passwords do not match",
    path: ["body", "confirmPassword"],
  });

export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;
