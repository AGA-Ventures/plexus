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
  howItWorksCta: string
  businessPath: string
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
    status: "Pre-launch · Pilot programs by consultation",
    statusDetail:
      "Available workflows and delivery scope are confirmed program by program.",
    heroImageAlt:
      "Program operator and business owner reviewing a governed Plexus company journey together",
    journeyTitle: "One record from company profile to next action.",
    journeyBody:
      "Each introduction follows a clear, operator-governed process. Participants work from permitted company context, both businesses decide whether to proceed, and teams can keep follow-up visible in the operating record.",
    journeyOwnerLabel: "Decision owner",
    journeyRecordLabel: "Recorded outcome",
    governanceTitle: "People make the decisions.",
    governanceBody:
      "Plexus can help surface relevant matches within operator-governed programs, but participants choose whether to connect and important handoffs remain visible.",
    howItWorksCta: "See how Plexus works",
    businessPath: "Joining through a program? See the business journey.",
    stages: [
      {
        title: "Build the company profile",
        body: "Capture capabilities, objectives and preferred partner criteria.",
        owner: "Participating company",
        record: "Approved company profile",
      },
      {
        title: "Request a match",
        body: "A participant requests a connection from permitted company opportunities.",
        owner: "Participating company",
        record: "Match request",
      },
      {
        title: "Choose to connect",
        body: "Both businesses decide whether the introduction should move forward.",
        owner: "Both companies",
        record: "Mutual decision",
      },
      {
        title: "Meet with context",
        body: "Coordinate participants, timing, interpreters and meeting objectives.",
        owner: "Operator and participants",
        record: "Confirmed meeting record",
      },
      {
        title: "Own the follow-up",
        body: "Record the outcome and, when needed, the responsible person and next action.",
        owner: "Both companies",
        record: "Outcome and follow-up details",
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
    status: "Pra-pelancaran · Program rintis melalui rundingan",
    statusDetail:
      "Aliran kerja yang tersedia dan skop penyampaian disahkan bagi setiap program.",
    heroImageAlt:
      "Pengendali program dan pemilik perniagaan bersama-sama menyemak perjalanan syarikat Plexus yang ditadbir",
    journeyTitle:
      "Satu rekod daripada profil syarikat kepada tindakan seterusnya.",
    journeyBody:
      "Setiap pengenalan mengikuti proses jelas yang ditadbir oleh pengendali. Peserta menggunakan konteks syarikat yang dibenarkan, kedua-dua perniagaan memutuskan sama ada mahu meneruskan, dan pasukan boleh memastikan susulan dapat dilihat dalam rekod operasi.",
    journeyOwnerLabel: "Pemilik keputusan",
    journeyRecordLabel: "Hasil direkodkan",
    governanceTitle: "Manusia membuat keputusan.",
    governanceBody:
      "Plexus boleh membantu menemukan padanan yang relevan dalam program yang ditadbir oleh pengendali, tetapi peserta memilih sama ada mahu berhubung dan penyerahan penting kekal dapat dilihat.",
    howItWorksCta: "Lihat cara Plexus berfungsi",
    businessPath: "Menyertai melalui program? Lihat perjalanan perniagaan.",
    stages: [
      {
        title: "Bina profil syarikat",
        body: "Rekod keupayaan, objektif dan kriteria rakan kongsi pilihan.",
        owner: "Syarikat peserta",
        record: "Profil syarikat diluluskan",
      },
      {
        title: "Minta padanan",
        body: "Peserta meminta hubungan daripada peluang syarikat yang dibenarkan.",
        owner: "Syarikat peserta",
        record: "Permintaan padanan",
      },
      {
        title: "Pilih untuk berhubung",
        body: "Kedua-dua perniagaan memutuskan sama ada pengenalan perlu diteruskan.",
        owner: "Kedua-dua syarikat",
        record: "Keputusan bersama",
      },
      {
        title: "Bertemu dengan konteks",
        body: "Selaraskan peserta, masa, jurubahasa dan objektif mesyuarat.",
        owner: "Pengendali dan peserta",
        record: "Rekod mesyuarat disahkan",
      },
      {
        title: "Bertanggungjawab terhadap susulan",
        body: "Rekod hasil dan, apabila diperlukan, pihak bertanggungjawab serta tindakan seterusnya.",
        owner: "Kedua-dua syarikat",
        record: "Hasil dan butiran susulan",
      },
    ],
    routesTitle: "Pilih pengalaman Plexus yang anda perlukan.",
    routesBody:
      "Pratonton produk, perkhidmatan pra-acara khas dan ruang kerja operasi kini mempunyai laluan yang jelas dan saling berhubung.",
    preview: "Pratonton produk",
    previewBody:
      "Lihat visi aplikasi pra-pelancaran dan pengalaman peserta yang saling berhubung.",
    event: "Perkhidmatan pra-acara",
    eventBody:
      "Sediakan objektif, padanan, mesyuarat dan butiran ketibaan untuk program tertentu.",
    workspace: "Ruang kerja operasi",
    workspaceBody:
      "Log masuk ke ruang kerja pengendali program, syarikat peserta atau platform Plexus mengikut peranan anda.",
    explore: "Terokai",
  },
  "zh-Hans": {
    status: "预发布 · 试点项目需另行洽谈",
    statusDetail: "可用流程及交付范围按项目逐一确认。",
    heroImageAlt: "项目运营方与企业负责人共同查看由 Plexus 治理的企业参与流程",
    journeyTitle: "从企业资料到下一步行动\n记录始终连贯",
    journeyBody:
      "每项引荐均遵循由运营方治理的清晰流程。参与者使用获准开放的企业背景信息，双方企业自行决定是否继续推进，团队也可以在运营记录中保持后续进展清晰可见。",
    journeyOwnerLabel: "决策者",
    journeyRecordLabel: "记录结果",
    governanceTitle: "决定始终由人作出",
    governanceBody:
      "Plexus 可在运营方治理的项目中协助发现相关配对，但是否建立联系由参与者决定，重要交接也保持清晰可见。",
    howItWorksCta: "了解 Plexus 的运作方式",
    businessPath: "通过项目加入？查看企业参与流程。",
    stages: [
      {
        title: "建立企业资料",
        body: "记录企业能力、目标及理想合作伙伴条件。",
        owner: "参与企业",
        record: "已批准的企业资料",
      },
      {
        title: "申请配对",
        body: "参与者从获准开放的企业机会中申请建立联系。",
        owner: "参与企业",
        record: "配对申请",
      },
      {
        title: "选择是否联系",
        body: "双方企业决定是否继续推进引荐。",
        owner: "双方企业",
        record: "双方决定",
      },
      {
        title: "带着背景会面",
        body: "协调参与者、时间、口译员及会议目标。",
        owner: "运营方与参与者",
        record: "已确认的会议记录",
      },
      {
        title: "负责后续跟进",
        body: "记录结果，并在需要时注明负责人及下一步行动。",
        owner: "双方企业",
        record: "结果及跟进详情",
      },
    ],
    routesTitle: "选择您需要的 Plexus 体验",
    routesBody: "产品预览、专项活动前服务及运营工作区现在都有清晰互通的入口。",
    preview: "产品预览",
    previewBody: "查看预发布应用愿景及互联的参与者体验。",
    event: "活动前服务",
    eventBody: "为特定项目准备商务目标、配对、会议及抵达详情。",
    workspace: "运营工作区",
    workspaceBody:
      "根据您的角色，登录项目运营方、参与企业或 Plexus 平台工作区。",
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
    moduleIndex: 5,
    icon: CheckmarkCircle02Icon,
    status: "mixed" as const,
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
                <h1 className="mt-5 max-w-3xl text-[2.85rem] leading-[0.94] font-semibold tracking-[-0.035em] text-balance whitespace-pre-line sm:mt-7 sm:text-[clamp(3.25rem,5vw,4.75rem)]">
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
                    <Link href={withLocale("/how-it-works", locale)}>
                      {copy.howItWorksCta}
                    </Link>
                  </Button>
                </div>
                <Link
                  href={withLocale("/for-businesses", locale)}
                  className="mt-5 inline-flex text-sm font-semibold text-[#e7f5ff] underline decoration-white/35 underline-offset-4 transition-colors hover:text-white hover:decoration-white"
                >
                  {copy.businessPath}
                </Link>
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
            <h2 className="max-w-4xl text-[clamp(2.75rem,5vw,4.75rem)] leading-[0.98] font-semibold tracking-[-0.035em] text-balance whitespace-pre-line">
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
              className="max-w-4xl text-[clamp(2.75rem,5vw,4.75rem)] leading-[0.98] font-semibold tracking-[-0.035em] text-balance whitespace-pre-line"
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
                  <h3 className="mt-7 max-w-xl text-3xl leading-tight font-semibold tracking-[-0.03em] text-balance whitespace-pre-line sm:text-4xl">
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
              className="max-w-4xl text-[clamp(2.75rem,5vw,4.75rem)] leading-[0.98] font-semibold tracking-[-0.035em] text-balance whitespace-pre-line"
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
            {capabilityShowcasePresentation.map((presentation, index) => {
              const capability =
                content.homeCapabilityShowcase.modules[presentation.moduleIndex]
              const displayNumber = String(index + 1).padStart(2, "0")
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
                          {displayNumber}
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
                      {displayNumber}
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
            <h2 className="max-w-4xl text-4xl leading-tight font-semibold tracking-[-0.03em] whitespace-pre-line sm:text-6xl">
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

      <section className="bg-[#dcecf7] px-4 py-20 text-[#111826] sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto grid max-w-[1180px] gap-8 rounded-[1.375rem] bg-white p-7 shadow-[0_20px_55px_rgba(7,19,38,0.1)] sm:p-10 lg:grid-cols-[1fr_auto] lg:items-end lg:p-14">
          <div>
            <h2 className="max-w-4xl text-4xl leading-tight font-semibold tracking-[-0.03em] text-balance sm:text-6xl">
              {content.cta.title}
            </h2>
            <p className="mt-5 max-w-3xl text-base leading-7 text-[#53667c] sm:text-lg sm:leading-8">
              {content.cta.body}
            </p>
          </div>
          <Button
            asChild
            size="lg"
            className="h-12 rounded-lg bg-[#0758c8] px-5 text-white hover:bg-[#064caf]"
          >
            <Link href={withLocale("/contact", locale)}>
              {content.cta.vendor}
            </Link>
          </Button>
        </div>
      </section>

      <SiteFooter content={content} locale={locale} currentPath="/" />
    </main>
  )
}
