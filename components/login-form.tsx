"use client"

import { useActionState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Alert02Icon,
  Login03Icon,
  ShieldUserIcon,
} from "@hugeicons/core-free-icons"
import { toast } from "sonner"

import { loginAction, type LoginActionState } from "@/app/actions/auth"
import type { Locale } from "@/lib/i18n"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

type LoginCopy = Record<string, string>

const copy: Partial<Record<Locale, LoginCopy>> & { en: LoginCopy } = {
  en: {
    title: "Login to Plexus Connect",
    subtitle: "Use the production account created for you in Supabase Auth.",
    email: "Email",
    password: "Password",
    hint: "Accounts are created by the admin team for phase-one launch.",
    submit: "Login",
    success: "Logged in. Redirecting to portal.",
    routes: "Portal routes",
    noSignup: "Self-signup is disabled for this launch.",
    loginProblem: "Cannot log in",
  },
  zh: {
    title: "登录 Plexus Connect",
    subtitle: "使用管理员在 Supabase Auth 中创建的生产账号。",
    email: "邮箱",
    password: "密码",
    hint: "第一阶段上线账号由管理员创建。",
    submit: "登录",
    success: "登录成功，正在进入门户。",
    routes: "门户路径",
    noSignup: "本次上线不开放自助注册。",
    loginProblem: "无法登录",
  },
  "zh-Hant": {
    title: "登入 Plexus Connect",
    subtitle: "使用管理員在 Supabase Auth 中建立的生產帳號。",
    email: "電郵",
    password: "密碼",
    hint: "第一階段上線帳號由管理員建立。",
    submit: "登入",
    success: "登入成功，正在進入門戶。",
    routes: "門戶路徑",
    noSignup: "本次上線不開放自行註冊。",
    loginProblem: "無法登入",
  },
  th: {
    title: "เข้าสู่ระบบ Plexus Connect",
    subtitle: "ใช้บัญชี production ที่ผู้ดูแลสร้างไว้ใน Supabase Auth",
    email: "อีเมล",
    password: "รหัสผ่าน",
    hint: "บัญชีสำหรับช่วงเปิดตัวเฟสแรกสร้างโดยทีมผู้ดูแล",
    submit: "เข้าสู่ระบบ",
    success: "เข้าสู่ระบบแล้ว กำลังไปยังพอร์ทัล",
    routes: "เส้นทางพอร์ทัล",
    noSignup: "การสมัครด้วยตนเองปิดอยู่สำหรับการเปิดตัวนี้",
    loginProblem: "เข้าสู่ระบบไม่ได้",
  },
}

export function LoginForm({ locale }: { locale: Locale }) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState<
    LoginActionState,
    FormData
  >(loginAction, {})
  const t = { ...copy.en, ...(copy[locale] ?? {}) }

  useEffect(() => {
    if (state.error) {
      toast.error(state.error)
    }

    if (state.redirectTo) {
      toast.success(t.success)
      router.push(state.redirectTo)
    }
  }, [router, state.error, state.redirectTo, t.success])

  return (
    <main className="min-h-svh bg-background">
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-14">
        <section className="flex flex-col justify-between gap-8">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Plexus Connect</Badge>
              <Badge variant="outline">Supabase Auth</Badge>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-muted-foreground">
                Malaysia-China/Macao delegation
              </p>
              <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">
                {t.title}
              </h1>
              <p className="max-w-xl text-sm leading-6 text-muted-foreground">
                {t.subtitle}
              </p>
            </div>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>{t.routes}</CardTitle>
              <CardDescription>{t.hint}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm text-muted-foreground">
              <p>Admin: /{locale}/admin</p>
              <p>Delegation: /{locale}/delegation</p>
              <p>Partner: /{locale}/partner</p>
              <p>{t.noSignup}</p>
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader>
            <div className="mb-2 flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
              <HugeiconsIcon icon={ShieldUserIcon} strokeWidth={1.7} />
            </div>
            <CardTitle>Supabase Auth</CardTitle>
            <CardDescription>{t.hint}</CardDescription>
          </CardHeader>
          <form action={formAction}>
            <CardContent>
              <FieldGroup>
                <input type="hidden" name="locale" value={locale} />
                <Field>
                  <FieldLabel htmlFor="email">{t.email}</FieldLabel>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                  />
                  <FieldDescription>{t.noSignup}</FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="password">{t.password}</FieldLabel>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                  />
                  <FieldDescription>{t.hint}</FieldDescription>
                </Field>
                {state.error ? (
                  <Alert variant="destructive" aria-live="polite">
                    <HugeiconsIcon icon={Alert02Icon} strokeWidth={1.7} />
                    <AlertTitle>{t.loginProblem}</AlertTitle>
                    <AlertDescription>{state.error}</AlertDescription>
                  </Alert>
                ) : null}
              </FieldGroup>
            </CardContent>
            <CardFooter className="flex flex-wrap gap-2">
              <Button type="submit" disabled={isPending}>
                <HugeiconsIcon
                  icon={Login03Icon}
                  data-icon="inline-start"
                  strokeWidth={1.7}
                />
                {isPending
                  ? locale === "zh"
                    ? "登录中..."
                    : locale === "zh-Hant"
                      ? "登入中..."
                      : locale === "th"
                        ? "กำลังเข้าสู่ระบบ..."
                        : "Signing in..."
                  : t.submit}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </main>
  )
}
