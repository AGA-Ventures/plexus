export type AdminRecoveryAccount = {
  role: string
  admin_id: string | null
  active: boolean
  email: string
}

export function isActiveAdminRecoveryAccount(
  account: AdminRecoveryAccount | null | undefined
): account is AdminRecoveryAccount & { admin_id: string } {
  return Boolean(
    account?.role === "admin" &&
    account.admin_id &&
    account.active &&
    account.email.trim()
  )
}
