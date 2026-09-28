import { z } from "zod";
import { PASSWORD_MAX, PASSWORD_MIN } from "@/lib/auth-constants";
import { CREATABLE_ROLES } from "@/server/auth/catalog";

const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Enter an email address.")
  .max(254, "That email is too long.")
  .pipe(z.email("Enter a valid email address, like name@company.com."));

export const password = z
  .string()
  .min(PASSWORD_MIN, `Use at least ${PASSWORD_MIN} characters.`)
  .max(PASSWORD_MAX, `Use ${PASSWORD_MAX} characters or fewer.`);

const optionalText = (max: number, msg: string) =>
  z
    .string()
    .trim()
    .max(max, msg)
    .optional()
    .transform((v) => (v ? v : null));

export const createAccountSchema = z.object({
  name: z.string().trim().min(1, "Enter the person's full name.").max(120, "Keep the name under 120 characters."),
  email,
  company: optionalText(160, "Keep the company name under 160 characters."),
  role: z.enum(CREATABLE_ROLES, { error: "Choose a role." }),
  parentUserId: z
    .string()
    .optional()
    .transform((v) => (v ? v : null))
    .pipe(z.uuid("Choose a valid dealer or reseller.").nullable()),
  password,
  status: z.enum(["active", "disabled"]).default("active"),
});
export type CreateAccountInput = z.input<typeof createAccountSchema>;

export const setStatusSchema = z.object({ userId: z.uuid(), status: z.enum(["active", "disabled"]) });
export const changeRoleSchema = z.object({ userId: z.uuid(), role: z.enum(CREATABLE_ROLES) });
export const resetPasswordSchema = z.object({ userId: z.uuid(), password });
