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
import { getForgotPasswordPath } from "@/lib/password-recovery"
import type { LoginBranding } from "@/lib/tenant-login"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type LoginCopy = Record<string, string>
type LoginStyle = CSSProperties & {
  "--login-accent": string
  "--login-accent-foreground": string
}

const copy: Partial<Record<Locale, LoginCopy>> & { en: LoginCopy } = {
  en: {
    platformKicker: "The business superapp",
    tenantKicker: "Private business workspace",
    platformTitle: "Discover. Connect. Agree. Grow.",
    tenantTitle: "Build trusted business relationships in one place.",
    platformDescription:
      "One secure workspace for every connection, conversation, and opportunity.",
    tenantDescription:
      "Your organization’s private gateway to people, partnerships, and progress.",
    welcome: "Welcome back",
    platformPrompt: "Sign in to continue to your Plexus workspace.",
    tenantPrompt: "Sign in to continue to {name}.",
    email: "Email",
    emailPlaceholder: "you@company.com",
    password: "Password",
    passwordPlaceholder: "Enter your password",
    remember: "Remember me",
    submit: "Login",
    submitting: "Signing in...",
    success: "Logged in. Opening your workspace.",
    secureAccess: "Protected workspace access",
    forgotPassword: "Forgot password?",
    passwordUpdated: "Password updated. Sign in with your new password.",
    supportQuestion: "Need help accessing your account?",
    supportAction: "Contact support",
    supportFallback: "Contact your workspace administrator.",
    poweredBy: "Powered by Plexus",
    loginProblem: "Cannot log in",
    previewTitle: "Brand preview",
    previewMessage: "Sign-in is disabled in preview mode.",
    previewSubmit: "Preview only",
  },
  zh: {
    platformKicker: "商业超级应用",
    tenantKicker: "专属商业工作台",
    platformTitle: "发现、连接、合作、成长。",
    tenantTitle: "在一个平台建立可信的商业关系。",
    platformDescription: "一个安全工作台，连接每次交流、合作与机遇。",
    tenantDescription: "您的企业专属入口，连接人才、伙伴与增长。",
    welcome: "欢迎回来",
    platformPrompt: "登录以继续进入您的 Plexus 工作台。",
    tenantPrompt: "登录以继续进入 {name}。",
    email: "邮箱",
    emailPlaceholder: "you@company.com",
    password: "密码",
    passwordPlaceholder: "请输入密码",
    remember: "记住我",
    submit: "登录",
    submitting: "登录中...",
    success: "登录成功，正在打开工作台。",
    secureAccess: "受保护的工作台访问",
    forgotPassword: "忘记密码？",
    passwordUpdated: "密码已更新，请使用新密码登录。",
    supportQuestion: "无法访问账号？",
    supportAction: "联系支持",
    supportFallback: "请联系您的工作台管理员。",
    poweredBy: "由 Plexus 提供支持",
    loginProblem: "无法登录",
    previewTitle: "品牌预览",
    previewMessage: "预览模式下已停用登录。",
    previewSubmit: "仅预览",
  },
  "zh-Hant": {
    platformKicker: "商業超級應用",
    tenantKicker: "專屬商業工作台",
    platformTitle: "發現、連結、合作、成長。",
    tenantTitle: "在一個平台建立可信的商業關係。",
    platformDescription: "一個安全工作台，連結每次交流、合作與機遇。",
    tenantDescription: "您的企業專屬入口，連結人才、夥伴與成長。",
    welcome: "歡迎回來",
    platformPrompt: "登入以繼續進入您的 Plexus 工作台。",
    tenantPrompt: "登入以繼續進入 {name}。",
    email: "電郵",
    emailPlaceholder: "you@company.com",
    password: "密碼",
    passwordPlaceholder: "請輸入密碼",
    remember: "記住我",
    submit: "登入",
    submitting: "登入中...",
    success: "登入成功，正在開啟工作台。",
    secureAccess: "受保護的工作台存取",
    forgotPassword: "忘記密碼？",
    passwordUpdated: "密碼已更新，請使用新密碼登入。",
    supportQuestion: "無法存取帳號？",
    supportAction: "聯絡支援",
    supportFallback: "請聯絡您的工作台管理員。",
    poweredBy: "由 Plexus 提供支援",
    loginProblem: "無法登入",
    previewTitle: "品牌預覽",
    previewMessage: "預覽模式下已停用登入。",
    previewSubmit: "僅預覽",
  },
  th: {
    platformKicker: "ซูเปอร์แอปสำหรับธุรกิจ",
    tenantKicker: "พื้นที่ทำงานธุรกิจส่วนตัว",
    platformTitle: "ค้นพบ เชื่อมต่อ ตกลง เติบโต",
    tenantTitle: "สร้างความสัมพันธ์ทางธุรกิจที่เชื่อถือได้ในที่เดียว",
    platformDescription:
      "พื้นที่ทำงานที่ปลอดภัยสำหรับทุกการเชื่อมต่อ การสนทนา และโอกาส",
    tenantDescription: "ประตูส่วนตัวขององค์กรสู่ผู้คน พันธมิตร และความก้าวหน้า",
    welcome: "ยินดีต้อนรับกลับ",
    platformPrompt: "เข้าสู่ระบบเพื่อไปยังพื้นที่ทำงาน Plexus ของคุณ",
    tenantPrompt: "เข้าสู่ระบบเพื่อไปยัง {name}",
    email: "อีเมล",
    emailPlaceholder: "you@company.com",
    password: "รหัสผ่าน",
    passwordPlaceholder: "ป้อนรหัสผ่านของคุณ",
    remember: "จดจำฉัน",
    submit: "เข้าสู่ระบบ",
    submitting: "กำลังเข้าสู่ระบบ...",
    success: "เข้าสู่ระบบแล้ว กำลังเปิดพื้นที่ทำงาน",
    secureAccess: "การเข้าถึงพื้นที่ทำงานที่ได้รับการปกป้อง",
    forgotPassword: "ลืมรหัสผ่าน?",
    passwordUpdated: "อัปเดตรหัสผ่านแล้ว โปรดเข้าสู่ระบบด้วยรหัสผ่านใหม่",
    supportQuestion: "ต้องการความช่วยเหลือในการเข้าถึงบัญชี?",
    supportAction: "ติดต่อฝ่ายสนับสนุน",
    supportFallback: "ติดต่อผู้ดูแลพื้นที่ทำงานของคุณ",
    poweredBy: "ขับเคลื่อนโดย Plexus",
    loginProblem: "เข้าสู่ระบบไม่ได้",
    previewTitle: "ตัวอย่างแบรนด์",
    previewMessage: "ปิดการเข้าสู่ระบบในโหมดตัวอย่าง",
    previewSubmit: "ดูตัวอย่างเท่านั้น",
  },
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
  const loginStyle = {
    "--login-accent": branding.primaryColor,
    "--login-accent-foreground": branding.accentForeground,
  } satisfies LoginStyle

  useEffect(() => {
    if (state.error) {
      toast.error(state.error)
    }

    if (state.redirectTo) {
      toast.success(t.success)
      router.push(state.redirectTo)
    }

    if (passwordUpdated) {
      toast.success(t.passwordUpdated)
    }
  }, [
    passwordUpdated,
    router,
    state.error,
    state.redirectTo,
    t.passwordUpdated,
    t.success,
  ])

  return (
    <main
      className="relative isolate min-h-svh overflow-hidden bg-[#24164d] text-white"
      style={loginStyle}
    >
      {previewMode ? (
        <div
          role="status"
          className="absolute top-4 right-4 z-20 flex max-w-xs items-start gap-3 rounded-xl border border-white/20 bg-[#120d2e]/88 px-4 py-3 text-white shadow-xl backdrop-blur-xl"
        >
          <HugeiconsIcon
            icon={EyeIcon}
            strokeWidth={1.7}
            className="mt-0.5 size-4 shrink-0 text-cyan-200"
          />
          <div>
            <p className="text-xs font-semibold">{t.previewTitle}</p>
            <p className="mt-0.5 text-[11px] text-white/65">
              {t.previewMessage}
            </p>
          </div>
        </div>
      ) : null}

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
              {t.welcome}
            </CardTitle>
            <p className="text-sm leading-6 text-white/68">{prompt}</p>
          </CardHeader>

          <form
            action={previewMode ? undefined : formAction}
            onSubmit={
              previewMode ? (event) => event.preventDefault() : undefined
            }
          >
            <CardContent className="px-6 sm:px-8">
              <FieldGroup className="gap-4">
                <input type="hidden" name="locale" value={locale} />
                {branding.slug ? (
                  <input
                    type="hidden"
                    name="tenantSlug"
                    value={branding.slug}
                  />
                ) : null}

                <Field className="gap-2">
                  <FieldLabel
                    htmlFor="email"
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
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder={t.emailPlaceholder}
                      required
                      disabled={previewMode}
                      className="h-12 rounded-xl border-white/20 bg-white/10 pr-4 pl-10 text-sm text-white shadow-none placeholder:text-white/42 focus-visible:border-white/50 focus-visible:ring-white/18 md:text-sm"
                    />
                  </div>
                </Field>

                <Field className="gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <FieldLabel
                      htmlFor="password"
                      className="text-xs font-medium text-white/82"
                    >
                      {t.password}
                    </FieldLabel>
                    {previewMode ? (
                      <span className="text-xs font-medium text-white/45">
                        {t.forgotPassword}
                      </span>
                    ) : (
                      <Link
                        href={forgotPasswordPath}
                        className="text-xs font-medium text-white/70 underline-offset-4 transition hover:text-white hover:underline focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                      >
                        {t.forgotPassword}
                      </Link>
                    )}
                  </div>
                  <div className="relative">
                    <HugeiconsIcon
                      icon={LockPasswordIcon}
                      strokeWidth={1.6}
                      className="pointer-events-none absolute top-1/2 left-3.5 z-10 size-4 -translate-y-1/2 text-white/55"
                    />
                    <Input
                      id="password"
                      name="password"
                      type={passwordVisible ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder={t.passwordPlaceholder}
                      required
                      disabled={previewMode}
                      className="h-12 rounded-xl border-white/20 bg-white/10 pr-11 pl-10 text-sm text-white shadow-none placeholder:text-white/42 focus-visible:border-white/50 focus-visible:ring-white/18 md:text-sm"
                    />
                    <button
                      type="button"
                      aria-label={
                        passwordVisible ? "Hide password" : "Show password"
                      }
                      aria-pressed={passwordVisible}
                      onClick={() => setPasswordVisible((visible) => !visible)}
                      disabled={previewMode}
                      className="absolute top-1/2 right-3 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-white/55 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    >
                      <HugeiconsIcon
                        icon={passwordVisible ? EyeOffIcon : EyeIcon}
                        strokeWidth={1.6}
                        className="size-4"
                      />
                    </button>
                  </div>
                </Field>

                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="remember"
                      name="remember"
                      disabled={previewMode}
                      className="border-white/35 bg-white/8 data-checked:border-[var(--login-accent)] data-checked:bg-[var(--login-accent)] data-checked:text-[var(--login-accent-foreground)]"
                    />
                    <Label
                      htmlFor="remember"
                      className="cursor-pointer text-xs font-normal text-white/68"
                    >
                      {t.remember}
                    </Label>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-white/52">
                    <HugeiconsIcon
                      icon={ShieldUserIcon}
                      strokeWidth={1.6}
                      className="size-3.5"
                    />
                    <span>{t.secureAccess}</span>
                  </div>
                </div>

                {passwordUpdated ? (
                  <Alert
                    aria-live="polite"
                    className="border-cyan-200/20 bg-cyan-950/25 text-cyan-50"
                  >
                    <HugeiconsIcon icon={ShieldUserIcon} strokeWidth={1.7} />
                    <AlertTitle>{t.passwordUpdated}</AlertTitle>
                  </Alert>
                ) : null}

                {state.error ? (
                  <Alert
                    variant="destructive"
                    aria-live="polite"
                    className="border-red-200/20 bg-red-950/25 text-red-50"
                  >
                    <HugeiconsIcon icon={Alert02Icon} strokeWidth={1.7} />
                    <AlertTitle>{t.loginProblem}</AlertTitle>
                    <AlertDescription className="text-red-50/78">
                      {state.error}
                    </AlertDescription>
                  </Alert>
                ) : null}

                <Button
                  className="mt-1 h-12 w-full rounded-xl bg-[var(--login-accent)] text-sm font-semibold text-[var(--login-accent-foreground)] shadow-[0_14px_30px_rgba(14,9,39,0.2)] hover:bg-[var(--login-accent)] hover:opacity-92"
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
            </CardContent>

            <CardFooter className="mt-6 flex flex-col items-stretch gap-3 border-t border-white/12 px-6 py-5 sm:px-8">
              <p className="text-center text-xs text-white/58">
                {t.supportQuestion}
              </p>
              {branding.supportEmail ? (
                <Button
                  asChild
                  variant="outline"
                  className="h-9 rounded-lg border-white/18 bg-white/6 text-xs text-white hover:bg-white/12 hover:text-white"
                >
                  <a href={`mailto:${branding.supportEmail}`}>
                    <HugeiconsIcon
                      icon={CustomerSupportIcon}
                      data-icon="inline-start"
                      strokeWidth={1.7}
                    />
                    {t.supportAction}
                  </a>
                </Button>
              ) : (
                <p className="text-center text-[11px] text-white/48">
                  {t.supportFallback}
                </p>
              )}
            </CardFooter>
          </form>
        </Card>
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
    <div className="flex items-center gap-4" data-testid="tenant-login-brand">
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
