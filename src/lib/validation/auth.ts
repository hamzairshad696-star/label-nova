import { z } from "zod";
import { PASSWORD_MAX, PASSWORD_MIN } from "@/lib/auth-constants";

const email = z
  .string()
  .trim()
  .min(1, "Enter your email address.")
  .max(254, "That email is too long.")
  .pipe(z.email("Enter a valid email address, like name@company.com."));

const newPassword = z
  .string()
  .min(PASSWORD_MIN, `Use at least ${PASSWORD_MIN} characters.`)
  .max(PASSWORD_MAX, `Use ${PASSWORD_MAX} characters or fewer.`);

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password."),
});

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Enter your full name.").max(120, "Keep your name under 120 characters."),
  company: z.string().trim().max(160, "Keep the company name under 160 characters.").optional(),
  email,
  password: newPassword,
});

export const forgotSchema = z.object({ email });

export const resetSchema = z
  .object({
    password: newPassword,
    confirm: z.string().min(1, "Type the new password again."),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords don't match." });

/** First error message per field, keyed by field name. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}
