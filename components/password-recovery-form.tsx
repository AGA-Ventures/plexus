"use client"

import type { CSSProperties, ReactNode } from "react"
import { useActionState, useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Alert02Icon,
  ArrowRight01Icon,
  EyeIcon,
  EyeOffIcon,
  LockPasswordIcon,
  Mail01Icon,
  ShieldUserIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { toast } from "sonner"

import {
  requestPasswordResetAction,
  updatePasswordAction,
  type PasswordRecoveryActionState,
  type UpdatePasswordActionState,
} from "@/app/actions/auth"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import type { Locale } from "@/lib/i18n"
import { getForgotPasswordPath, getLoginPath } from "@/lib/password-recovery"
import type { PasswordRecoveryMode } from "@/lib/password-recovery"
import type { LoginBranding } from "@/lib/tenant-login"

type RecoveryCopy = {
  platformKicker: string
  tenantKicker: string
  platformTitle: string
  tenantTitle: string
  platformDescription: string
  tenantDescription: string
  poweredBy: string
  forgotTitle: string
  forgotPrompt: string
  email: string
  emailPlaceholder: string
  sendLink: string
  sendingLink: string
  checkInbox: string
  checkInboxDescription: string
  requestProblem: string
  invalidLinkTitle: string
  invalidLinkDescription: string
  resetTitle: string
  resetPrompt: string
  newPassword: string
  confirmPassword: string
  passwordPlaceholder: string
  updatePassword: string
  updatingPassword: string
  passwordProblem: string
  passwordUpdated: string
  backToLogin: string
  requestNewLink: string
}

type RecoveryStyle = CSSProperties & {
  "--login-accent": string
  "--login-accent-foreground": string
}

const copy: Partial<Record<Locale, RecoveryCopy>> & { en: RecoveryCopy } = {
  en: {
    platformKicker: "The business superapp",
    tenantKicker: "Private business workspace",
    platformTitle: "Recover access securely.",
    tenantTitle: "Return to your trusted business workspace.",
    platformDescription:
      "Use a verified email link to choose a new password for your Plexus account.",
    tenantDescription:
      "Your recovery link returns you to the correct organization workspace.",
    poweredBy: "Powered by Plexus",
    forgotTitle: "Reset your password",
    forgotPrompt:
      "Enter your account email and we’ll send a secure recovery link.",
    email: "Email",
    emailPlaceholder: "you@company.com",
    sendLink: "Send recovery link",
    sendingLink: "Sending link...",
    checkInbox: "Check your inbox",
    checkInboxDescription:
      "If an eligible account matches that email, a recovery link is on its way.",
    requestProblem: "Unable to continue",
    invalidLinkTitle: "Recovery link unavailable",
    invalidLinkDescription:
      "That recovery link is invalid or has expired. Request a new one below.",
    resetTitle: "Set a new password",
    resetPrompt:
      "Choose a password of at least 12 characters, then sign in again.",
    newPassword: "New password",
    confirmPassword: "Confirm new password",
    passwordPlaceholder: "At least 12 characters",
    updatePassword: "Update password",
    updatingPassword: "Updating password...",
    passwordProblem: "Password not updated",
    passwordUpdated: "Password updated. Sign in with your new password.",
    backToLogin: "Back to login",
    requestNewLink: "Request a new recovery link",
  },
  ms: {
    platformKicker: "Superap perniagaan",
    tenantKicker: "Ruang kerja perniagaan peribadi",
    platformTitle: "Pulihkan akses dengan selamat.",
    tenantTitle: "Kembali ke ruang kerja perniagaan anda yang dipercayai.",
    platformDescription:
      "Gunakan pautan e-mel yang disahkan untuk memilih kata laluan baharu bagi akaun Plexus anda.",
    tenantDescription:
      "Pautan pemulihan anda mengembalikan anda ke ruang kerja organisasi yang betul.",
    poweredBy: "Dikuasakan oleh Plexus",
    forgotTitle: "Tetapkan semula kata laluan anda",
    forgotPrompt:
      "Masukkan e-mel akaun anda dan kami akan menghantar pautan pemulihan yang selamat.",
    email: "E-mel",
    emailPlaceholder: "anda@syarikat.com",
    sendLink: "Hantar pautan pemulihan",
    sendingLink: "Menghantar pautan...",
    checkInbox: "Semak peti masuk anda",
    checkInboxDescription:
      "Jika akaun yang layak sepadan dengan e-mel itu, pautan pemulihan sedang dihantar.",
    requestProblem: "Tidak dapat meneruskan",
    invalidLinkTitle: "Pautan pemulihan tidak tersedia",
    invalidLinkDescription:
      "Pautan pemulihan itu tidak sah atau telah tamat tempoh. Minta pautan baharu di bawah.",
    resetTitle: "Tetapkan kata laluan baharu",
    resetPrompt:
      "Pilih kata laluan sekurang-kurangnya 12 aksara, kemudian log masuk semula.",
    newPassword: "Kata laluan baharu",
    confirmPassword: "Sahkan kata laluan baharu",
    passwordPlaceholder: "Sekurang-kurangnya 12 aksara",
    updatePassword: "Kemas kini kata laluan",
    updatingPassword: "Mengemas kini kata laluan...",
    passwordProblem: "Kata laluan tidak dikemas kini",
    passwordUpdated:
      "Kata laluan dikemas kini. Log masuk dengan kata laluan baharu anda.",
    backToLogin: "Kembali ke log masuk",
    requestNewLink: "Minta pautan pemulihan baharu",
  },
  zh: {
    platformKicker: "商业超级应用",
    tenantKicker: "专属商业工作台",
    platformTitle: "安全恢复账号访问。",
    tenantTitle: "重新进入可信商业工作台。",
    platformDescription: "通过验证邮件链接为您的 Plexus 账号设置新密码。",
    tenantDescription: "恢复链接会带您返回正确的企业工作台。",
    poweredBy: "由 Plexus 提供支持",
    forgotTitle: "重置密码",
    forgotPrompt: "输入账号邮箱，我们将发送安全的恢复链接。",
    email: "邮箱",
    emailPlaceholder: "you@company.com",
    sendLink: "发送恢复链接",
    sendingLink: "正在发送...",
    checkInbox: "请检查邮箱",
    checkInboxDescription: "如果该邮箱匹配有效账号，恢复链接将发送给您。",
    requestProblem: "无法继续",
    invalidLinkTitle: "恢复链接不可用",
    invalidLinkDescription: "该恢复链接无效或已过期，请重新申请。",
    resetTitle: "设置新密码",
    resetPrompt: "设置至少 12 个字符的新密码，然后重新登录。",
    newPassword: "新密码",
    confirmPassword: "确认新密码",
    passwordPlaceholder: "至少 12 个字符",
    updatePassword: "更新密码",
    updatingPassword: "正在更新...",
    passwordProblem: "密码未更新",
    passwordUpdated: "密码已更新，请使用新密码登录。",
    backToLogin: "返回登录",
    requestNewLink: "重新申请恢复链接",
  },
  "zh-Hant": {
    platformKicker: "商業超級應用",
    tenantKicker: "專屬商業工作台",
    platformTitle: "安全恢復帳號存取。",
    tenantTitle: "重新進入可信商業工作台。",
    platformDescription: "透過驗證郵件連結為您的 Plexus 帳號設定新密碼。",
    tenantDescription: "恢復連結會帶您返回正確的企業工作台。",
    poweredBy: "由 Plexus 提供支援",
    forgotTitle: "重設密碼",
    forgotPrompt: "輸入帳號電郵，我們將傳送安全的恢復連結。",
    email: "電郵",
    emailPlaceholder: "you@company.com",
    sendLink: "傳送恢復連結",
    sendingLink: "正在傳送...",
    checkInbox: "請檢查郵箱",
    checkInboxDescription: "如果該電郵符合有效帳號，恢復連結將傳送給您。",
    requestProblem: "無法繼續",
    invalidLinkTitle: "恢復連結不可用",
    invalidLinkDescription: "該恢復連結無效或已過期，請重新申請。",
    resetTitle: "設定新密碼",
    resetPrompt: "設定至少 12 個字元的新密碼，然後重新登入。",
    newPassword: "新密碼",
    confirmPassword: "確認新密碼",
    passwordPlaceholder: "至少 12 個字元",
    updatePassword: "更新密碼",
    updatingPassword: "正在更新...",
    passwordProblem: "密碼未更新",
    passwordUpdated: "密碼已更新，請使用新密碼登入。",
    backToLogin: "返回登入",
    requestNewLink: "重新申請恢復連結",
  },
  th: {
    platformKicker: "ซูเปอร์แอปสำหรับธุรกิจ",
    tenantKicker: "พื้นที่ทำงานธุรกิจส่วนตัว",
    platformTitle: "กู้คืนการเข้าถึงอย่างปลอดภัย",
    tenantTitle: "กลับสู่พื้นที่ทำงานธุรกิจที่เชื่อถือได้",
    platformDescription:
      "ใช้ลิงก์อีเมลที่ยืนยันแล้วเพื่อตั้งรหัสผ่านใหม่สำหรับบัญชี Plexus",
    tenantDescription:
      "ลิงก์กู้คืนจะพาคุณกลับไปยังพื้นที่ทำงานขององค์กรที่ถูกต้อง",
    poweredBy: "ขับเคลื่อนโดย Plexus",
    forgotTitle: "รีเซ็ตรหัสผ่าน",
    forgotPrompt: "กรอกอีเมลบัญชีเพื่อรับลิงก์กู้คืนที่ปลอดภัย",
    email: "อีเมล",
    emailPlaceholder: "you@company.com",
    sendLink: "ส่งลิงก์กู้คืน",
    sendingLink: "กำลังส่ง...",
    checkInbox: "ตรวจสอบกล่องจดหมาย",
    checkInboxDescription:
      "หากมีบัญชีที่ใช้งานได้ตรงกับอีเมลนี้ ระบบจะส่งลิงก์กู้คืนให้",
    requestProblem: "ไม่สามารถดำเนินการต่อ",
    invalidLinkTitle: "ลิงก์กู้คืนใช้ไม่ได้",
    invalidLinkDescription: "ลิงก์ไม่ถูกต้องหรือหมดอายุแล้ว โปรดขอลิงก์ใหม่",
    resetTitle: "ตั้งรหัสผ่านใหม่",
    resetPrompt: "เลือกรหัสผ่านอย่างน้อย 12 ตัวอักษร แล้วเข้าสู่ระบบอีกครั้ง",
    newPassword: "รหัสผ่านใหม่",
    confirmPassword: "ยืนยันรหัสผ่านใหม่",
    passwordPlaceholder: "อย่างน้อย 12 ตัวอักษร",
    updatePassword: "อัปเดตรหัสผ่าน",
    updatingPassword: "กำลังอัปเดต...",
    passwordProblem: "ไม่ได้อัปเดตรหัสผ่าน",
    passwordUpdated: "อัปเดตรหัสผ่านแล้ว โปรดเข้าสู่ระบบด้วยรหัสผ่านใหม่",
    backToLogin: "กลับไปหน้าเข้าสู่ระบบ",
    requestNewLink: "ขอลิงก์กู้คืนใหม่",
  },
}

const setupCopy: Partial<
  Record<
    Locale,
    {
      title: string
      prompt: string
      submit: string
      submitting: string
      success: string
    }
  >
> & {
  en: {
    title: string
    prompt: string
    submit: string
    submitting: string
    success: string
  }
} = {
  en: {
    title: "Set up your Vendor account",
    prompt:
      "Your application was approved. Choose a password of at least 12 characters to activate secure access.",
    submit: "Set password",
    submitting: "Setting password...",
    success: "Account ready. Sign in with your new password.",
  },
  ms: {
    title: "Sediakan akaun Vendor anda",
    prompt:
      "Permohonan anda telah diluluskan. Pilih kata laluan sekurang-kurangnya 12 aksara untuk mengaktifkan akses selamat.",
    submit: "Tetapkan kata laluan",
    submitting: "Menetapkan kata laluan...",
    success: "Akaun sedia. Log masuk dengan kata laluan baharu anda.",
  },
  zh: {
    title: "设置您的供应商账号",
    prompt: "您的申请已获批准。请设置至少 12 个字符的密码以启用安全访问。",
    submit: "设置密码",
    submitting: "正在设置...",
    success: "账号已准备就绪，请使用新密码登录。",
  },
  "zh-Hant": {
    title: "設定您的供應商帳號",
    prompt: "您的申請已獲批准。請設定至少 12 個字元的密碼以啟用安全存取。",
    submit: "設定密碼",
    submitting: "正在設定...",
    success: "帳號已準備就緒，請使用新密碼登入。",
  },
  th: {
    title: "ตั้งค่าบัญชี Vendor",
    prompt:
      "ใบสมัครได้รับอนุมัติแล้ว โปรดตั้งรหัสผ่านอย่างน้อย 12 ตัวอักษรเพื่อเปิดใช้งานบัญชี",
    submit: "ตั้งรหัสผ่าน",
    submitting: "กำลังตั้งรหัสผ่าน...",
    success: "บัญชีพร้อมใช้งานแล้ว โปรดเข้าสู่ระบบด้วยรหัสผ่านใหม่",
  },
}

export function ForgotPasswordForm({
  locale,
  branding,
  invalidLink = false,
}: {
  locale: Locale
  branding: LoginBranding
  invalidLink?: boolean
}) {
  const [state, formAction, isPending] = useActionState<
    PasswordRecoveryActionState,
    FormData
  >(requestPasswordResetAction, {})
  const t = { ...copy.en, ...(copy[locale] ?? {}) }
  const loginPath = getLoginPath(locale, branding.slug)

  return (
    <RecoveryShell
      locale={locale}
      branding={branding}
      title={t.forgotTitle}
      prompt={t.forgotPrompt}
    >
      <form action={formAction}>
        <CardContent className="px-6 sm:px-8">
          <FieldGroup className="gap-4">
            <input type="hidden" name="locale" value={locale} />
            {branding.slug ? (
              <input type="hidden" name="tenantSlug" value={branding.slug} />
            ) : null}

            {invalidLink ? (
              <Alert
                variant="destructive"
                className="border-amber-200/20 bg-amber-950/25 text-amber-50"
              >
                <HugeiconsIcon icon={Alert02Icon} strokeWidth={1.7} />
                <AlertTitle>{t.invalidLinkTitle}</AlertTitle>
                <AlertDescription className="text-amber-50/78">
                  {t.invalidLinkDescription}
                </AlertDescription>
              </Alert>
            ) : null}

            {state.sent ? (
              <Alert
                aria-live="polite"
                className="border-cyan-200/20 bg-cyan-950/25 text-cyan-50"
              >
                <HugeiconsIcon icon={ShieldUserIcon} strokeWidth={1.7} />
                <AlertTitle>{t.checkInbox}</AlertTitle>
                <AlertDescription className="text-cyan-50/78">
                  {t.checkInboxDescription}
                </AlertDescription>
              </Alert>
            ) : (
              <Field className="gap-2">
                <FieldLabel
                  htmlFor="recoveryEmail"
                  className="text-xs font-medium text-white/82"
                >
                  {t.email}
                </FieldLabel>
                <div className="relative">
                  <HugeiconsIcon
                    icon={Mail01Icon}
                    strokeWidth={1.6}
                    className="pointer-events-none absolute top-1/2 left-3.5 z-10 size-4 -translate-y-1/2 text-white/55"
                  />
                  <Input
                    id="recoveryEmail"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder={t.emailPlaceholder}
                    required
                    className="h-12 rounded-xl border-white/20 bg-white/10 pr-4 pl-10 text-sm text-white shadow-none placeholder:text-white/42 focus-visible:border-white/50 focus-visible:ring-white/18 md:text-sm"
                  />
                </div>
              </Field>
            )}

            {state.error ? (
              <Alert
                variant="destructive"
                aria-live="polite"
                className="border-red-200/20 bg-red-950/25 text-red-50"
              >
                <HugeiconsIcon icon={Alert02Icon} strokeWidth={1.7} />
                <AlertTitle>{t.requestProblem}</AlertTitle>
                <AlertDescription className="text-red-50/78">
                  {state.error}
                </AlertDescription>
              </Alert>
            ) : null}

            {!state.sent ? (
              <Button
                className="mt-1 h-12 w-full rounded-xl bg-[var(--login-accent)] text-sm font-semibold text-[var(--login-accent-foreground)] shadow-[0_14px_30px_rgba(14,9,39,0.2)] hover:bg-[var(--login-accent)] hover:opacity-92"
                type="submit"
                disabled={isPending}
              >
                <HugeiconsIcon
                  icon={Mail01Icon}
                  data-icon="inline-start"
                  strokeWidth={1.8}
                />
                {isPending ? t.sendingLink : t.sendLink}
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  data-icon="inline-end"
                  strokeWidth={1.8}
                />
              </Button>
            ) : null}
          </FieldGroup>
        </CardContent>

        <CardFooter className="mt-6 border-t border-white/12 px-6 py-5 sm:px-8">
          <Button
            asChild
            variant="outline"
            className="h-10 w-full rounded-lg border-white/18 bg-white/6 text-xs text-white hover:bg-white/12 hover:text-white"
          >
            <Link href={loginPath}>{t.backToLogin}</Link>
          </Button>
        </CardFooter>
      </form>
    </RecoveryShell>
  )
}

export function UpdatePasswordForm({
  locale,
  branding,
  recoveryReady,
  mode = "recovery",
}: {
  locale: Locale
  branding: LoginBranding
  recoveryReady: boolean
  mode?: PasswordRecoveryMode
}) {
  const router = useRouter()
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [state, formAction, isPending] = useActionState<
    UpdatePasswordActionState,
    FormData
  >(updatePasswordAction, {})
  const t = { ...copy.en, ...(copy[locale] ?? {}) }
  const setup = { ...setupCopy.en, ...(setupCopy[locale] ?? {}) }
  const isSetup = mode === "setup"
  const forgotPasswordPath = getForgotPasswordPath(locale, branding.slug)

  useEffect(() => {
    if (state.error) {
      toast.error(state.error)
    }

    if (state.redirectTo) {
      toast.success(isSetup ? setup.success : t.passwordUpdated)
      router.replace(state.redirectTo)
    }
  }, [
    isSetup,
    router,
    setup.success,
    state.error,
    state.redirectTo,
    t.passwordUpdated,
  ])

  return (
    <RecoveryShell
      locale={locale}
      branding={branding}
      title={isSetup ? setup.title : t.resetTitle}
      prompt={isSetup ? setup.prompt : t.resetPrompt}
    >
      {recoveryReady ? (
        <form action={formAction}>
          <CardContent className="px-6 sm:px-8">
            <FieldGroup className="gap-4">
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="mode" value={mode} />
              {branding.slug ? (
                <input type="hidden" name="tenantSlug" value={branding.slug} />
              ) : null}

              <PasswordField
                id="newPassword"
                name="password"
                label={t.newPassword}
                placeholder={t.passwordPlaceholder}
                visible={passwordVisible}
                onToggle={() => setPasswordVisible((visible) => !visible)}
              />
              <PasswordField
                id="confirmPassword"
                name="confirmPassword"
                label={t.confirmPassword}
                placeholder={t.passwordPlaceholder}
                visible={passwordVisible}
                onToggle={() => setPasswordVisible((visible) => !visible)}
              />

              {state.error ? (
                <Alert
                  variant="destructive"
                  aria-live="polite"
                  className="border-red-200/20 bg-red-950/25 text-red-50"
                >
                  <HugeiconsIcon icon={Alert02Icon} strokeWidth={1.7} />
                  <AlertTitle>{t.passwordProblem}</AlertTitle>
                  <AlertDescription className="text-red-50/78">
                    {state.error}
                  </AlertDescription>
                </Alert>
              ) : null}

              <Button
                className="mt-1 h-12 w-full rounded-xl bg-[var(--login-accent)] text-sm font-semibold text-[var(--login-accent-foreground)] shadow-[0_14px_30px_rgba(14,9,39,0.2)] hover:bg-[var(--login-accent)] hover:opacity-92"
                type="submit"
                disabled={isPending}
              >
                <HugeiconsIcon
                  icon={LockPasswordIcon}
                  data-icon="inline-start"
                  strokeWidth={1.8}
                />
                {isPending
                  ? isSetup
                    ? setup.submitting
                    : t.updatingPassword
                  : isSetup
                    ? setup.submit
                    : t.updatePassword}
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  data-icon="inline-end"
                  strokeWidth={1.8}
                />
              </Button>
            </FieldGroup>
          </CardContent>
        </form>
      ) : (
        <>
          <CardContent className="px-6 sm:px-8">
            <Alert
              variant="destructive"
              className="border-amber-200/20 bg-amber-950/25 text-amber-50"
            >
              <HugeiconsIcon icon={Alert02Icon} strokeWidth={1.7} />
              <AlertTitle>{t.invalidLinkTitle}</AlertTitle>
              <AlertDescription className="text-amber-50/78">
                {t.invalidLinkDescription}
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="mt-6 border-t border-white/12 px-6 py-5 sm:px-8">
            <Button
              asChild
              className="h-11 w-full rounded-xl bg-[var(--login-accent)] text-sm font-semibold text-[var(--login-accent-foreground)] hover:bg-[var(--login-accent)] hover:opacity-92"
            >
              <Link href={forgotPasswordPath}>{t.requestNewLink}</Link>
            </Button>
          </CardFooter>
        </>
      )}
    </RecoveryShell>
  )
}

function RecoveryShell({
  locale,
  branding,
  title,
  prompt,
  children,
}: {
  locale: Locale
  branding: LoginBranding
  title: string
  prompt: string
  children: ReactNode
}) {
  const t = { ...copy.en, ...(copy[locale] ?? {}) }
  const isTenant = branding.mode === "tenant"
  const style = {
    "--login-accent": branding.primaryColor,
    "--login-accent-foreground": branding.accentForeground,
  } satisfies RecoveryStyle

  return (
    <main
      className="relative isolate min-h-svh overflow-hidden bg-[#24164d] text-white"
      style={style}
    >
      <Image
        src="/login-plexus-network-x.webp"
        alt=""
        fill
        priority
        sizes="100vw"
        className="pointer-events-none -z-10 object-cover object-center"
      />
      <div className="absolute inset-0 -z-10 bg-[#24164d]/12" />

      <div className="mx-auto grid min-h-svh w-full max-w-[1180px] items-center gap-8 px-5 py-7 sm:px-8 md:grid-cols-[minmax(0,1fr)_minmax(350px,0.82fr)] md:gap-10 md:px-10 lg:gap-16 lg:px-14">
        <section className="flex flex-col justify-end gap-6 md:min-h-[560px] md:pb-12">
          <div className="max-w-[470px]">
            <div className="mb-7 flex min-h-16 items-center">
              {isTenant ? (
                <TenantBrand branding={branding} poweredBy={t.poweredBy} />
              ) : (
                <Image
                  src="/plexus-wordmark-transparent.png"
                  alt="Plexus"
                  width={2170}
                  height={725}
                  priority
                  className="h-auto w-[190px] sm:w-[220px]"
                />
              )}
            </div>
            <p className="mb-3 text-xs font-semibold tracking-[0.24em] text-white/70 uppercase">
              {isTenant ? t.tenantKicker : t.platformKicker}
            </p>
            <h1 className="max-w-[440px] text-3xl leading-[1.08] font-semibold tracking-[-0.03em] text-white sm:text-4xl lg:text-[2.7rem]">
              {isTenant ? t.tenantTitle : t.platformTitle}
            </h1>
            <p className="mt-4 max-w-[430px] text-sm leading-6 text-white/72 sm:text-base">
              {isTenant ? t.tenantDescription : t.platformDescription}
            </p>
          </div>
        </section>

        <Card className="w-full gap-0 justify-self-end rounded-[1.65rem] bg-white/[0.07] py-0 text-white shadow-[0_30px_90px_rgba(1,5,24,0.52)] ring-1 ring-white/20 backdrop-blur-[32px] backdrop-saturate-150">
          <CardHeader className="gap-2 px-6 pt-7 pb-5 sm:px-8 sm:pt-8">
            <div className="mb-1 flex size-10 items-center justify-center rounded-xl bg-white/12 text-white ring-1 ring-white/16">
              <HugeiconsIcon icon={ShieldUserIcon} strokeWidth={1.7} />
            </div>
            <CardTitle
              role="heading"
              aria-level={2}
              className="text-[1.65rem] leading-tight font-semibold tracking-[-0.02em] text-white"
            >
              {title}
            </CardTitle>
            <p className="text-sm leading-6 text-white/68">{prompt}</p>
          </CardHeader>
          {children}
        </Card>
      </div>
    </main>
  )
}

function PasswordField({
  id,
  name,
  label,
  placeholder,
  visible,
  onToggle,
}: {
  id: string
  name: string
  label: string
  placeholder: string
  visible: boolean
  onToggle: () => void
}) {
  return (
    <Field className="gap-2">
      <FieldLabel htmlFor={id} className="text-xs font-medium text-white/82">
        {label}
      </FieldLabel>
      <div className="relative">
        <HugeiconsIcon
          icon={LockPasswordIcon}
          strokeWidth={1.6}
          className="pointer-events-none absolute top-1/2 left-3.5 z-10 size-4 -translate-y-1/2 text-white/55"
        />
        <Input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete="new-password"
          placeholder={placeholder}
          minLength={12}
          maxLength={128}
          required
          className="h-12 rounded-xl border-white/20 bg-white/10 pr-11 pl-10 text-sm text-white shadow-none placeholder:text-white/42 focus-visible:border-white/50 focus-visible:ring-white/18 md:text-sm"
        />
        <button
          type="button"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          onClick={onToggle}
          className="absolute top-1/2 right-3 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-white/55 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <HugeiconsIcon
            icon={visible ? EyeOffIcon : EyeIcon}
            strokeWidth={1.6}
            className="size-4"
          />
        </button>
      </div>
    </Field>
  )
}

function TenantBrand({
  branding,
  poweredBy,
}: {
  branding: LoginBranding
  poweredBy: string
}) {
  return (
    <div
      className="flex items-center gap-4"
      data-testid="tenant-recovery-brand"
    >
      {branding.logoUrl ? (
        // Tenant operators control this HTTPS or public-path image URL.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={branding.logoUrl}
          alt={`${branding.name} logo`}
          className="max-h-16 max-w-[220px] object-contain object-left"
        />
      ) : (
        <div
          className="flex size-14 shrink-0 items-center justify-center rounded-2xl text-xl font-semibold shadow-lg ring-1 ring-white/20"
          style={{
            backgroundColor: branding.primaryColor,
            color: branding.accentForeground,
          }}
          aria-hidden="true"
        >
          {branding.name.slice(0, 1).toUpperCase()}
        </div>
      )}
      <div>
        <p className="text-xl font-semibold tracking-[-0.02em] text-white">
          {branding.name}
        </p>
        <p className="mt-0.5 text-xs text-white/55">{poweredBy}</p>
      </div>
    </div>
  )
}
