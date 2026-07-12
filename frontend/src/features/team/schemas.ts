import { z } from "zod";

export const inviteMemberSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["admin", "analyst", "viewer"]),
});
