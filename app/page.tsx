import Image from "next/image"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  AnalyticsUpIcon,
  Building01Icon,
  Calendar03Icon,
  CameraVideoIcon,
  CheckmarkCircle02Icon,
  QrCodeIcon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { localeLabels, locales, normalizeLocale, type Locale } from "@/lib/i18n"

type LandingCopy = {
  nav: {
    overview: string
    program: string
    access: string
    login: string
  }
  hero: {
    title: string
    subtitle: string
    primary: string
    secondary: string
    date: string
  }
  stats: Array<{ value: string; label: string }>
  overview: {
    heading: string
    body: string
  }
  access: {
    heading: string
    body: string
    roles: Array<{ title: string; body: string; href: string }>
  }
  program: {
    heading: string
    body: string
    steps: Array<{ day: string; title: string; body: string }>
  }
  trust: Array<{ title: string; body: string }>
  final: {
    heading: string
    body: string
    cta: string
  }
  legal: {
    heading: string
    body: string
    links: Array<{ label: string; href: string }>
  }
}

const landingCopy: Record<"en" | "zh", LandingCopy> = {
  en: {
    nav: {
      overview: "Overview",
      program: "Program",
      access: "Portal access",
      login: "Login",
    },
    hero: {
      title: "Plexus Connect",
      subtitle:
        "The official operating layer for invited delegation companies and Malaysian partners to prepare profiles, accept curated matches, attend meetings, coordinate signing and check in on site.",
      primary: "Login to portal",
      secondary: "View event program",
      date: "September 2026 · Malaysia-China/Macao delegation",
    },
    stats: [
      { value: "35", label: "delegation companies" },
      { value: "70+", label: "Malaysian partners" },
      { value: "3", label: "operating tracks" },
      { value: "2", label: "portal languages" },
    ],
    overview: {
      heading: "A calmer way to run high-stakes business matching.",
      body: "Plexus Connect gives the organizing team one source of truth for company readiness, partner matching, meeting flow, MOU progress, QR attendance and post-event reporting, while every participant sees only the workspace meant for them.",
    },
    access: {
      heading: "Secure access for every participant.",
      body: "Each route is backed by Supabase Auth and role-based launch access, so every user lands in the right workspace immediately after login.",
      roles: [
        {
          title: "Admin operations",
          body: "Manage companies, matches, sessions, signing, on-site check-in and reports.",
          href: "/en/admin",
        },
        {
          title: "Delegation workspace",
          body: "Review profile readiness, matched Malaysian partners, meetings and itinerary.",
          href: "/en/delegation",
        },
        {
          title: "Partner workspace",
          body: "Confirm opportunities, meeting preparation, MOU progress and QR attendance.",
          href: "/en/partner",
        },
      ],
    },
    program: {
      heading: "A focused launch program built around follow-through.",
      body: "The portal turns the event into a clear sequence of preparation, meetings and post-event action, so teams can move from introductions to accountable next steps.",
      steps: [
        {
          day: "Pre-visit",
          title: "Profile readiness and matching",
          body: "Companies complete bilingual profiles while the admin team prepares high-fit partner shortlists.",
        },
        {
          day: "Meeting week",
          title: "Video and on-site sessions",
          body: "Participants join confirmed sessions, track attendance and keep the operating team informed.",
        },
        {
          day: "Signing",
          title: "MOU readiness and reporting",
          body: "Deal status, signing conversion and follow-up exports stay visible after the event.",
        },
      ],
    },
    trust: [
      {
        title: "Supabase Auth",
        body: "Launch accounts are created by the admin team with role metadata.",
      },
      {
        title: "PDPA-ready notices",
        body: "Privacy, cookie and terms pages explain how participant data is handled.",
      },
      {
        title: "Bilingual flow",
        body: "English and Chinese routes support the participant journey from invitation to follow-up.",
      },
      {
        title: "Live reporting",
        body: "Admin teams can export matching, signing and on-site operating progress.",
      },
    ],
    final: {
      heading: "Built for invited participants, not public self-signup.",
      body: "Use the Supabase Auth account assigned by the event administration team to enter the correct launch workspace.",
      cta: "Open login",
    },
    legal: {
      heading: "Participant notices",
      body: "Public pages for PDPA readiness, privacy, cookies and portal terms.",
      links: [
        { label: "Privacy Notice", href: "privacy" },
        { label: "PDPA Compliance", href: "pdpa" },
        { label: "Cookie Notice", href: "cookies" },
        { label: "Terms", href: "terms" },
      ],
    },
  },
  zh: {
    nav: {
      overview: "概览",
      program: "流程",
      access: "门户入口",
      login: "登录",
    },
    hero: {
      title: "Plexus Connect",
      subtitle:
        "面向受邀代表团企业与马来西亚伙伴的官方运营平台，用于准备资料、确认配对、参加会议、协调签约与现场签到。",
      primary: "登录门户",
      secondary: "查看活动流程",
      date: "2026 年 9 月 · 马来西亚-中国/澳门代表团",
    },
    stats: [
      { value: "35", label: "代表团企业" },
      { value: "70+", label: "马来西亚伙伴" },
      { value: "3", label: "运营主线" },
      { value: "2", label: "门户语言" },
    ],
    overview: {
      heading: "让高价值商务配对更清晰、更稳。",
      body: "Plexus Connect 为主办团队提供企业准备度、伙伴配对、会议流程、MOU 进展、二维码出席与活动后报告的一致工作层，同时每位参与者只会看到适合其角色的工作台。",
    },
    access: {
      heading: "每一类参与者都有安全入口。",
      body: "每条路线都连接 Supabase Auth 与角色权限，用户登录后会直接进入对应的工作台。",
      roles: [
        {
          title: "管理员运营",
          body: "管理企业、配对、会议、签约、现场签到与报告。",
          href: "/zh/admin",
        },
        {
          title: "代表团工作台",
          body: "查看资料完整度、马方配对伙伴、会议与行程。",
          href: "/zh/delegation",
        },
        {
          title: "马方伙伴工作台",
          body: "确认机会、会议准备、MOU 进展与二维码出席状态。",
          href: "/zh/partner",
        },
      ],
    },
    program: {
      heading: "围绕后续成果设计的活动节奏。",
      body: "门户把活动整理为准备、会议与活动后行动三个阶段，让团队从介绍走向可追踪的下一步。",
      steps: [
        {
          day: "访前",
          title: "资料准备与配对",
          body: "企业完善双语资料，主办团队准备高匹配度伙伴名单。",
        },
        {
          day: "会议周",
          title: "线上与现场会议",
          body: "参与者加入已确认会议，追踪出席，并让运营团队保持可见。",
        },
        {
          day: "签约",
          title: "MOU 准备与报告",
          body: "交易状态、签约转化与后续导出在活动结束后仍清晰可见。",
        },
      ],
    },
    trust: [
      {
        title: "Supabase Auth",
        body: "启动阶段账号由管理员创建，并配置角色元数据。",
      },
      {
        title: "PDPA 准备页面",
        body: "隐私、Cookie 与条款页面说明参与者资料的处理方式。",
      },
      {
        title: "双语流程",
        body: "英文与中文路线覆盖从邀请到后续跟进的完整旅程。",
      },
      {
        title: "实时报告",
        body: "管理员可导出配对、签约与现场运营进度。",
      },
    ],
    final: {
      heading: "为受邀参与者而建，不开放公开自助注册。",
      body: "请使用活动管理团队分配给你的 Supabase Auth 账号进入正确的启动工作台。",
      cta: "打开登录",
    },
    legal: {
      heading: "参与者通知",
      body: "用于 PDPA 准备、隐私、Cookie 与门户条款的公开页面。",
      links: [
        { label: "隐私通知", href: "privacy" },
        { label: "PDPA 合规", href: "pdpa" },
        { label: "Cookie 通知", href: "cookies" },
        { label: "条款", href: "terms" },
      ],
    },
  },
}

function toTraditional(value: string) {
  const replacements: Array<[string, string]> = [
    ["概览", "概覽"],
    ["流程", "流程"],
    ["门户", "門戶"],
    ["入口", "入口"],
    ["登录", "登入"],
    ["面向", "面向"],
    ["受邀", "受邀"],
    ["代表团", "代表團"],
    ["企业", "企業"],
    ["马来西亚", "馬來西亞"],
    ["伙伴", "夥伴"],
    ["官方运营平台", "官方營運平台"],
    ["准备", "準備"],
    ["资料", "資料"],
    ["确认", "確認"],
    ["配对", "配對"],
    ["参加会议", "參加會議"],
    ["协调签约", "協調簽約"],
    ["现场签到", "現場簽到"],
    ["活动", "活動"],
    ["语言", "語言"],
    ["清晰", "清晰"],
    ["二维码", "二維碼"],
    ["出席", "出席"],
    ["报告", "報告"],
    ["管理员", "管理員"],
    ["启动", "啟動"],
    ["账号", "帳號"],
    ["创建", "建立"],
    ["隐私", "隱私"],
    ["通知", "通知"],
    ["条款", "條款"],
    ["合规", "合規"],
    ["实时", "即時"],
    ["导出", "匯出"],
  ]

  return replacements.reduce(
    (current, [from, to]) => current.replaceAll(from, to),
    value
  )
}

function mapCopyText(
  copy: LandingCopy,
  mapper: (value: string) => string
): LandingCopy {
  return {
    nav: Object.fromEntries(
      Object.entries(copy.nav).map(([key, value]) => [key, mapper(value)])
    ) as LandingCopy["nav"],
    hero: Object.fromEntries(
      Object.entries(copy.hero).map(([key, value]) => [key, mapper(value)])
    ) as LandingCopy["hero"],
    stats: copy.stats.map((item) => ({ ...item, label: mapper(item.label) })),
    overview: {
      heading: mapper(copy.overview.heading),
      body: mapper(copy.overview.body),
    },
    access: {
      heading: mapper(copy.access.heading),
      body: mapper(copy.access.body),
      roles: copy.access.roles.map((role) => ({
        ...role,
        title: mapper(role.title),
        body: mapper(role.body),
      })),
    },
    program: {
      heading: mapper(copy.program.heading),
      body: mapper(copy.program.body),
      steps: copy.program.steps.map((step) => ({
        day: mapper(step.day),
        title: mapper(step.title),
        body: mapper(step.body),
      })),
    },
    trust: copy.trust.map((item) => ({
      title: mapper(item.title),
      body: mapper(item.body),
    })),
    final: {
      heading: mapper(copy.final.heading),
      body: mapper(copy.final.body),
      cta: mapper(copy.final.cta),
    },
    legal: {
      heading: mapper(copy.legal.heading),
      body: mapper(copy.legal.body),
      links: copy.legal.links.map((link) => ({
        ...link,
        label: mapper(link.label),
      })),
    },
  }
}

function getLandingCopy(locale: Locale): LandingCopy {
  if (locale === "zh") {
    return landingCopy.zh
  }

  if (locale === "zh-Hant") {
    return mapCopyText(landingCopy.zh, toTraditional)
  }

  if (locale === "th") {
    return {
      nav: {
        overview: "ภาพรวม",
        program: "โปรแกรม",
        access: "การเข้าถึงพอร์ทัล",
        login: "เข้าสู่ระบบ",
      },
      hero: {
        title: "Plexus Connect",
        subtitle:
          "ชั้นปฏิบัติการอย่างเป็นทางการสำหรับบริษัทคณะผู้แทนและพันธมิตรมาเลเซียที่ได้รับเชิญ เพื่อเตรียมโปรไฟล์ ยอมรับคู่จับคู่ เข้าประชุม ประสานการลงนาม และเช็กอินหน้างาน",
        primary: "เข้าสู่พอร์ทัล",
        secondary: "ดูโปรแกรมงาน",
        date: "กันยายน 2026 · คณะผู้แทนมาเลเซีย-จีน/มาเก๊า",
      },
      stats: [
        { value: "35", label: "บริษัทคณะผู้แทน" },
        { value: "70+", label: "พันธมิตรมาเลเซีย" },
        { value: "3", label: "สายงานปฏิบัติการ" },
        { value: "4", label: "ภาษาพอร์ทัล" },
      ],
      overview: {
        heading: "วิธีที่นิ่งกว่าในการจัดการ business matching สำคัญ",
        body: "Plexus Connect ทำให้ทีมผู้จัดงานมีแหล่งข้อมูลเดียวสำหรับความพร้อมบริษัท การจับคู่พันธมิตร การประชุม ความคืบหน้า MOU การเข้าร่วมด้วย QR และรายงานหลังงาน โดยผู้เข้าร่วมแต่ละรายเห็นเฉพาะพื้นที่ทำงานของตน",
      },
      access: {
        heading: "การเข้าถึงที่ปลอดภัยสำหรับผู้เข้าร่วมทุกกลุ่ม",
        body: "ทุกเส้นทางใช้ Supabase Auth และสิทธิ์ตามบทบาท เพื่อให้ผู้ใช้เข้าสู่พื้นที่ทำงานที่ถูกต้องหลังล็อกอิน",
        roles: [
          {
            title: "งานปฏิบัติการผู้ดูแล",
            body: "จัดการบริษัท การจับคู่ เซสชัน การลงนาม เช็กอินหน้างาน และรายงาน",
            href: "/th/admin",
          },
          {
            title: "พื้นที่ทำงานคณะผู้แทน",
            body: "ตรวจสอบความพร้อมโปรไฟล์ พันธมิตรมาเลเซียที่จับคู่ การประชุม และกำหนดการ",
            href: "/th/delegation",
          },
          {
            title: "พื้นที่ทำงานพันธมิตร",
            body: "ยืนยันโอกาส การเตรียมประชุม ความคืบหน้า MOU และ QR attendance",
            href: "/th/partner",
          },
        ],
      },
      program: {
        heading: "โปรแกรมเปิดตัวที่เน้นการติดตามผล",
        body: "พอร์ทัลจัดงานให้เป็นลำดับชัดเจนของการเตรียมตัว การประชุม และการติดตามหลังงาน",
        steps: [
          {
            day: "ก่อนเยี่ยม",
            title: "ความพร้อมโปรไฟล์และการจับคู่",
            body: "บริษัทกรอกโปรไฟล์สองภาษา ขณะที่ทีมผู้ดูแลเตรียมรายชื่อพันธมิตรที่เหมาะสม",
          },
          {
            day: "สัปดาห์ประชุม",
            title: "ประชุมวิดีโอและหน้างาน",
            body: "ผู้เข้าร่วมเข้าร่วมเซสชันที่ยืนยันแล้ว ติดตาม attendance และอัปเดตทีมปฏิบัติการ",
          },
          {
            day: "การลงนาม",
            title: "ความพร้อม MOU และรายงาน",
            body: "สถานะดีล อัตราการลงนาม และไฟล์ส่งออกติดตามผลยังมองเห็นได้หลังงาน",
          },
        ],
      },
      trust: [
        {
          title: "Supabase Auth",
          body: "บัญชีเปิดตัวสร้างโดยทีมผู้ดูแลพร้อม metadata ตามบทบาท",
        },
        {
          title: "ประกาศพร้อม PDPA",
          body: "หน้า privacy, cookie และ terms อธิบายการจัดการข้อมูลผู้เข้าร่วม",
        },
        {
          title: "โฟลว์หลายภาษา",
          body: "เส้นทาง English, 中文, 繁體中文 และไทย รองรับการเดินทางของผู้เข้าร่วม",
        },
        {
          title: "รายงานสด",
          body: "ทีมผู้ดูแลส่งออกความคืบหน้าการจับคู่ การลงนาม และหน้างานได้",
        },
      ],
      final: {
        heading:
          "สร้างสำหรับผู้เข้าร่วมที่ได้รับเชิญ ไม่ใช่ self-signup สาธารณะ",
        body: "ใช้บัญชี Supabase Auth ที่ทีมผู้ดูแลงานมอบให้เพื่อเข้าสู่พื้นที่ทำงานที่ถูกต้อง",
        cta: "เปิดหน้าเข้าสู่ระบบ",
      },
      legal: {
        heading: "ประกาศสำหรับผู้เข้าร่วม",
        body: "หน้าสาธารณะสำหรับ PDPA, privacy, cookies และ terms ของพอร์ทัล",
        links: [
          { label: "Privacy Notice", href: "privacy" },
          { label: "PDPA Compliance", href: "pdpa" },
          { label: "Cookie Notice", href: "cookies" },
          { label: "Terms", href: "terms" },
        ],
      },
    }
  }

  return landingCopy.en
}

const icons = [
  Building01Icon,
  UserGroupIcon,
  Calendar03Icon,
  AnalyticsUpIcon,
  CheckmarkCircle02Icon,
  QrCodeIcon,
  CameraVideoIcon,
]

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>
}) {
  const params = await searchParams
  const locale = normalizeLocale(params.lang)
  const copy = getLandingCopy(locale)
  const loginHref = `/${locale}/login`
  const accessRoles = copy.access.roles.map((role, index) => ({
    ...role,
    href: `/${locale}/${["admin", "delegation", "partner"][index]}`,
  }))

  return (
    <main className="min-h-svh bg-white text-slate-950 dark:bg-[#08090a] dark:text-white">
      <section className="relative isolate overflow-hidden bg-[#07100f] text-white">
        <Image
          src="/plexus-event-hero.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 -z-20 object-cover object-center"
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(3,7,9,0.94)_0%,rgba(3,7,9,0.80)_36%,rgba(3,7,9,0.40)_66%,rgba(3,7,9,0.55)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-36 bg-[linear-gradient(180deg,rgba(3,7,9,0)_0%,#ffffff_100%)] dark:bg-[linear-gradient(180deg,rgba(3,7,9,0)_0%,#08090a_100%)]" />

        <header className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <Link href={`/?lang=${locale}`} className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-md border border-white/20 bg-white/10 text-sm font-semibold text-[#f4c45b]">
              PX
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-sm font-semibold">Plexus Connect</span>
              <span className="text-xs text-white/65">{copy.hero.date}</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-white/78 md:flex">
            <a href="#overview" className="transition hover:text-white">
              {copy.nav.overview}
            </a>
            <a href="#program" className="transition hover:text-white">
              {copy.nav.program}
            </a>
            <a href="#access" className="transition hover:text-white">
              {copy.nav.access}
            </a>
          </nav>
          <div className="flex items-center gap-2">
            {locales.map((item) => (
              <Button
                key={item}
                asChild
                size="sm"
                variant={locale === item ? "secondary" : "outline"}
                className="h-9 border-white/20 bg-white/10 text-white hover:bg-white/18"
              >
                <Link href={`/?lang=${item}`}>{localeLabels[item]}</Link>
              </Button>
            ))}
            <Button
              asChild
              size="sm"
              className="hidden h-9 bg-[#00859a] hover:bg-[#007489] sm:inline-flex"
            >
              <Link href={loginHref}>{copy.nav.login}</Link>
            </Button>
          </div>
        </header>

        <div className="mx-auto flex min-h-[78svh] w-full max-w-7xl flex-col justify-center px-4 pt-12 pb-24 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="mb-5 max-w-xl text-sm font-medium text-[#f4c45b]">
              {copy.hero.date}
            </p>
            <h1 className="max-w-4xl text-5xl leading-[0.95] font-semibold tracking-normal text-white sm:text-7xl lg:text-8xl">
              {copy.hero.title}
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-7 text-white/78 sm:text-lg">
              {copy.hero.subtitle}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-12 bg-[#00859a] px-5 text-sm text-white hover:bg-[#007489]"
              >
                <Link href={loginHref}>{copy.hero.primary}</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 border-white/28 bg-white/8 px-5 text-sm text-white hover:bg-white/14 hover:text-white"
              >
                <a href="#program">{copy.hero.secondary}</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section id="overview" className="relative -mt-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 rounded-md border border-slate-200 bg-white p-5 shadow-xl shadow-slate-950/8 md:grid-cols-4 dark:border-white/10 dark:bg-[#111113] dark:shadow-black/30">
          {copy.stats.map((item, index) => {
            const Icon = icons[index]
            return (
              <div key={item.label} className="flex items-center gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-md bg-[#e6f6f3] text-[#006b63] dark:bg-[#10322f] dark:text-[#73d6c8]">
                  <HugeiconsIcon icon={Icon} size={22} strokeWidth={1.8} />
                </span>
                <div>
                  <p className="text-2xl leading-none font-semibold">
                    {item.value}
                  </p>
                  <p className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-300">
                    {item.label}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div>
          <h2 className="max-w-xl text-3xl leading-tight font-semibold tracking-normal sm:text-4xl">
            {copy.overview.heading}
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
            {copy.overview.body}
          </p>
        </div>
        <div id="access" className="grid gap-4 sm:grid-cols-3">
          {accessRoles.map((role, index) => {
            const Icon = icons[index]
            return (
              <Card
                key={role.title}
                className="rounded-md border-slate-200 bg-white shadow-none dark:border-white/10 dark:bg-[#141416]"
              >
                <CardHeader className="gap-3">
                  <span className="grid size-11 place-items-center rounded-md bg-[#052b2d] text-[#f4c45b]">
                    <HugeiconsIcon icon={Icon} size={23} strokeWidth={1.8} />
                  </span>
                  <div>
                    <CardTitle className="text-lg">{role.title}</CardTitle>
                    <CardDescription className="mt-2 leading-6">
                      {role.body}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full justify-between"
                  >
                    <Link href={role.href}>
                      {copy.nav.login}
                      <span aria-hidden="true">→</span>
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 px-4 py-20 sm:px-6 lg:px-8 dark:border-white/10 dark:bg-[#0d1212]">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <Badge
                variant="outline"
                className="rounded-md border-[#00859a]/30 text-[#007489] dark:text-[#73d6c8]"
              >
                {copy.nav.access}
              </Badge>
              <h2 className="mt-5 text-3xl font-semibold tracking-normal sm:text-4xl">
                {copy.access.heading}
              </h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300">
                {copy.access.body}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {copy.trust.map((item, index) => {
                const Icon = icons[index + 3]
                return (
                  <div
                    key={item.title}
                    className="rounded-md border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#141416]"
                  >
                    <HugeiconsIcon
                      icon={Icon}
                      size={24}
                      strokeWidth={1.8}
                      className="text-[#00859a]"
                    />
                    <h3 className="mt-4 text-base font-semibold">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {item.body}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <section
        id="program"
        className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"
      >
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-normal sm:text-4xl">
            {copy.program.heading}
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
            {copy.program.body}
          </p>
        </div>
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {copy.program.steps.map((step, index) => (
            <div
              key={step.title}
              className="relative rounded-md border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-[#141416]"
            >
              <span className="grid size-12 place-items-center rounded-md bg-[#062b2e] text-sm font-semibold text-[#f4c45b]">
                {index + 1}
              </span>
              <p className="mt-5 text-sm font-medium text-[#007489] dark:text-[#73d6c8]">
                {step.day}
              </p>
              <h3 className="mt-2 text-xl font-semibold">{step.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 pb-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 rounded-md bg-[#052b2d] p-6 text-white sm:flex-row sm:items-center sm:justify-between lg:p-8">
          <div>
            <h2 className="text-2xl font-semibold tracking-normal">
              {copy.final.heading}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/72">
              {copy.final.body}
            </p>
          </div>
          <Button
            asChild
            size="lg"
            className="h-12 shrink-0 bg-[#f4c45b] px-5 text-sm text-slate-950 hover:bg-[#e7b84f]"
          >
            <Link href={loginHref}>{copy.final.cta}</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-slate-200 px-4 py-8 sm:px-6 lg:px-8 dark:border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between dark:text-slate-300">
          <div>
            <p className="font-medium text-slate-950 dark:text-white">
              {copy.legal.heading}
            </p>
            <p className="mt-1">{copy.legal.body}</p>
          </div>
          <nav className="flex flex-wrap gap-x-5 gap-y-2">
            {copy.legal.links.map((link) => (
              <Link
                key={link.href}
                href={`/${locale}/${link.href}`}
                className="transition hover:text-[#007489] dark:hover:text-[#73d6c8]"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </main>
  )
}
