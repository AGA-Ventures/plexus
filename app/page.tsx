import Image from "next/image"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  AiBrain01Icon,
  ArrowRight01Icon,
  ArrowUpRight01Icon,
  Building01Icon,
  Calendar03Icon,
  CheckmarkCircle02Icon,
  Globe02Icon,
  LicenseDraftIcon,
  Mic02Icon,
  Radar02Icon,
  SecurityCheckIcon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons"

import { EventHandoff } from "@/components/event-handoff"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import {
  getPublicContent,
  normalizePublicLocale,
  type PublicLocale,
  withLocale,
} from "@/lib/public-site"

type EditorialCopy = {
  status: string
  statusDetail: string
  heroImageAlt: string
  journeyTitle: string
  journeyBody: string
  journeyOwnerLabel: string
  journeyRecordLabel: string
  governanceTitle: string
  governanceBody: string
  stages: Array<{
    title: string
    body: string
    owner: string
    record: string
  }>
  routesTitle: string
  routesBody: string
  preview: string
  previewBody: string
  event: string
  eventBody: string
  workspace: string
  workspaceBody: string
  explore: string
}

const editorialCopy: Record<PublicLocale, EditorialCopy> = {
  en: {
    status: "Pre-launch application",
    statusDetail: "Selected program workflows are being prepared for launch.",
    heroImageAlt:
      "Program operator and business owner reviewing a governed Plexus company journey together",
    journeyTitle: "From company profile to accountable follow-up.",
    journeyBody:
      "Plexus moves approved context through organizer review, mutual acceptance, a confirmed meeting and the next responsible action.",
    journeyOwnerLabel: "Decision owner",
    journeyRecordLabel: "Recorded outcome",
    governanceTitle: "Human decisions stay visible.",
    governanceBody:
      "Matching assists the organizer; participant choice and accountable ownership remain explicit at every handoff.",
    stages: [
      {
        title: "Company profile",
        body: "Structure capabilities, objectives and partner criteria.",
        owner: "Participating company",
        record: "Approved company profile",
      },
      {
        title: "Organizer review",
        body: "Review fit and context before an opportunity is shared.",
        owner: "Program operator",
        record: "Reviewed opportunity",
      },
      {
        title: "Mutual acceptance",
        body: "Both sides choose whether a connection should move forward.",
        owner: "Both companies",
        record: "Mutual decision",
      },
      {
        title: "Confirmed meeting",
        body: "Coordinate participants, timing and meeting context.",
        owner: "Operator and participants",
        record: "Confirmed meeting record",
      },
      {
        title: "Agreement & follow-up",
        body: "Record outcomes, ownership and the next responsible action.",
        owner: "Both companies",
        record: "Outcome, owner and next action",
      },
    ],
    routesTitle: "Choose the Plexus experience you need.",
    routesBody:
      "The product preview, special pre-event service and operating workspaces now have clear, connected routes.",
    preview: "Product preview",
    previewBody:
      "See the pre-launch application vision and connected participant experience.",
    event: "Pre-event service",
    eventBody:
      "Prepare business objectives, matches, meetings and arrival details for a specific program.",
    workspace: "Operating workspaces",
    workspaceBody:
      "Sign in to the program-operator, participating-company or Plexus platform workspace for your role.",
    explore: "Explore",
  },
  ms: {
    status: "Aplikasi pra-pelancaran",
    statusDetail:
      "Aliran kerja program terpilih sedang disediakan untuk pelancaran.",
    heroImageAlt:
      "Pengendali program dan pemilik perniagaan menyemak perjalanan syarikat Plexus yang terkawal bersama-sama",
    journeyTitle:
      "Daripada profil syarikat kepada susulan yang bertanggungjawab.",
    journeyBody:
      "Plexus membawa konteks yang diluluskan melalui semakan penganjur, penerimaan bersama, mesyuarat yang disahkan dan tindakan bertanggungjawab seterusnya.",
    journeyOwnerLabel: "Pemilik keputusan",
    journeyRecordLabel: "Hasil direkodkan",
    governanceTitle: "Keputusan manusia kekal jelas.",
    governanceBody:
      "Pemadanan membantu penganjur; pilihan peserta dan pemilikan tindakan kekal nyata pada setiap serahan.",
    stages: [
      {
        title: "Profil syarikat",
        body: "Susun keupayaan, objektif dan kriteria rakan kongsi.",
        owner: "Syarikat peserta",
        record: "Profil syarikat diluluskan",
      },
      {
        title: "Semakan penganjur",
        body: "Semak kesesuaian dan konteks sebelum peluang dikongsi.",
        owner: "Pengendali program",
        record: "Peluang yang telah disemak",
      },
      {
        title: "Penerimaan bersama",
        body: "Kedua-dua pihak memilih sama ada hubungan diteruskan.",
        owner: "Kedua-dua syarikat",
        record: "Keputusan bersama",
      },
      {
        title: "Mesyuarat disahkan",
        body: "Selaras peserta, masa dan konteks mesyuarat.",
        owner: "Pengendali dan peserta",
        record: "Rekod mesyuarat disahkan",
      },
      {
        title: "Perjanjian & susulan",
        body: "Rekod hasil, pemilikan dan tindakan seterusnya.",
        owner: "Kedua-dua syarikat",
        record: "Hasil, pemilik dan tindakan seterusnya",
      },
    ],
    routesTitle: "Pilih pengalaman Plexus yang anda perlukan.",
    routesBody:
      "Pratonton produk, perkhidmatan pra-acara khas dan ruang kerja kini mempunyai laluan yang jelas.",
    preview: "Pratonton produk",
    previewBody:
      "Lihat visi aplikasi pra-pelancaran dan pengalaman peserta yang berhubung.",
    event: "Perkhidmatan pra-acara",
    eventBody:
      "Sediakan objektif, padanan, mesyuarat dan butiran ketibaan untuk program tertentu.",
    workspace: "Ruang kerja operasi",
    workspaceBody:
      "Log masuk ke ruang kerja pengendali program, syarikat peserta atau platform Plexus mengikut peranan anda.",
    explore: "Terokai",
  },
  "zh-Hant": {
    status: "預先發佈應用程式",
    statusDetail: "指定計劃工作流程正在為正式發佈作準備。",
    heroImageAlt: "計劃營運方與企業負責人共同檢視受治理的 Plexus 企業流程",
    journeyTitle: "從公司檔案到有責任的後續跟進。",
    journeyBody:
      "Plexus 將已核准的背景資料帶入主辦方審核、雙方接受、確認會議及下一個負責任的行動。",
    journeyOwnerLabel: "決策者",
    journeyRecordLabel: "記錄結果",
    governanceTitle: "人工決策始終清晰可見。",
    governanceBody:
      "配對協助主辦方；參與者選擇與行動責任在每個交接點保持明確。",
    stages: [
      {
        title: "公司檔案",
        body: "整理能力、目標和合作夥伴條件。",
        owner: "參與企業",
        record: "已核准的公司檔案",
      },
      {
        title: "主辦方審核",
        body: "在分享機會前審核匹配度與背景。",
        owner: "計劃營運方",
        record: "已審核的商機",
      },
      {
        title: "雙方接受",
        body: "雙方決定是否推進聯繫。",
        owner: "雙方企業",
        record: "雙方決定",
      },
      {
        title: "確認會議",
        body: "協調參與者、時間和會議背景。",
        owner: "營運方與參與者",
        record: "已確認的會議記錄",
      },
      {
        title: "協議與跟進",
        body: "記錄結果、負責人和下一個行動。",
        owner: "雙方企業",
        record: "結果、負責人與下一步",
      },
    ],
    routesTitle: "選擇您需要的 Plexus 體驗。",
    routesBody: "產品預覽、特別活動前服務和營運工作區現已擁有清晰連接的路由。",
    preview: "產品預覽",
    previewBody: "查看預先發佈應用程式願景與連接的參與者體驗。",
    event: "活動前服務",
    eventBody: "為特定計劃準備商務目標、配對、會議和抵達細節。",
    workspace: "營運工作區",
    workspaceBody: "依角色登入計劃營運方、參與企業或 Plexus 平台工作區。",
    explore: "探索",
  },
}

const stageIcons = [
  LicenseDraftIcon,
  UserGroupIcon,
  CheckmarkCircle02Icon,
  Calendar03Icon,
  Building01Icon,
]

const capabilityShowcasePresentation = [
  {
    moduleIndex: 0,
    icon: Radar02Icon,
    status: "live" as const,
    image: "/app-future/plexus-match-phone-transparent.png",
    imageClass: "object-contain object-center p-5 sm:p-8 lg:p-6",
    mediaClass: "bg-[#e7dfcf]",
    position:
      "min-h-[27rem] lg:col-start-1 lg:row-start-1 lg:col-span-4 lg:row-span-7 lg:min-h-0",
  },
  {
    moduleIndex: 1,
    icon: Calendar03Icon,
    status: "live" as const,
    image: "/app-future/plexus-superapp-system-hero-v4.png",
    imageClass: "object-cover object-center",
    mediaClass: "bg-[#071326]",
    position:
      "min-h-[18rem] lg:col-start-5 lg:row-start-1 lg:col-span-4 lg:row-span-4 lg:min-h-0",
  },
  {
    moduleIndex: 2,
    icon: Mic02Icon,
    status: "mixed" as const,
    image: "/app-future/plexus-talk.png",
    imageClass: "object-cover object-center",
    mediaClass: "bg-[#071326]",
    position:
      "min-h-[21rem] lg:col-start-5 lg:row-start-5 lg:col-span-4 lg:row-span-4 lg:min-h-0",
  },
  {
    moduleIndex: 3,
    icon: SecurityCheckIcon,
    status: "adapter" as const,
    image: "/app-future/agreement-studio-plexa-country-v2.png",
    imageClass: "object-cover object-center",
    mediaClass: "bg-[#071326]",
    position:
      "min-h-[22rem] lg:col-start-1 lg:row-start-8 lg:col-span-4 lg:row-span-5 lg:min-h-0",
  },
  {
    moduleIndex: 4,
    icon: CheckmarkCircle02Icon,
    status: "live" as const,
    image: "/app-future/mou-engine-web-transparent.png",
    imageClass: "object-contain object-center p-4",
    mediaClass: "bg-[#e7dfcf]",
    position:
      "min-h-[22rem] lg:col-start-5 lg:row-start-9 lg:col-span-4 lg:row-span-4 lg:min-h-0",
  },
  {
    moduleIndex: 6,
    icon: Building01Icon,
    status: "mixed" as const,
    image: "/app-future/session-summary-devices-transparent.png",
    imageClass: "object-contain object-center p-4 sm:p-6",
    mediaClass: "bg-[#071326]",
    position:
      "min-h-[23rem] lg:col-start-9 lg:row-start-7 lg:col-span-4 lg:row-span-6 lg:min-h-0",
  },
  {
    moduleIndex: 7,
    icon: AiBrain01Icon,
    status: "concept" as const,
    image: null,
    imageClass: "",
    mediaClass: "",
    position:
      "min-h-[23rem] lg:col-start-9 lg:row-start-1 lg:col-span-4 lg:row-span-6 lg:min-h-0",
  },
]

const capabilityStatusClasses = {
  live: "bg-[#d9f8ee] text-[#08664d]",
  mixed: "bg-[#deebff] text-[#0758c8]",
  adapter: "bg-[#fff0c9] text-[#735000]",
  concept: "bg-[#e9e5f4] text-[#51436a]",
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>
}) {
  const params = await searchParams
  const locale = normalizePublicLocale(params.lang)
  const content = getPublicContent(locale)
  const copy = editorialCopy[locale]

  return (
    <main className="min-h-svh bg-[#f7f7f2] text-[#111826]">
      <SiteHeader content={content} locale={locale} currentPath="/" />

      <section className="bg-[#0a84ff] px-4 pt-5 pb-5 sm:px-6 lg:px-8 lg:pb-8">
        <div className="mx-auto max-w-[1440px] overflow-hidden rounded-[1.375rem] bg-[#0758c8] text-white shadow-[0_24px_70px_rgba(7,19,38,0.2)]">
          <div className="grid lg:min-h-[690px] lg:grid-cols-[0.94fr_1.06fr]">
            <div className="relative z-10 flex flex-col justify-between px-6 py-8 sm:px-10 sm:py-14 lg:px-14 lg:py-16">
              <div className="hero-reveal">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/24 bg-[#071326] px-3 py-1.5 text-xs font-semibold text-white">
                  <span className="size-1.5 rounded-full bg-[#80e8ff]" />
                  {copy.status}
                </div>
                <h1 className="mt-5 max-w-3xl text-[2.85rem] leading-[0.94] font-semibold tracking-[-0.035em] text-balance sm:mt-7 sm:text-[clamp(3.25rem,5vw,4.75rem)]">
                  {content.hero.title}
                </h1>
                <p className="mt-5 max-w-xl text-sm leading-6 text-[#e7f5ff] sm:mt-7 sm:text-lg sm:leading-7">
                  {content.hero.body}
                </p>
                <p className="mt-3 hidden max-w-xl text-sm leading-6 text-[#cfeaff] sm:block">
                  {copy.statusDetail}
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row">
                  <Button
                    asChild
                    size="lg"
                    className="h-12 rounded-lg bg-[#071326] px-5 text-sm text-white hover:bg-[#102443]"
                  >
                    <Link href={withLocale("/contact", locale)}>
                      {content.cta.vendor}
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="h-12 rounded-lg border-white/35 !bg-white px-5 text-sm !text-[#0758c8] hover:!bg-[#eaf7ff]"
                  >
                    <Link href={withLocale("/for-businesses", locale)}>
                      {content.cta.business}
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="mt-12 hidden items-center gap-3 text-xs font-semibold text-[#e5f6ff] lg:flex">
                <span className="h-px flex-1 bg-white/30" />
                <span>{content.meta.tagline}</span>
              </div>
            </div>

            <div className="relative min-h-[480px] overflow-hidden sm:min-h-[520px] lg:min-h-full">
              <Image
                src="/plexus-home-governed-collaboration-v2.webp"
                alt={copy.heroImageAlt}
                fill
                priority
                sizes="(min-width: 1024px) 53vw, 100vw"
                className="object-cover object-[56%_center] saturate-[0.95]"
              />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,88,200,0.42)_0%,rgba(7,88,200,0.08)_32%,rgba(7,19,38,0.14)_100%)]" />
              <div className="absolute inset-x-4 bottom-4 grid gap-2 sm:grid-cols-3 sm:gap-3 lg:inset-x-6 lg:bottom-6">
                {copy.stages.slice(1, 4).map((stage, index) => (
                  <div
                    key={stage.title}
                    className={
                      index === 1
                        ? "rounded-xl bg-[#071326] p-4 text-white shadow-[0_12px_28px_rgba(7,19,38,0.3)]"
                        : "rounded-xl bg-[#f7f7f2] p-4 text-[#111826] shadow-[0_12px_28px_rgba(7,19,38,0.18)]"
                    }
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold">
                        {stage.title}
                      </span>
                      <HugeiconsIcon
                        icon={
                          index === 2 ? Calendar03Icon : CheckmarkCircle02Icon
                        }
                        size={18}
                        strokeWidth={1.9}
                        className={
                          index === 1 ? "text-[#80e8ff]" : "text-[#0a84ff]"
                        }
                      />
                    </div>
                    <p
                      className={
                        index === 1
                          ? "mt-3 text-xs leading-5 text-[#dcecf7]"
                          : "mt-3 text-xs leading-5 text-[#4d6076]"
                      }
                    >
                      {stage.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="bg-[#eef4f8] px-4 py-20 sm:px-6 lg:px-8 lg:py-24"
      >
        <div className="mx-auto max-w-[1440px]">
          <div className="grid gap-6 lg:grid-cols-[1fr_0.68fr] lg:items-end">
            <h2 className="max-w-4xl text-[clamp(2.75rem,5vw,4.75rem)] leading-[0.98] font-semibold tracking-[-0.035em] text-balance">
              {copy.journeyTitle}
            </h2>
            <p className="max-w-2xl text-base leading-7 text-[#53667c] lg:pb-1 lg:text-lg lg:leading-8">
              {copy.journeyBody}
            </p>
          </div>

          <div className="mt-12 overflow-hidden rounded-[1.375rem] bg-[#b9d0e1]">
            <div className="pulse-track h-1 w-full bg-[#0a84ff]" />
            <ol className="grid gap-px sm:grid-cols-2 xl:grid-cols-[0.92fr_1.06fr_1fr_1fr_1.18fr]">
              {copy.stages.map((stage, index) => (
                <li
                  key={stage.title}
                  className="flex flex-col bg-[#dcecf7] p-5 sm:p-6 sm:last:col-span-2 xl:min-h-[19rem] xl:last:col-span-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="grid size-9 place-items-center rounded-full bg-[#071326] text-sm font-semibold text-white">
                      {index + 1}
                    </span>
                    <HugeiconsIcon
                      icon={stageIcons[index]}
                      size={22}
                      strokeWidth={1.7}
                      className="text-[#0758c8]"
                    />
                  </div>
                  <h3 className="mt-6 text-xl font-semibold tracking-[-0.02em]">
                    {stage.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#53667c]">
                    {stage.body}
                  </p>
                  <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-[#b9d0e1] pt-4 text-xs leading-5 xl:mt-auto xl:grid-cols-1 xl:gap-0">
                    <div>
                      <dt className="font-semibold text-[#0758c8]">
                        {copy.journeyOwnerLabel}
                      </dt>
                      <dd className="mt-0.5 text-[#33475d]">{stage.owner}</dd>
                    </div>
                    <div className="xl:mt-3">
                      <dt className="font-semibold text-[#0758c8]">
                        {copy.journeyRecordLabel}
                      </dt>
                      <dd className="mt-0.5 text-[#33475d]">{stage.record}</dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ol>
            <div className="grid gap-4 bg-[#071326] px-6 py-6 text-white sm:px-7 lg:grid-cols-[0.72fr_1.28fr] lg:items-center lg:gap-10 lg:px-8">
              <div className="flex items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#0758c8] text-[#80e8ff]">
                  <HugeiconsIcon
                    icon={CheckmarkCircle02Icon}
                    size={21}
                    strokeWidth={1.8}
                  />
                </span>
                <h3 className="text-xl font-semibold tracking-[-0.02em] sm:text-2xl">
                  {copy.governanceTitle}
                </h3>
              </div>
              <p className="max-w-3xl text-sm leading-6 text-[#dcecf7] sm:text-base sm:leading-7">
                {copy.governanceBody}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="home-events-title"
        className="bg-[#f7f7f2] px-4 py-20 sm:px-6 lg:px-8 lg:py-24"
      >
        <div className="mx-auto max-w-[1440px]">
          <div className="grid gap-6 lg:grid-cols-[1fr_0.72fr] lg:items-end">
            <h2
              id="home-events-title"
              className="max-w-4xl text-[clamp(2.75rem,5vw,4.75rem)] leading-[0.98] font-semibold tracking-[-0.035em] text-balance"
            >
              {content.homeEventsLayer.title}
            </h2>
            <p className="max-w-2xl text-base leading-7 text-[#53667c] lg:pb-1 lg:text-lg lg:leading-8">
              {content.homeEventsLayer.body}
            </p>
          </div>

          <div className="mt-12 overflow-hidden rounded-[1.375rem] bg-[#071326] text-white shadow-[0_24px_70px_rgba(7,19,38,0.16)]">
            <div className="bg-[#0758c8] p-6 sm:p-8 lg:p-10">
              <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-end">
                <div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#c2fcff]">
                      <HugeiconsIcon
                        icon={Calendar03Icon}
                        size={19}
                        strokeWidth={1.8}
                      />
                      {content.homeEventsLayer.label}
                    </span>
                    <span className="text-xs font-semibold tracking-[0.16em] text-[#cfeaff] lg:hidden">
                      01—04
                    </span>
                  </div>
                  <h3 className="mt-7 max-w-xl text-3xl leading-tight font-semibold tracking-[-0.03em] text-balance sm:text-4xl">
                    {content.homeEventsLayer.recordTitle}
                  </h3>
                </div>

                <div>
                  <div className="mb-3 hidden justify-end text-xs font-semibold tracking-[0.16em] text-[#cfeaff] lg:flex">
                    01—04
                  </div>
                  <EventHandoff
                    onlineLabel={content.homeEventsLayer.online}
                    onGroundLabel={content.homeEventsLayer.onGround}
                  />
                </div>
              </div>
            </div>

            <div className="relative bg-[#071326]">
              <span
                aria-hidden="true"
                className="absolute top-[4.85rem] right-[12.5%] left-[12.5%] hidden h-px bg-[#80e8ff]/35 lg:block"
              />
              <ol className="relative grid lg:grid-cols-4">
                {content.homeEventsLayer.phases.map((phase, index) => (
                  <li
                    key={phase.title}
                    className="relative border-t border-white/12 p-6 first:border-t-0 sm:p-8 lg:min-h-[17rem] lg:border-t-0 lg:border-l lg:first:border-l-0"
                  >
                    <span className="relative z-10 grid size-11 place-items-center rounded-full bg-[#0a84ff] text-sm font-semibold text-white tabular-nums ring-8 ring-[#071326]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <h3 className="mt-9 text-xl font-semibold tracking-[-0.02em] sm:text-2xl">
                      {phase.title}
                    </h3>
                    <p className="mt-3 max-w-sm text-sm leading-6 text-[#b8cadc] sm:text-base sm:leading-7">
                      {phase.body}
                    </p>
                  </li>
                ))}
              </ol>
            </div>

            <div className="flex flex-col gap-4 bg-[#dcecf7] px-6 py-6 text-[#111826] sm:flex-row sm:items-center sm:px-8 lg:px-10">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#0758c8] text-[#80e8ff]">
                <HugeiconsIcon
                  icon={CheckmarkCircle02Icon}
                  size={21}
                  strokeWidth={1.8}
                />
              </span>
              <p className="max-w-4xl text-sm leading-7 text-[#33475d] sm:text-base">
                {content.homeEventsLayer.recordBody}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="home-capabilities-title"
        className="bg-[#f7f4eb] px-4 py-20 text-[#111826] sm:px-6 lg:px-8 lg:py-24"
      >
        <div className="mx-auto max-w-[1440px]">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.62fr] lg:items-end">
            <h2
              id="home-capabilities-title"
              className="max-w-4xl text-[clamp(2.75rem,5vw,4.75rem)] leading-[0.98] font-semibold tracking-[-0.035em] text-balance"
            >
              {content.homeCapabilityShowcase.title}
            </h2>
            <p className="max-w-2xl text-base leading-7 text-[#53667c] lg:text-lg lg:leading-8">
              {content.homeCapabilityShowcase.body}
            </p>
          </div>

          <div
            data-capability-grid
            className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:grid-rows-[repeat(12,minmax(0,3.125rem))]"
          >
            {capabilityShowcasePresentation.map((presentation) => {
              const capability =
                content.homeCapabilityShowcase.modules[presentation.moduleIndex]
              const isConcept = presentation.status === "concept"

              if (isConcept) {
                return (
                  <Link
                    key={capability.number}
                    href={withLocale("/app#capabilities", locale)}
                    aria-label={`${capability.title} — ${content.homeCapabilityShowcase.cta}`}
                    className={`${presentation.position} group relative flex overflow-hidden rounded-2xl bg-[#0758c8] p-6 text-white shadow-[0_18px_38px_rgba(7,88,200,0.24)] transition-[background-color,transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:bg-[#064caf] hover:shadow-[0_24px_46px_rgba(6,76,175,0.3)] focus-visible:outline-white sm:p-7`}
                  >
                    <div className="flex w-full flex-col">
                      <div className="flex items-start justify-between gap-4">
                        <span className="text-sm font-semibold tracking-[0.14em] text-white/70 tabular-nums">
                          {capability.number}
                        </span>
                        <span
                          className={`${capabilityStatusClasses[presentation.status]} inline-flex h-6 items-center rounded-full px-2.5 text-[0.6875rem] leading-none font-bold tracking-[0.05em] uppercase`}
                        >
                          {
                            content.homeCapabilityShowcase.status[
                              presentation.status
                            ]
                          }
                        </span>
                      </div>

                      <span className="mt-8 grid size-12 place-items-center self-end rounded-full bg-white/15 text-white transition-transform duration-300 ease-out group-hover:translate-x-1 group-hover:-translate-y-1">
                        <HugeiconsIcon
                          icon={ArrowUpRight01Icon}
                          size={22}
                          strokeWidth={1.9}
                        />
                      </span>

                      <div className="mt-auto max-w-xs">
                        <h3 className="text-3xl leading-[1.02] font-semibold tracking-[-0.03em] text-balance sm:text-4xl">
                          {capability.title}
                        </h3>
                        <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white">
                          {content.homeCapabilityShowcase.cta}
                          <HugeiconsIcon
                            icon={ArrowUpRight01Icon}
                            size={16}
                            strokeWidth={1.9}
                          />
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              }

              return (
                <article
                  key={capability.number}
                  className={`${presentation.position} group relative overflow-hidden rounded-2xl border border-[#ddd5c6] bg-[#f3eee2] p-6 text-[#111826] shadow-[0_14px_32px_rgba(82,67,40,0.08)] sm:p-7`}
                >
                  <div className="relative z-20 flex items-start justify-between gap-4">
                    <span className="text-sm font-semibold tracking-[0.14em] text-[#6f6a61] tabular-nums">
                      {capability.number}
                    </span>
                    <span
                      className={`${capabilityStatusClasses[presentation.status]} inline-flex h-6 items-center rounded-full px-2.5 text-[0.6875rem] leading-none font-bold tracking-[0.05em] uppercase`}
                    >
                      {
                        content.homeCapabilityShowcase.status[
                          presentation.status
                        ]
                      }
                    </span>
                  </div>

                  {presentation.image ? (
                    <div
                      className={`${presentation.mediaClass} absolute inset-x-4 top-[4.25rem] bottom-[5.75rem] overflow-hidden rounded-xl sm:inset-x-5`}
                    >
                      <Image
                        src={presentation.image}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className={presentation.imageClass}
                      />
                      <span className="absolute top-3 left-3 rounded-full bg-[#f7f4eb]/92 px-2.5 py-1 text-[0.6875rem] font-semibold text-[#33465d] shadow-[0_5px_14px_rgba(7,19,38,0.12)]">
                        {content.homeCapabilityShowcase.previewLabel}
                      </span>
                    </div>
                  ) : null}

                  <div className="absolute right-6 bottom-6 left-6 z-20 flex items-end justify-between gap-4 sm:right-7 sm:bottom-7 sm:left-7">
                    <h3 className="max-w-[17rem] text-xl leading-tight font-semibold tracking-[-0.025em] text-balance sm:text-2xl">
                      {capability.title}
                    </h3>
                    <HugeiconsIcon
                      icon={presentation.icon}
                      size={22}
                      strokeWidth={1.8}
                      className="shrink-0 text-[#0758c8]"
                    />
                  </div>
                </article>
              )
            })}
          </div>

          <div className="mt-7 flex flex-col gap-3 text-sm text-[#53667c] sm:flex-row sm:items-center sm:justify-between">
            <span className="inline-flex items-center gap-2 font-semibold text-[#111826]">
              <HugeiconsIcon icon={Radar02Icon} size={18} strokeWidth={1.8} />
              {content.homeCapabilityShowcase.label}
            </span>
            <span>{content.homeCapabilityShowcase.meta}</span>
          </div>
        </div>
      </section>

      <section className="bg-[#071326] px-4 py-20 text-white sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-[1440px]">
          <div className="grid gap-6 lg:grid-cols-[1fr_0.7fr] lg:items-end">
            <h2 className="max-w-4xl text-4xl leading-tight font-semibold tracking-[-0.03em] sm:text-6xl">
              {content.homeAudienceRouter.title}
            </h2>
            <p className="max-w-xl text-base leading-7 text-[#b8cadc]">
              {content.homeAudienceRouter.body}
            </p>
          </div>
          <div className="mt-12 grid gap-px overflow-hidden rounded-2xl bg-white/12 lg:grid-cols-3">
            {[
              {
                title: content.audiences.business,
                body: content.homeAudienceRouter.business.body,
                cta: content.homeAudienceRouter.business.cta,
                href: "/for-businesses",
                icon: Building01Icon,
                tone: "bg-[#0758c8]",
              },
              {
                title: content.audiences.operators,
                body: content.homeAudienceRouter.operators.body,
                cta: content.homeAudienceRouter.operators.cta,
                href: "/for-program-operators",
                icon: UserGroupIcon,
                tone: "bg-[#102443]",
              },
              {
                title: content.audiences.investment,
                body: content.homeAudienceRouter.investment.body,
                cta: content.homeAudienceRouter.investment.cta,
                href: "/for-investment",
                icon: LicenseDraftIcon,
                tone: "bg-[#0b1b32]",
              },
              {
                title: content.audiences.government,
                body: content.homeAudienceRouter.government.body,
                cta: content.homeAudienceRouter.government.cta,
                href: "/for-government",
                icon: Globe02Icon,
                tone: "bg-[#102443]",
              },
              {
                title: content.homeAudienceRouter.events.title,
                body: content.homeAudienceRouter.events.body,
                cta: content.homeAudienceRouter.events.cta,
                href: "/events",
                icon: Calendar03Icon,
                tone: "bg-[#0758c8]",
              },
            ].map((item) => (
              <Link
                key={item.href}
                href={withLocale(item.href, locale)}
                className={`${item.tone} group min-h-72 p-7 transition-colors hover:bg-[#0758c8] sm:p-8`}
              >
                <HugeiconsIcon
                  icon={item.icon}
                  size={28}
                  strokeWidth={1.7}
                  className="text-[#80e8ff]"
                />
                <h3 className="mt-12 text-2xl font-semibold">{item.title}</h3>
                <p className="mt-4 max-w-sm text-sm leading-6 text-[#d3e2ef]">
                  {item.body}
                </p>
                <span className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-white">
                  {item.cta}
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    size={17}
                    strokeWidth={1.8}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter content={content} locale={locale} currentPath="/" />
    </main>
  )
}
