"use client"

import Image from "next/image"
import Link from "next/link"
import { useActionState, useEffect, useState, type CSSProperties } from "react"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Alert02Icon,
  ArrowRight01Icon,
  CustomerSupportIcon,
  EyeIcon,
  EyeOffIcon,
  LockPasswordIcon,
  Login03Icon,
  Mail01Icon,
  ShieldUserIcon,
} from "@hugeicons/core-free-icons"
import { toast } from "sonner"

import { loginAction, type LoginActionState } from "@/app/actions/auth"
import type { Locale } from "@/lib/i18n"
import type { LoginErrorCode } from "@/lib/login-errors"
import { getForgotPasswordPath, getLoginPath } from "@/lib/password-recovery"
import type { LoginBranding } from "@/lib/tenant-login"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

type LoginCopy = Record<string, string>
type LoginStyle = CSSProperties & {
  "--login-accent": string
  "--login-accent-foreground": string
}

const copy: Partial<Record<Locale, LoginCopy>> & { en: LoginCopy } = {
  en: {
    platformTitle: "One governed workspace. Every responsible next step.",
    tenantTitle: "Build trusted business relationships in one place.",
    platformDescription:
      "Secure access for program operators, participating companies, and Plexus platform teams.",
    tenantDescription:
      "Your organization’s private gateway to people, partnerships, and progress.",
    checkpointIdentity: "Identity",
    checkpointWorkspace: "Workspace",
    checkpointNextStep: "Responsible next step",
    welcome: "Welcome back",
    platformPrompt: "Sign in to continue to your Plexus workspace.",
    tenantPrompt: "Sign in to continue to {name}.",
    email: "Email",
    emailPlaceholder: "you@company.com",
    password: "Password",
    passwordPlaceholder: "Enter your password",
    submit: "Sign in",
    submitting: "Signing in...",
    success: "Signed in. Opening your workspace.",
    forgotPassword: "Forgot password?",
    showPassword: "Show password",
    hidePassword: "Hide password",
    passwordUpdated: "Password updated. Sign in with your new password.",
    supportQuestion: "Need help accessing your account?",
    supportEmailAction: "Email workspace support",
    supportPageAction: "Open support options",
    poweredBy: "Powered by Plexus",
    loginProblem: "Cannot sign in",
    invalidEmail: "Enter a valid email address.",
    passwordRequired: "Enter your password.",
    invalidCredentials:
      "Email or password is incorrect. Check your details and try again.",
    accountNotReady:
      "This account is not ready to sign in. Contact support for help.",
    signInFailed: "We could not sign you in. Check your details and try again.",
    accountAccessUnavailable:
      "We could not open this account. Contact support to verify your access.",
    wrongWorkspace:
      "This account does not belong to this workspace. Use your organization’s sign-in page.",
    tenantUnavailableTitle: "Organization sign-in unavailable",
    tenantUnavailableDescription:
      "This organization link is unavailable. Continue with Plexus or contact support for the correct sign-in link.",
    previewTitle: "Brand preview",
    previewMessage: "Sign-in is disabled in preview mode.",
    previewSubmit: "Preview only",
  },
  zh: {
    platformTitle: "一个受治理的工作台，承接每个负责任的下一步。",
    tenantTitle: "在一个平台建立可信的商业关系。",
    platformDescription:
      "为计划运营方、参与企业和 Plexus 平台团队提供安全访问。",
    tenantDescription: "您的企业专属入口，连接人才、伙伴与增长。",
    checkpointIdentity: "身份",
    checkpointWorkspace: "工作区",
    checkpointNextStep: "负责任的下一步",
    welcome: "欢迎回来",
    platformPrompt: "登录以继续进入您的 Plexus 工作台。",
    tenantPrompt: "登录以继续进入 {name}。",
    email: "邮箱",
    emailPlaceholder: "you@company.com",
    password: "密码",
    passwordPlaceholder: "请输入密码",
    submit: "登录",
    submitting: "登录中...",
    success: "登录成功，正在打开工作台。",
    forgotPassword: "忘记密码？",
    showPassword: "显示密码",
    hidePassword: "隐藏密码",
    passwordUpdated: "密码已更新，请使用新密码登录。",
    supportQuestion: "无法访问账号？",
    supportEmailAction: "发送邮件给工作区支持团队",
    supportPageAction: "查看支持方式",
    poweredBy: "由 Plexus 提供支持",
    loginProblem: "无法登录",
    invalidEmail: "请输入有效的邮箱地址。",
    passwordRequired: "请输入密码。",
    invalidCredentials: "邮箱或密码不正确，请检查后重试。",
    accountNotReady: "此账号尚未开放登录，请联系支持团队。",
    signInFailed: "暂时无法登录，请检查信息后重试。",
    accountAccessUnavailable:
      "暂时无法打开此账号，请联系支持团队核实访问权限。",
    wrongWorkspace: "此账号不属于该工作区，请使用贵组织的登录页面。",
    tenantUnavailableTitle: "组织登录入口不可用",
    tenantUnavailableDescription:
      "此组织链接目前不可用。您可以继续使用 Plexus 登录，或联系支持团队获取正确链接。",
    previewTitle: "品牌预览",
    previewMessage: "预览模式下已停用登录。",
    previewSubmit: "仅预览",
  },
  "zh-Hant": {
    platformTitle: "一個受治理的工作區，承接每個負責任的下一步。",
    tenantTitle: "在一個平台建立可信的商業關係。",
    platformDescription:
      "為計劃營運方、參與企業和 Plexus 平台團隊提供安全存取。",
    tenantDescription: "您的企業專屬入口，連結人才、夥伴與成長。",
    checkpointIdentity: "身分",
    checkpointWorkspace: "工作區",
    checkpointNextStep: "負責任的下一步",
    welcome: "歡迎回來",
    platformPrompt: "登入以繼續進入您的 Plexus 工作台。",
    tenantPrompt: "登入以繼續進入 {name}。",
    email: "電郵",
    emailPlaceholder: "you@company.com",
    password: "密碼",
    passwordPlaceholder: "請輸入密碼",
    submit: "登入",
    submitting: "登入中...",
    success: "登入成功，正在開啟工作台。",
    forgotPassword: "忘記密碼？",
    showPassword: "顯示密碼",
    hidePassword: "隱藏密碼",
    passwordUpdated: "密碼已更新，請使用新密碼登入。",
    supportQuestion: "無法存取帳號？",
    supportEmailAction: "傳送電郵給工作區支援團隊",
    supportPageAction: "查看支援方式",
    poweredBy: "由 Plexus 提供支援",
    loginProblem: "無法登入",
    invalidEmail: "請輸入有效的電郵地址。",
    passwordRequired: "請輸入密碼。",
    invalidCredentials: "電郵或密碼不正確，請檢查後重試。",
    accountNotReady: "此帳號尚未開放登入，請聯絡支援團隊。",
    signInFailed: "暫時無法登入，請檢查資料後重試。",
    accountAccessUnavailable:
      "暫時無法開啟此帳號，請聯絡支援團隊核實存取權限。",
    wrongWorkspace: "此帳號不屬於該工作區，請使用貴組織的登入頁面。",
    tenantUnavailableTitle: "組織登入入口無法使用",
    tenantUnavailableDescription:
      "此組織連結目前無法使用。您可以繼續使用 Plexus 登入，或聯絡支援團隊取得正確連結。",
    previewTitle: "品牌預覽",
    previewMessage: "預覽模式下已停用登入。",
    previewSubmit: "僅預覽",
  },
  th: {
    platformTitle: "พื้นที่ทำงานที่มีการกำกับดูแลสำหรับทุกขั้นตอนถัดไป",
    tenantTitle: "สร้างความสัมพันธ์ทางธุรกิจที่เชื่อถือได้ในที่เดียว",
    platformDescription:
      "การเข้าถึงที่ปลอดภัยสำหรับผู้ดำเนินโครงการ บริษัทที่เข้าร่วม และทีมแพลตฟอร์ม Plexus",
    tenantDescription: "ประตูส่วนตัวขององค์กรสู่ผู้คน พันธมิตร และความก้าวหน้า",
    checkpointIdentity: "ตัวตน",
    checkpointWorkspace: "พื้นที่ทำงาน",
    checkpointNextStep: "ขั้นตอนถัดไปที่รับผิดชอบ",
    welcome: "ยินดีต้อนรับกลับ",
    platformPrompt: "เข้าสู่ระบบเพื่อไปยังพื้นที่ทำงาน Plexus ของคุณ",
    tenantPrompt: "เข้าสู่ระบบเพื่อไปยัง {name}",
    email: "อีเมล",
    emailPlaceholder: "you@company.com",
    password: "รหัสผ่าน",
    passwordPlaceholder: "ป้อนรหัสผ่านของคุณ",
    submit: "เข้าสู่ระบบ",
    submitting: "กำลังเข้าสู่ระบบ...",
    success: "เข้าสู่ระบบแล้ว กำลังเปิดพื้นที่ทำงาน",
    forgotPassword: "ลืมรหัสผ่าน?",
    showPassword: "แสดงรหัสผ่าน",
    hidePassword: "ซ่อนรหัสผ่าน",
    passwordUpdated: "อัปเดตรหัสผ่านแล้ว โปรดเข้าสู่ระบบด้วยรหัสผ่านใหม่",
    supportQuestion: "ต้องการความช่วยเหลือในการเข้าถึงบัญชี?",
    supportEmailAction: "ส่งอีเมลถึงฝ่ายสนับสนุนของพื้นที่ทำงาน",
    supportPageAction: "ดูช่องทางช่วยเหลือ",
    poweredBy: "ขับเคลื่อนโดย Plexus",
    loginProblem: "เข้าสู่ระบบไม่ได้",
    invalidEmail: "กรุณากรอกอีเมลที่ถูกต้อง",
    passwordRequired: "กรุณากรอกรหัสผ่าน",
    invalidCredentials:
      "อีเมลหรือรหัสผ่านไม่ถูกต้อง โปรดตรวจสอบแล้วลองอีกครั้ง",
    accountNotReady:
      "บัญชีนี้ยังไม่พร้อมสำหรับการเข้าสู่ระบบ โปรดติดต่อฝ่ายสนับสนุน",
    signInFailed:
      "เราไม่สามารถให้คุณเข้าสู่ระบบได้ โปรดตรวจสอบข้อมูลแล้วลองอีกครั้ง",
    accountAccessUnavailable:
      "เราไม่สามารถเปิดบัญชีนี้ได้ โปรดติดต่อฝ่ายสนับสนุนเพื่อตรวจสอบสิทธิ์",
    wrongWorkspace:
      "บัญชีนี้ไม่ได้อยู่ในพื้นที่ทำงานนี้ โปรดใช้หน้าลงชื่อเข้าใช้ขององค์กรคุณ",
    tenantUnavailableTitle: "หน้าลงชื่อเข้าใช้ขององค์กรไม่พร้อมใช้งาน",
    tenantUnavailableDescription:
      "ลิงก์ขององค์กรนี้ไม่พร้อมใช้งาน คุณสามารถเข้าสู่ระบบ Plexus ต่อ หรือขอลิงก์ที่ถูกต้องจากฝ่ายสนับสนุน",
    previewTitle: "ตัวอย่างแบรนด์",
    previewMessage: "ปิดการเข้าสู่ระบบในโหมดตัวอย่าง",
    previewSubmit: "ดูตัวอย่างเท่านั้น",
  },
}

const loginErrorCopyKeys: Record<LoginErrorCode, string> = {
  invalid_email: "invalidEmail",
  password_required: "passwordRequired",
  invalid_credentials: "invalidCredentials",
  account_not_ready: "accountNotReady",
  sign_in_failed: "signInFailed",
  account_access_unavailable: "accountAccessUnavailable",
  wrong_workspace: "wrongWorkspace",
}

function getPublicSupportPath(locale: Locale) {
  const publicLocale =
    locale === "zh" || locale === "zh-Hant" ? "zh-Hant" : "en"

  return `/contact?lang=${publicLocale}`
}

export function LoginForm({
  locale,
  branding,
  passwordUpdated = false,
  previewMode = false,
}: {
  locale: Locale
  branding: LoginBranding
  passwordUpdated?: boolean
  previewMode?: boolean
}) {
  const router = useRouter()
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [showPasswordUpdated] = useState(passwordUpdated)
  const [state, formAction, isPending] = useActionState<
    LoginActionState,
    FormData
  >(loginAction, {})
  const t = { ...copy.en, ...(copy[locale] ?? {}) }
  const isTenant = branding.mode === "tenant"
  const prompt = (isTenant ? t.tenantPrompt : t.platformPrompt).replace(
    "{name}",
    branding.name
  )
  const forgotPasswordPath = getForgotPasswordPath(locale, branding.slug)
  const supportPath = getPublicSupportPath(locale)
  const errorMessage = state.errorCode
    ? t[loginErrorCopyKeys[state.errorCode]]
    : undefined
  const loginStyle = {
    "--login-accent": isTenant ? branding.primaryColor : "#0668e8",
    "--login-accent-foreground": isTenant
      ? branding.accentForeground
      : "#ffffff",
  } satisfies LoginStyle

  useEffect(() => {
    if (state.redirectTo) {
      toast.success(t.success)
      router.push(state.redirectTo)
    }
  }, [router, state.redirectTo, t.success])

  useEffect(() => {
    if (passwordUpdated) {
      router.replace(getLoginPath(locale, branding.slug), { scroll: false })
    }
  }, [branding.slug, locale, passwordUpdated, router])

  return (
    <main
      className="login-checkpoint min-h-svh overflow-x-hidden bg-[#e7edf2] p-[6px] text-[#071326] selection:bg-blue-100 selection:text-[#071326]"
      style={loginStyle}
    >
      {previewMode ? (
        <div
          role="status"
          className="absolute top-4 right-4 z-30 flex max-w-xs items-start gap-3 rounded-lg border border-[#c9d4df] bg-white px-4 py-3 text-[#071326] shadow-[0_18px_50px_rgba(7,19,38,0.16)]"
        >
          <HugeiconsIcon
            icon={EyeIcon}
            strokeWidth={1.7}
            className="mt-0.5 size-4 shrink-0 text-[#0758c8]"
          />
          <div>
            <p className="text-xs font-semibold">{t.previewTitle}</p>
            <p className="mt-0.5 text-[11px] text-[#52647d]">
              {t.previewMessage}
            </p>
          </div>
        </div>
      ) : null}

      <div className="mx-auto grid min-h-[calc(100svh-12px)] w-full overflow-hidden rounded-[9px] border border-[#c9d4de] bg-[#f4f8fb] shadow-[0_16px_42px_rgba(7,19,38,0.12)] lg:grid-cols-[326px_minmax(0,1fr)]">
        <aside
          data-login-rail
          className="relative overflow-hidden bg-[#010718] px-6 py-8 text-white lg:min-h-[calc(100svh-14px)] lg:px-0 lg:py-0"
        >
          <div
            data-login-network
            aria-hidden="true"
            className="absolute inset-0"
          >
            <Image
              src="/login-governed-network.webp"
              alt=""
              fill
              loading="eager"
              unoptimized
              sizes="(min-width: 1024px) 1586px, 100vw"
              className="pointer-events-none object-cover object-center"
            />
            <div className="absolute inset-0 bg-[#010718]/[0.12]" />
            <Image
              src="/login-governed-network.webp"
              alt=""
              fill
              loading="eager"
              unoptimized
              sizes="(min-width: 1024px) 1586px, 100vw"
              className="login-network-twinkle pointer-events-none object-cover object-center"
            />
          </div>

          <Image
            src="/login-plexus-network-x.webp"
            alt=""
            width={1586}
            height={992}
            loading="eager"
            sizes="550px"
            className="login-plexus-x-field pointer-events-none absolute top-[183px] left-[48px] z-[3] hidden h-auto w-[550px] max-w-none mix-blend-screen lg:block"
          />

          <div className="relative z-10 lg:absolute lg:top-[345px] lg:left-[41px]">
            {isTenant ? (
              <TenantBrand branding={branding} poweredBy={t.poweredBy} />
            ) : (
              <Image
                src="/plexus-wordmark-transparent.png"
                alt="Plexus"
                width={2170}
                height={725}
                loading="eager"
                className="h-auto w-[208px] lg:w-[226px]"
              />
            )}
          </div>

          <div className="relative z-10 mt-8 lg:absolute lg:top-[455px] lg:left-[41px] lg:mt-0">
            <h1 className="max-w-[244px] text-[28px] leading-[1.2] font-semibold tracking-[-0.03em] text-white lg:text-[29px]">
              {isTenant ? t.tenantTitle : t.platformTitle}
            </h1>
            <p className="mt-6 max-w-[238px] text-[16px] leading-7 text-[#d4dfed] lg:mt-5">
              {isTenant ? t.tenantDescription : t.platformDescription}
            </p>
          </div>
        </aside>

        <section
          data-login-checkpoint-canvas
          className="flex min-w-0 flex-col bg-[#f4f8fb]"
        >
          <header className="h-[88px] shrink-0 px-6 sm:px-8 lg:h-[112px] lg:px-[42px]">
            <div
              data-login-stage-grid
              className="grid h-full grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.25fr)] border-b border-[#cbd6e0] lg:grid-cols-[44%_34%_22%]"
            >
              <div className="relative flex min-w-0 items-end gap-3 pb-5 font-mono text-[10px] leading-4 font-medium tracking-[0.055em] text-[#071326] uppercase after:absolute after:bottom-[-1px] after:left-0 after:h-[3px] after:w-[104px] after:max-w-full after:bg-[var(--login-accent)] lg:items-start lg:pt-[68px] lg:pb-0 lg:text-[12px]">
                <span className="text-[var(--login-accent)]">01</span>
                <span className="truncate">{t.checkpointIdentity}</span>
              </div>
              <div className="flex min-w-0 items-end gap-3 pb-5 pl-3 font-mono text-[10px] leading-4 font-medium tracking-[0.055em] text-[#5a6880] uppercase lg:items-start lg:pt-[68px] lg:pb-0 lg:pl-3 lg:text-[12px]">
                <span>02</span>
                <span className="truncate">{t.checkpointWorkspace}</span>
              </div>
              <div className="flex min-w-0 items-end gap-3 pb-5 pl-3 font-mono text-[10px] leading-4 font-medium tracking-[0.055em] text-[#5a6880] uppercase lg:items-start lg:pt-[68px] lg:pb-0 lg:pl-3 lg:text-[12px]">
                <span>03</span>
                <span className="line-clamp-2">{t.checkpointNextStep}</span>
              </div>
            </div>
          </header>

          <div className="grid min-h-0 flex-1 grid-cols-1 px-6 sm:px-8 lg:grid-cols-[44%_34%_22%] lg:px-[42px]">
            <div className="min-w-0 py-10 lg:border-r lg:border-[#cbd6e0] lg:pt-[99px] lg:pr-[46px] lg:pb-16 lg:pl-1">
              <div className="max-w-[462px]">
                <header>
                  <h2 className="text-[29px] leading-[1.2] font-semibold tracking-[-0.03em] text-[#071326]">
                    {t.welcome}
                  </h2>
                  <p className="mt-3 text-[16px] leading-7 text-[#5d6c83] lg:text-[17px]">
                    {prompt}
                  </p>
                </header>

                <form
                  action={previewMode ? undefined : formAction}
                  aria-busy={isPending}
                  className="mt-12 lg:mt-14"
                  onSubmit={
                    previewMode ? (event) => event.preventDefault() : undefined
                  }
                >
                  <FieldGroup className="gap-6 lg:gap-7">
                    <input type="hidden" name="locale" value={locale} />
                    {branding.slug ? (
                      <input
                        type="hidden"
                        name="tenantSlug"
                        value={branding.slug}
                      />
                    ) : null}

                    {branding.tenantUnavailable ? (
                      <Alert
                        aria-live="polite"
                        className="border-[#b9cbe0] bg-[#edf5fd] text-[#071326]"
                      >
                        <HugeiconsIcon
                          icon={ShieldUserIcon}
                          strokeWidth={1.7}
                        />
                        <AlertTitle>{t.tenantUnavailableTitle}</AlertTitle>
                        <AlertDescription className="text-[#52647d]">
                          {t.tenantUnavailableDescription}
                        </AlertDescription>
                      </Alert>
                    ) : null}

                    <Field className="gap-2">
                      <FieldLabel
                        htmlFor="email"
                        className="text-[15px] font-medium text-[#071326]"
                      >
                        {t.email}
                      </FieldLabel>
                      <div className="relative">
                        <HugeiconsIcon
                          icon={Mail01Icon}
                          strokeWidth={1.6}
                          className="pointer-events-none absolute top-1/2 left-4 z-10 size-5 -translate-y-1/2 text-[#8ea0b9]"
                        />
                        <Input
                          data-login-input
                          id="email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          placeholder={t.emailPlaceholder}
                          required
                          disabled={previewMode}
                          aria-invalid={state.errorCode === "invalid_email"}
                          aria-describedby={
                            errorMessage ? "login-error" : undefined
                          }
                          className="h-[62px] rounded-[7px] border-[#c5d1dd] bg-white/65 pr-4 pl-[50px] text-[16px] text-[#071326] caret-[#0758c8] shadow-none placeholder:text-[#97a8bf] focus-visible:border-[#0758c8] focus-visible:ring-[#0758c8]/15 md:text-[16px]"
                        />
                      </div>
                    </Field>

                    <Field className="gap-2">
                      <div className="flex items-center justify-between gap-3">
                        <FieldLabel
                          htmlFor="password"
                          className="text-[15px] font-medium text-[#071326]"
                        >
                          {t.password}
                        </FieldLabel>
                        {previewMode ? (
                          <span className="inline-flex min-h-11 items-center text-[14px] font-medium text-[#8290a4]">
                            {t.forgotPassword}
                          </span>
                        ) : (
                          <Link
                            href={forgotPasswordPath}
                            className="-my-3 inline-flex min-h-11 items-center px-1 text-[14px] font-medium text-[#0758c8] underline-offset-4 transition hover:underline focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0758c8]"
                          >
                            {t.forgotPassword}
                          </Link>
                        )}
                      </div>
                      <div className="relative">
                        <HugeiconsIcon
                          icon={LockPasswordIcon}
                          strokeWidth={1.6}
                          className="pointer-events-none absolute top-1/2 left-4 z-10 size-5 -translate-y-1/2 text-[#8ea0b9]"
                        />
                        <Input
                          data-login-input
                          id="password"
                          name="password"
                          type={passwordVisible ? "text" : "password"}
                          autoComplete="current-password"
                          placeholder={t.passwordPlaceholder}
                          required
                          disabled={previewMode}
                          aria-invalid={state.errorCode === "password_required"}
                          aria-describedby={
                            errorMessage ? "login-error" : undefined
                          }
                          className="h-[62px] rounded-[7px] border-[#c5d1dd] bg-white/65 pr-14 pl-[50px] text-[16px] text-[#071326] caret-[#0758c8] shadow-none placeholder:text-[#97a8bf] focus-visible:border-[#0758c8] focus-visible:ring-[#0758c8]/15 md:text-[16px]"
                        />
                        <button
                          type="button"
                          aria-label={
                            passwordVisible ? t.hidePassword : t.showPassword
                          }
                          aria-pressed={passwordVisible}
                          onClick={() =>
                            setPasswordVisible((visible) => !visible)
                          }
                          disabled={previewMode}
                          className="absolute top-1/2 right-1.5 flex size-11 -translate-y-1/2 items-center justify-center rounded-md text-[#8193ad] transition hover:bg-[#e8f0f7] hover:text-[#0758c8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0758c8]"
                        >
                          <HugeiconsIcon
                            icon={passwordVisible ? EyeOffIcon : EyeIcon}
                            strokeWidth={1.6}
                            className="size-4"
                          />
                        </button>
                      </div>
                    </Field>

                    {showPasswordUpdated ? (
                      <Alert
                        aria-live="polite"
                        aria-atomic="true"
                        className="border-[#b9cbe0] bg-[#edf5fd] text-[#071326]"
                      >
                        <HugeiconsIcon
                          icon={ShieldUserIcon}
                          strokeWidth={1.7}
                        />
                        <AlertTitle>{t.passwordUpdated}</AlertTitle>
                      </Alert>
                    ) : null}

                    {errorMessage ? (
                      <Alert
                        id="login-error"
                        variant="destructive"
                        aria-live="polite"
                        aria-atomic="true"
                        className="border-red-200 bg-red-50 text-red-900"
                      >
                        <HugeiconsIcon icon={Alert02Icon} strokeWidth={1.7} />
                        <AlertTitle>{t.loginProblem}</AlertTitle>
                        <AlertDescription className="text-red-800">
                          {errorMessage}
                        </AlertDescription>
                      </Alert>
                    ) : null}

                    <Button
                      className="h-[62px] w-full rounded-[7px] bg-[var(--login-accent)] text-[16px] font-semibold text-[var(--login-accent-foreground)] shadow-none hover:bg-[var(--login-accent)] hover:brightness-105 focus-visible:ring-2 focus-visible:ring-[#0758c8]/35 disabled:opacity-55"
                      type="submit"
                      disabled={isPending || previewMode}
                    >
                      <HugeiconsIcon
                        icon={Login03Icon}
                        data-icon="inline-start"
                        strokeWidth={1.8}
                      />
                      {previewMode
                        ? t.previewSubmit
                        : isPending
                          ? t.submitting
                          : t.submit}
                      <HugeiconsIcon
                        icon={ArrowRight01Icon}
                        data-icon="inline-end"
                        strokeWidth={1.8}
                      />
                    </Button>
                  </FieldGroup>

                  <footer className="mt-[30px] border-t border-[#cbd6e0] pt-6">
                    <p className="text-[14px] leading-6 text-[#65758d]">
                      {t.supportQuestion}
                    </p>
                    {branding.supportEmail ? (
                      <a
                        href={`mailto:${branding.supportEmail}`}
                        className="mt-2 inline-flex min-h-11 items-center gap-2 text-[14px] font-semibold text-[#0758c8] underline-offset-4 hover:underline focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0758c8]"
                      >
                        <HugeiconsIcon
                          icon={CustomerSupportIcon}
                          strokeWidth={1.7}
                          className="size-5"
                        />
                        {t.supportEmailAction}
                      </a>
                    ) : (
                      <Link
                        href={supportPath}
                        className="mt-2 inline-flex min-h-11 items-center gap-2 text-[14px] font-semibold text-[#0758c8] underline-offset-4 hover:underline focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0758c8]"
                      >
                        <HugeiconsIcon
                          icon={CustomerSupportIcon}
                          strokeWidth={1.7}
                          className="size-5"
                        />
                        {t.supportPageAction}
                      </Link>
                    )}
                  </footer>
                </form>
              </div>
            </div>
            <div
              aria-hidden="true"
              className="hidden border-r border-[#cbd6e0] lg:block"
            />
            <div aria-hidden="true" className="hidden lg:block" />
          </div>
        </section>
      </div>
    </main>
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
    <div className="flex items-center gap-3" data-testid="tenant-login-brand">
      {branding.logoUrl ? (
        // Tenant operators control this HTTPS or public-path image URL.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={branding.logoUrl}
          alt={`${branding.name} logo`}
          className="max-h-12 max-w-[190px] object-contain object-left"
        />
      ) : (
        <div
          className="flex size-11 shrink-0 items-center justify-center rounded-xl text-lg font-semibold"
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
        <p className="text-lg font-semibold tracking-[-0.02em] text-white">
          {branding.name}
        </p>
        <p className="mt-0.5 text-xs text-white/55">{poweredBy}</p>
      </div>
    </div>
  )
}
