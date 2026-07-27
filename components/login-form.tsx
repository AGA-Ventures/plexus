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
    title: "One login for every Plexus workspace",
    subtitle:
      "Sign in once. Your trusted account role sends you to the Superadmin, Admin, or Vendor workspace.",
    email: "Email",
    password: "Password",
    hint: "Accounts are provisioned by an authorized Plexus operator.",
    submit: "Login",
    success: "Logged in. Redirecting to portal.",
    routes: "Portal routes",
    noSignup: "Self-signup is disabled for this launch.",
    loginProblem: "Cannot log in",
  },
  zh: {
    title: "一个入口登录所有 Plexus 工作台",
    subtitle: "登录后，系统会根据可信账号角色进入超级管理员、管理员或供应商工作台。",
    email: "邮箱",
    password: "密码",
    hint: "账号由获授权的 Plexus 运营人员创建。",
    submit: "登录",
    success: "登录成功，正在进入门户。",
    routes: "门户路径",
    noSignup: "本次上线不开放自助注册。",
    loginProblem: "无法登录",
  },
  "zh-Hant": {
    title: "一個入口登入所有 Plexus 工作台",
    subtitle: "登入後，系統會根據可信帳號角色進入超級管理員、管理員或供應商工作台。",
    email: "電郵",
    password: "密碼",
    hint: "帳號由獲授權的 Plexus 營運人員建立。",
    submit: "登入",
    success: "登入成功，正在進入門戶。",
    routes: "門戶路徑",
    noSignup: "本次上線不開放自行註冊。",
    loginProblem: "無法登入",
  },
  th: {
    title: "ล็อกอินเดียวสำหรับทุกพื้นที่ทำงาน Plexus",
    subtitle: "ระบบจะนำคุณไปยังพื้นที่ Superadmin, Admin หรือ Vendor ตามบทบาทที่เชื่อถือได้",
    email: "อีเมล",
    password: "รหัสผ่าน",
    hint: "บัญชีสร้างโดยผู้ปฏิบัติงาน Plexus ที่ได้รับอนุญาต",
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
                Secure multi-tenant operations
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
              <p>Superadmin: /{locale}/superadmin</p>
              <p>Admin: /{locale}/admin</p>
              <p>Vendor: /{locale}/vendor</p>
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
              <Button
                className="w-full sm:w-auto"
                type="submit"
                disabled={isPending}
              >
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
