interface AuthErrorLike {
  code?: string | null;
  status?: number | null;
  message?: string | null;
}

const byCode: Record<string, string> = {
  USER_ALREADY_EXISTS: "An account with this email already exists. Log in instead, or reset your password.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "An account with this email already exists. Log in instead, or reset your password.",
  INVALID_EMAIL_OR_PASSWORD: "That email and password don't match. Check both and try again.",
  INVALID_PASSWORD: "That email and password don't match. Check both and try again.",
  INVALID_EMAIL: "Enter a valid email address.",
  PASSWORD_TOO_SHORT: "That password is too short. Use at least 10 characters.",
  PASSWORD_TOO_LONG: "That password is too long. Use 128 characters or fewer.",
  INVALID_TOKEN: "This reset link has expired or was already used. Request a new one.",
  ACCOUNT_DISABLED: "This account has been disabled. Contact your account manager to restore access.",
};

/** Turns a Better Auth client error into a sentence that says what to do next. */
export function authErrorMessage(error: AuthErrorLike): string {
  if (error.status === 429) return "Too many attempts. Wait a minute, then try again.";
  if (error.code && byCode[error.code]) return byCode[error.code]!;
  if (error.status === 403 && error.message?.toLowerCase().includes("disabled")) return byCode.ACCOUNT_DISABLED!;
  if (error.status === 401) return byCode.INVALID_EMAIL_OR_PASSWORD!;
  return "Something went wrong on our side. Try again in a moment.";
}
