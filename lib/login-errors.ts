export type LoginErrorCode =
  | "invalid_email"
  | "password_required"
  | "invalid_credentials"
  | "account_not_ready"
  | "sign_in_failed"
  | "account_access_unavailable"
  | "wrong_workspace"

export function getLoginProviderErrorCode(message: string): LoginErrorCode {
  const normalized = message.toLowerCase()

  if (normalized.includes("invalid login credentials")) {
    return "invalid_credentials"
  }

  if (normalized.includes("email not confirmed")) {
    return "account_not_ready"
  }

  return "sign_in_failed"
}

export function getLoginValidationErrorCode(
  field: PropertyKey | undefined
): LoginErrorCode {
  return field === "password" ? "password_required" : "invalid_email"
}
