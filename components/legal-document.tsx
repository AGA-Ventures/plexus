import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import {
  isLocaleParam,
  localeLabels,
  locales,
  normalizeLocale,
  type Locale,
} from "@/lib/i18n"
import { Button } from "@/components/ui/button"

export type LegalPageKind = "privacy" | "pdpa" | "cookies" | "terms"

type LegalSection = {
  title: string
  body: string
  items?: string[]
}

type LegalPageCopy = {
  label: string
  title: string
  description: string
  updated: string
  sections: LegalSection[]
}

const legalCopy: Record<"en" | "zh", Record<LegalPageKind, LegalPageCopy>> = {
  en: {
    privacy: {
      label: "Privacy Notice",
      title: "Personal Data Protection Notice",
      description:
        "How Plexus Connect collects, uses, discloses and protects personal data for the Malaysia-China/Macao business matching event.",
      updated: "Updated 25 June 2026",
      sections: [
        {
          title: "Who this notice applies to",
          body: "This notice applies to invited delegation companies, Malaysian partners, organizers, liaison teams, service providers and visitors who use the Plexus Connect website or authenticated event portal.",
        },
        {
          title: "Personal data we may collect",
          body: "We collect only the information needed to operate the event, verify users and support business matching.",
          items: [
            "Identity and contact details such as name, email, organization, job title, phone number and preferred language.",
            "Company profile details such as sector, business interests, delegation notes, matching preferences and liaison notes.",
            "Portal activity such as login status, meeting acceptance, MOU readiness, QR check-in records and report exports.",
            "Technical information such as device, browser, approximate location signals, cookies and security logs.",
          ],
        },
        {
          title: "Why we use personal data",
          body: "We use personal data to provide a safe, relevant and accountable event experience.",
          items: [
            "Create and manage Supabase Auth accounts for launch access.",
            "Match delegation companies with Malaysian partners and schedule meetings.",
            "Operate bilingual communications, QR check-in, attendance, signing and reporting workflows.",
            "Protect the platform, prevent misuse, comply with lawful requests and resolve support issues.",
          ],
        },
        {
          title: "Disclosure and cross-border handling",
          body: "Personal data may be shared with event organizers, participating companies, authorized administrators, technology providers, support vendors and government or regulatory bodies where required. If data is accessed or processed outside Malaysia, we take reasonable steps to protect it according to the safeguards described in this notice.",
        },
        {
          title: "Your choices and rights",
          body: "You may request access to your personal data, ask for correction, withdraw optional consent, limit processing where applicable, or ask questions about how your data is handled. Some data is required to provide event access, security, attendance or compliance records.",
        },
        {
          title: "Retention and security",
          body: "We keep personal data for the event lifecycle and any reasonable post-event administration, audit, legal or reporting period. Access is limited by role, and the platform uses authenticated accounts, database policies and operational controls to reduce unauthorized access.",
        },
        {
          title: "Contact",
          body: "For privacy requests, contact the event administration team listed in your invitation or use the support channel provided by the organizer. This notice is operational guidance for the event and should be reviewed by the appointed legal or data protection contact before public launch.",
        },
      ],
    },
    pdpa: {
      label: "PDPA Compliance",
      title: "PDPA Readiness Statement",
      description:
        "A launch checklist for how Plexus Connect supports Malaysian Personal Data Protection Act expectations for notice, purpose, security and user rights.",
      updated: "Updated 25 June 2026",
      sections: [
        {
          title: "PDPA notice approach",
          body: "Plexus Connect is designed around a clear Personal Data Protection Notice so participants understand what personal data is collected, the purposes of use, who it may be shared with and how to contact the organizer.",
        },
        {
          title: "Operational principles",
          body: "The launch workflow supports the practical PDPA principles that matter most for the event.",
          items: [
            "General and notice: participants can read the privacy notice before login.",
            "Choice: optional communications and non-essential processing should be separated where required.",
            "Disclosure: participant data is shared only with the parties needed for matching, meetings, administration and reporting.",
            "Security: Supabase Auth, role metadata and database policies restrict access by role.",
            "Retention: post-event exports and records should follow the organizer's approved retention schedule.",
            "Data integrity and access: administrators can correct participant and company records during launch operations.",
          ],
        },
        {
          title: "Admin responsibilities",
          body: "Before production launch, the organizer should confirm the legal entity responsible for processing, the support contact, retention period, vendor list, cross-border processing position and any consent wording required for marketing or optional communications.",
        },
        {
          title: "Participant requests",
          body: "Access, correction, consent withdrawal and processing-limit requests should be routed to the named organizer contact. The platform can help identify account, profile, meeting, attendance and signing records connected to a user.",
        },
        {
          title: "Important note",
          body: "This page is not legal advice. It is a product and operations readiness page prepared for event launch review under Malaysian PDPA expectations.",
        },
      ],
    },
    cookies: {
      label: "Cookie Notice",
      title: "Cookie and Analytics Notice",
      description:
        "How Plexus Connect uses essential cookies and technical storage for login, security, preferences and portal operations.",
      updated: "Updated 25 June 2026",
      sections: [
        {
          title: "Essential cookies",
          body: "The website and portal may use essential cookies or browser storage to keep sessions secure, remember language preferences and support authenticated access. These are required for the portal to work.",
        },
        {
          title: "Security and performance logs",
          body: "We may collect technical events such as login attempts, page errors, device and browser information, approximate timestamps and security logs to keep the service reliable and protected.",
        },
        {
          title: "Analytics",
          body: "If analytics are enabled, they should be configured to measure aggregated event-page usage and portal performance. Analytics should not be used to sell participant data or create unrelated advertising profiles.",
        },
        {
          title: "Your controls",
          body: "You can manage non-essential cookies through your browser settings. Blocking essential cookies may prevent login, language switching or secured portal features from working correctly.",
        },
      ],
    },
    terms: {
      label: "Terms",
      title: "Website and Portal Terms",
      description:
        "Participant terms for using the Plexus Connect event website and authenticated launch portal.",
      updated: "Updated 25 June 2026",
      sections: [
        {
          title: "Permitted use",
          body: "Plexus Connect is provided for invited participants and authorized organizers of the Malaysia-China/Macao business matching event. You may use it only for event preparation, matching, meetings, attendance, signing coordination and reporting.",
        },
        {
          title: "Accounts and access",
          body: "Accounts are created by the admin team for launch. You are responsible for keeping your login details confidential and for notifying the organizer if you suspect unauthorized access.",
        },
        {
          title: "Participant content",
          body: "Company profiles, meeting notes, MOU status and attendance records should be accurate, lawful and suitable for the event. The organizer may update, correct or remove content that is incomplete, misleading or outside the event scope.",
        },
        {
          title: "Availability and changes",
          body: "The portal may be updated during launch operations to improve security, reliability, workflows or event accuracy. The organizer may pause access where needed for support, maintenance or misuse prevention.",
        },
        {
          title: "No legal or investment advice",
          body: "Information in the portal supports event coordination only. Participants remain responsible for their own commercial, legal, investment, tax and regulatory decisions.",
        },
      ],
    },
  },
  zh: {
    privacy: {
      label: "隐私通知",
      title: "个人资料保护通知",
      description:
        "说明 Plexus Connect 如何为马来西亚-中国/澳门商务配对活动收集、使用、披露与保护个人资料。",
      updated: "2026 年 6 月 25 日更新",
      sections: [
        {
          title: "本通知适用对象",
          body: "本通知适用于受邀代表团企业、马来西亚伙伴、主办方、联络团队、服务供应商，以及使用 Plexus Connect 网站或登录活动门户的访客。",
        },
        {
          title: "我们可能收集的个人资料",
          body: "我们只收集运营活动、验证用户与支持商务配对所需的资料。",
          items: [
            "身份与联系方式，例如姓名、电邮、机构、职位、电话与偏好语言。",
            "企业资料，例如行业、商业兴趣、代表团备注、配对偏好与联络备注。",
            "门户活动，例如登录状态、会议接受记录、MOU 准备状态、二维码签到记录与报告导出。",
            "技术资料，例如设备、浏览器、粗略位置讯号、Cookie 与安全日志。",
          ],
        },
        {
          title: "我们使用个人资料的目的",
          body: "我们使用个人资料来提供安全、相关且可追踪的活动体验。",
          items: [
            "创建与管理启动阶段的 Supabase Auth 账号。",
            "为代表团企业与马来西亚伙伴进行配对并安排会议。",
            "运营双语沟通、二维码签到、出席、签约与报告流程。",
            "保护平台、防止滥用、回应合法要求并处理支持问题。",
          ],
        },
        {
          title: "披露与跨境处理",
          body: "个人资料可能会与活动主办方、参与企业、授权管理员、技术供应商、支持供应商，以及在需要时与政府或监管机构共享。如果资料在马来西亚境外被访问或处理，我们会采取合理措施，按照本通知所述保障资料。",
        },
        {
          title: "你的选择与权利",
          body: "你可以请求查阅个人资料、要求更正、撤回可选同意、在适用范围内限制处理，或询问资料处理方式。部分资料对于活动访问、安全、出席或合规记录是必要的。",
        },
        {
          title: "保留与安全",
          body: "我们会在活动周期以及合理的活动后管理、审计、法律或报告期间保留个人资料。访问权限按角色限制，平台使用认证账号、数据库政策与运营控制来降低未经授权访问的风险。",
        },
        {
          title: "联系方式",
          body: "如需提出隐私请求，请联系邀请函中列明的活动管理团队，或使用主办方提供的支持渠道。本通知是活动运营说明，公开发布前应由指定法律或资料保护联系人审核。",
        },
      ],
    },
    pdpa: {
      label: "PDPA 合规",
      title: "PDPA 准备说明",
      description:
        "说明 Plexus Connect 如何支持马来西亚个人资料保护法下的通知、目的、安全与用户权利要求。",
      updated: "2026 年 6 月 25 日更新",
      sections: [
        {
          title: "PDPA 通知方式",
          body: "Plexus Connect 围绕清晰的个人资料保护通知设计，让参与者了解收集哪些个人资料、使用目的、可能共享对象以及如何联系主办方。",
        },
        {
          title: "运营原则",
          body: "启动流程支持活动中最重要的 PDPA 实务原则。",
          items: [
            "一般与通知：参与者可在登录前阅读隐私通知。",
            "选择：可选沟通与非必要处理应在需要时分开说明。",
            "披露：参与者资料只与配对、会议、管理和报告所需的相关方共享。",
            "安全：Supabase Auth、角色元数据与数据库政策按角色限制访问。",
            "保留：活动后导出与记录应遵循主办方批准的保留时间表。",
            "资料完整性与访问：管理员可在启动运营期间更正参与者和企业记录。",
          ],
        },
        {
          title: "管理员责任",
          body: "生产发布前，主办方应确认负责处理资料的法律实体、支持联系人、保留期限、供应商名单、跨境处理安排，以及营销或可选沟通所需的任何同意措辞。",
        },
        {
          title: "参与者请求",
          body: "查阅、更正、撤回同意和限制处理请求应转交给指定主办方联系人。平台可协助识别与用户相关的账号、资料、会议、出席和签约记录。",
        },
        {
          title: "重要说明",
          body: "本页面不构成法律意见。它是为活动发布审核准备的产品与运营说明，用于支持马来西亚 PDPA 相关预期。",
        },
      ],
    },
    cookies: {
      label: "Cookie 通知",
      title: "Cookie 与分析通知",
      description:
        "说明 Plexus Connect 如何使用必要 Cookie 与技术储存来支持登录、安全、偏好与门户运营。",
      updated: "2026 年 6 月 25 日更新",
      sections: [
        {
          title: "必要 Cookie",
          body: "网站和门户可能使用必要 Cookie 或浏览器储存来保护会话、记住语言偏好并支持认证访问。这些项目是门户正常运作所必需的。",
        },
        {
          title: "安全与性能日志",
          body: "我们可能收集登录尝试、页面错误、设备与浏览器信息、粗略时间戳和安全日志，以保持服务可靠和安全。",
        },
        {
          title: "分析",
          body: "如果启用分析，应配置为衡量汇总的活动页面使用情况和门户性能。分析不应用于出售参与者资料或建立无关广告画像。",
        },
        {
          title: "你的控制选项",
          body: "你可以通过浏览器设置管理非必要 Cookie。阻止必要 Cookie 可能导致登录、语言切换或安全门户功能无法正常工作。",
        },
      ],
    },
    terms: {
      label: "条款",
      title: "网站与门户使用条款",
      description:
        "说明参与者使用 Plexus Connect 活动网站与认证启动门户的条款。",
      updated: "2026 年 6 月 25 日更新",
      sections: [
        {
          title: "允许用途",
          body: "Plexus Connect 提供给马来西亚-中国/澳门商务配对活动的受邀参与者与授权主办方使用。你只能将其用于活动准备、配对、会议、出席、签约协调与报告。",
        },
        {
          title: "账号与访问",
          body: "启动阶段账号由管理员创建。你有责任保护登录资料，并在怀疑未经授权访问时通知主办方。",
        },
        {
          title: "参与者内容",
          body: "企业资料、会议备注、MOU 状态与出席记录应准确、合法并适合活动用途。主办方可更新、更正或移除不完整、误导性或超出活动范围的内容。",
        },
        {
          title: "可用性与变更",
          body: "门户可能会在启动运营期间更新，以改善安全性、可靠性、流程或活动准确性。主办方可在支持、维护或防止滥用需要时暂停访问。",
        },
        {
          title: "不构成法律或投资建议",
          body: "门户中的信息仅用于活动协调。参与者仍需自行负责其商业、法律、投资、税务与监管决定。",
        },
      ],
    },
  },
}

function toTraditional(value: string) {
  const replacements: Array<[string, string]> = [
    ["活动", "活動"],
    ["法律", "法律"],
    ["中心", "中心"],
    ["隐私", "隱私"],
    ["通知", "通知"],
    ["合规", "合規"],
    ["条款", "條款"],
    ["个人", "個人"],
    ["数据", "資料"],
    ["保护", "保護"],
    ["说明", "說明"],
    ["参与者", "參與者"],
    ["企业", "企業"],
    ["马来西亚", "馬來西亞"],
    ["澳门", "澳門"],
    ["会议", "會議"],
    ["资料", "資料"],
    ["门户", "門戶"],
    ["账号", "帳號"],
    ["访问", "存取"],
    ["处理", "處理"],
    ["管理员", "管理員"],
    ["运营", "營運"],
    ["记录", "記錄"],
    ["安全", "安全"],
    ["联系", "聯絡"],
    ["组织", "組織"],
    ["选择", "選擇"],
    ["权利", "權利"],
    ["负责", "負責"],
    ["启动", "啟動"],
    ["登录", "登入"],
  ]

  return replacements.reduce(
    (current, [from, to]) => current.replaceAll(from, to),
    value
  )
}

function mapLegalCopy(page: LegalPageCopy, mapper: (value: string) => string) {
  return {
    label: mapper(page.label),
    title: mapper(page.title),
    description: mapper(page.description),
    updated: mapper(page.updated),
    sections: page.sections.map((section) => ({
      title: mapper(section.title),
      body: mapper(section.body),
      items: section.items?.map(mapper),
    })),
  } satisfies LegalPageCopy
}

function getLegalCopy(locale: Locale) {
  if (locale === "zh") {
    return legalCopy.zh
  }

  if (locale === "zh-Hant") {
    return Object.fromEntries(
      Object.entries(legalCopy.zh).map(([kind, page]) => [
        kind,
        mapLegalCopy(page, toTraditional),
      ])
    ) as Record<LegalPageKind, LegalPageCopy>
  }

  return legalCopy.en
}

export function getLegalMetadata(
  kind: LegalPageKind,
  locale: Locale
): Metadata {
  const page = getLegalCopy(locale)[kind]

  return {
    title: `${page.label} · Plexus Connect`,
    description: page.description,
  }
}

export async function LegalDocument({
  kind,
  params,
}: {
  kind: LegalPageKind
  params: Promise<{ locale: string }>
}) {
  const { locale: localeParam } = await params

  if (!isLocaleParam(localeParam)) {
    notFound()
  }

  const locale = normalizeLocale(localeParam)
  const copy = getLegalCopy(locale)
  const page = copy[kind]
  const legalLinks = [
    ["privacy", copy.privacy.label],
    ["pdpa", copy.pdpa.label],
    ["cookies", copy.cookies.label],
    ["terms", copy.terms.label],
  ] as const

  return (
    <main className="min-h-svh bg-white text-slate-950 dark:bg-[#08090a] dark:text-white">
      <header className="border-b border-slate-200 bg-white/92 dark:border-white/10 dark:bg-[#0d0f10]/92">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <Link href={`/?lang=${locale}`} className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-md bg-[#052b2d] text-sm font-semibold text-[#f4c45b]">
              PX
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-sm font-semibold">Plexus Connect</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {locale === "en"
                  ? "Event legal centre"
                  : locale === "th"
                    ? "ศูนย์กฎหมายงาน"
                    : locale === "zh-Hant"
                      ? "活動法律中心"
                      : "活动法律中心"}
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            {locales.map((item) => (
              <Button
                key={item}
                asChild
                size="sm"
                variant={locale === item ? "secondary" : "outline"}
              >
                <Link href={`/${item}/${kind}`}>{localeLabels[item]}</Link>
              </Button>
            ))}
            <Button
              asChild
              size="sm"
              className="bg-[#00859a] hover:bg-[#007489]"
            >
              <Link href={`/${locale}/login`}>
                {locale === "en"
                  ? "Login"
                  : locale === "th"
                    ? "เข้าสู่ระบบ"
                    : locale === "zh-Hant"
                      ? "登入"
                      : "登录"}
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="border-b border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-[#0d1212]">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
          <p className="text-sm font-medium text-[#007489] dark:text-[#73d6c8]">
            {page.updated}
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-normal sm:text-5xl">
            {page.title}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-300">
            {page.description}
          </p>
          <nav className="mt-8 flex flex-wrap gap-2">
            {legalLinks.map(([href, label]) => (
              <Button
                key={href}
                asChild
                size="sm"
                variant={href === kind ? "default" : "outline"}
                className={
                  href === kind ? "bg-[#052b2d] hover:bg-[#07383b]" : ""
                }
              >
                <Link href={`/${locale}/${href}`}>{label}</Link>
              </Button>
            ))}
          </nav>
        </div>
      </section>

      <article className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-6">
          {page.sections.map((section) => (
            <section
              key={section.title}
              className="rounded-md border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-[#141416]"
            >
              <h2 className="text-xl font-semibold tracking-normal">
                {section.title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                {section.body}
              </p>
              {section.items ? (
                <ul className="mt-4 grid gap-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {section.items.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#00859a]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>
      </article>
    </main>
  )
}
