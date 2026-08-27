import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  AiBrain01Icon,
  ArrowUpRight01Icon,
  Building03Icon,
  CheckmarkCircle02Icon,
  Globe02Icon,
  LicenseDraftIcon,
  Mic02Icon,
  Radar02Icon,
  SecurityCheckIcon,
} from "@hugeicons/core-free-icons"

import { PlexusBrand } from "@/components/plexus-future-ui"
import { SiteHeader } from "@/components/site-header"
import {
  getPublicContent,
  normalizePublicLocale,
  type PublicLocale,
  withLocale,
} from "@/lib/public-site"
import styles from "./styles.module.css"

type ProductPreviewCopy = {
  metadata: Metadata
  journey: [string, string, string][]
  capabilities: { name: string; detail: string; state: string }[]
  states: [string, string][]
  hero: [string, string, string, string, string, string]
  nav: [string, string, string, string, string]
  intro: [string, string]
  foundation: [string, string, string[], string, string, string]
  matching: [string, string, string[], string, string]
  meetings: [string, string, string, string, string, string]
  followUp: [
    string,
    string,
    string,
    [string, string][],
    string,
    string,
    string[],
    string,
  ]
  capability: [string, string]
  plexa: [string, string, string[], string]
  cta: [string, string, string]
  footer: string
}

const productPreviewCopy: Record<PublicLocale, ProductPreviewCopy> = {
  en: {
    metadata: {
      title: "Plexus Product Preview — One Governed Business Superapp",
      description:
        "Explore how Plexus brings company profiles, matching, meetings, agreements, event operations, governance, and follow-up into one multilingual superapp.",
    },
    journey: [
      ["01", "Profile", "Build one company record"],
      ["02", "Match", "Review relevant connections"],
      ["03", "Meet", "Coordinate the conversation"],
      ["04", "Agree", "Keep review and signing visible"],
      ["05", "Act", "Assign the responsible next step"],
    ],
    capabilities: [
      {
        name: "Platform shell & localization",
        detail: "Multilingual, white-label foundations",
        state: "Live",
      },
      {
        name: "Identity & tenancy",
        detail: "Role, tenant, and company scope",
        state: "Live",
      },
      {
        name: "Onboarding & profiles",
        detail: "Applications, approval, and company records",
        state: "Live",
      },
      {
        name: "Directory & matching",
        detail: "Discovery, requests, and mutual acceptance",
        state: "Live",
      },
      {
        name: "Meetings & interpreters",
        detail: "Scheduling with provider handoffs",
        state: "Mixed",
      },
      {
        name: "Deals & documents",
        detail: "MOU state with document lifecycle adapters",
        state: "Mixed",
      },
      {
        name: "Event operations",
        detail: "Itineraries, site visits, liaison, interpreters",
        state: "Live",
      },
      {
        name: "Communications & resources",
        detail: "Announcements, notifications, and private files",
        state: "Mixed",
      },
      {
        name: "Compliance",
        detail: "Protected workspace; provider scope incomplete",
        state: "Adapter",
      },
      {
        name: "Governance & audit",
        detail: "Settings, provisioning, and privileged events",
        state: "Live",
      },
      {
        name: "Reporting & observability",
        detail: "Operational summaries; monitoring still planned",
        state: "Mixed",
      },
      {
        name: "AI assistance",
        detail: "Illustrative, human-reviewed product direction",
        state: "Concept",
      },
    ],
    states: [
      ["Live", "Persisted and verified in the controlled product"],
      ["Mixed", "Live workflow with a controlled or adapter step"],
      ["Adapter", "Interface exists; production provider is incomplete"],
      ["Concept", "Illustrative direction, not a live capability"],
    ],
    hero: [
      "One operating record for the entire business journey.",
      "Plexus connects the company record, organizer review, mutual acceptance, meetings, agreements, event operations, and accountable follow-up—without hiding the human decisions between them.",
      "Explore the connected product",
      "Illustrative screens are labelled. Availability varies by module.",
      "Pre-launch product preview",
      "Plexus superapp across a unified mobile and desktop product ecosystem",
    ],
    nav: [
      "Explore the superapp",
      "Company foundation",
      "Meetings",
      "Follow-up",
      "All capabilities",
    ],
    intro: [
      "One company record should carry the work forward.",
      "Plexus is designed so participants do not restart the process at each stage. Approved context moves with the relationship while tenant operators retain review, visibility, and control.",
    ],
    foundation: [
      "Start with a useful company foundation.",
      "A structured profile, tenant approval, and shared business context create the source record for discovery, meetings, event operations, and follow-up.",
      [
        "Delegation and Partner company profiles",
        "Tenant application review and account provisioning",
        "Private documents and approved shared resources",
        "Explicit role, tenant, and company scope",
      ],
      "Company Brain is an illustrative product treatment. The underlying profile, tenancy, and resource workflows are part of the live product.",
      "Company Brain concept presented as a module inside the Plexus superapp",
      "Profile foundation",
    ],
    matching: [
      "Discovery becomes a governed connection.",
      "Participating companies discover permitted counterparties, request a match, and move forward only through the program's review and mutual-acceptance workflow.",
      ["Discover", "Request", "Review", "Mutual acceptance"],
      "Match score and status are live product data. The visual ranking treatment shown here is illustrative.",
      "Plexus Match concept showing a reviewed business connection",
    ],
    meetings: [
      "The meeting is part of the operating record—not a dead end.",
      "Scheduling and meeting state are live. Interpretation, automated provider creation, live prompts, and transcript intelligence remain controlled, adapter-backed, or conceptual depending on the module.",
      "A concept for interpretation and shared meeting context, with language and provider readiness kept explicit.",
      "Concept capability",
      "Illustrative prompts can surface unresolved questions for human review without making the commercial decision.",
      "Illustrative prompts",
    ],
    followUp: [
      "Conversation becomes accountable follow-up.",
      "The product direction brings decisions, owners, meeting records, agreement state, and the next action back into the same operating journey.",
      "A planned summary layer for decisions, named owners, due dates, follow-ups, and reviewable records across mobile and desktop.",
      [
        ["Meeting state", "Live"],
        ["Automated summary", "Concept"],
        ["Provider updates", "Adapter"],
      ],
      "Deal and signatory state are live. PLEXA country-context draft assistance, jurisdiction checklists, collaborative documents, and e-signature remain adapter or concept capabilities, with both parties responsible for review.",
      "Plexus action brief synchronized across desktop and mobile",
      ["Draft", "Review", "Collaborate", "E-sign"],
      "Plexus Agreement Studio concept with PLEXA country-context draft assistance and required human review",
    ],
    capability: [
      "The complete superapp map, with readiness visible.",
      "A polished preview is not evidence that every module is live. The maintained capability map distinguishes verified product behavior from controlled steps, provider adapters, and future direction.",
    ],
    plexa: [
      "PLEXA may assist across the journey. It does not own the decision.",
      "This exploratory assistant direction could organize approved context, prepare conversations, surface open questions, and structure follow-up. Providers, scope, review controls, and rollout remain uncommitted.",
      ["Prepare", "Orient", "Prompt", "Structure"],
      "PLEXA coordination-core concept connecting company context, match briefing, meeting assistance, agreement drafting, and follow-up under human review",
    ],
    cta: [
      "See how the governed journey fits your program.",
      "Request a pre-launch walkthrough focused on your tenant, participants, operating model, and provider requirements.",
      "Request a walkthrough",
    ],
    footer: "Return to the Plexus website",
  },
  ms: {
    metadata: {
      title: "Pratonton Produk Plexus—Aplikasi Super Perniagaan Bertadbir",
      description:
        "Terokai cara Plexus menyatukan profil syarikat, padanan, mesyuarat, perjanjian, operasi acara, tadbir urus dan tindakan susulan dalam satu aplikasi super berbilang bahasa.",
    },
    journey: [
      ["01", "Profil", "Bina satu rekod syarikat"],
      ["02", "Padan", "Semak hubungan yang relevan"],
      ["03", "Temu", "Selaras perbualan"],
      ["04", "Setuju", "Pastikan semakan dan tandatangan kelihatan"],
      [
        "05",
        "Bertindak",
        "Tetapkan langkah seterusnya dan pihak bertanggungjawab",
      ],
    ],
    capabilities: [
      {
        name: "Rangka kerja platform dan penyetempatan",
        detail: "Asas berbilang bahasa dan berjenama sendiri",
        state: "Aktif",
      },
      {
        name: "Identiti dan skop organisasi",
        detail: "Peranan, organisasi pelanggan dan skop syarikat",
        state: "Aktif",
      },
      {
        name: "Pendaftaran dan profil",
        detail: "Permohonan, kelulusan dan rekod syarikat",
        state: "Aktif",
      },
      {
        name: "Direktori dan pemadanan",
        detail: "Penemuan, permintaan dan penerimaan bersama",
        state: "Aktif",
      },
      {
        name: "Mesyuarat dan jurubahasa",
        detail: "Penjadualan dan penyerahan kepada penyedia",
        state: "Campuran",
      },
      {
        name: "Urus niaga dan dokumen",
        detail: "Status MOU dengan penyesuai kitar hayat dokumen",
        state: "Campuran",
      },
      {
        name: "Operasi acara",
        detail:
          "Jadual perjalanan, lawatan tapak, pegawai perhubungan dan jurubahasa",
        state: "Aktif",
      },
      {
        name: "Komunikasi dan sumber",
        detail: "Pengumuman, pemberitahuan dan fail peribadi",
        state: "Campuran",
      },
      {
        name: "Pematuhan",
        detail: "Ruang kerja terlindung; skop penyedia belum lengkap",
        state: "Penyesuai",
      },
      {
        name: "Tadbir urus dan audit",
        detail: "Tetapan, peruntukan dan acara berkeistimewaan",
        state: "Aktif",
      },
      {
        name: "Pelaporan dan pemantauan",
        detail: "Ringkasan operasi; pemantauan masih dirancang",
        state: "Campuran",
      },
      {
        name: "Bantuan AI",
        detail: "Hala tuju produk ilustrasi dengan semakan manusia",
        state: "Konsep",
      },
    ],
    states: [
      ["Aktif", "Disimpan dan disahkan dalam persekitaran produk terkawal"],
      ["Campuran", "Aliran kerja aktif dengan langkah terkawal atau penyesuai"],
      [
        "Penyesuai",
        "Antara muka tersedia; integrasi penyedia pengeluaran belum lengkap",
      ],
      ["Konsep", "Hala tuju ilustrasi, bukan keupayaan aktif"],
    ],
    hero: [
      "Satu rekod operasi untuk keseluruhan perjalanan perniagaan",
      "Plexus menghubungkan rekod syarikat, semakan penganjur, persetujuan kedua-dua pihak, mesyuarat, perjanjian, operasi acara dan susulan dengan tanggungjawab yang jelas—tanpa menyembunyikan keputusan manusia.",
      "Terokai produk bersepadu",
      "Skrin ilustratif dilabelkan. Ketersediaan berbeza mengikut modul.",
      "Pratonton produk pra-pelancaran",
      "Aplikasi super Plexus merangkumi ekosistem produk mudah alih dan desktop yang bersepadu",
    ],
    nav: [
      "Terokai superap",
      "Asas syarikat",
      "Mesyuarat",
      "Tindakan susulan",
      "Semua keupayaan",
    ],
    intro: [
      "Satu rekod syarikat perlu membawa kerja ke hadapan.",
      "Plexus direka supaya peserta tidak perlu memulakan semula proses pada setiap peringkat. Konteks yang diluluskan bergerak bersama hubungan, manakala pengendali organisasi mengekalkan semakan, keterlihatan dan kawalan.",
    ],
    foundation: [
      "Mulakan dengan asas syarikat yang berguna.",
      "Profil berstruktur, kelulusan organisasi dan konteks perniagaan bersama membina rekod sumber untuk penemuan, mesyuarat, operasi acara dan tindakan susulan.",
      [
        "Profil syarikat Delegasi dan Rakan Kongsi",
        "Semakan permohonan organisasi dan penyediaan akaun",
        "Dokumen peribadi dan sumber bersama yang diluluskan",
        "Skop peranan, organisasi dan syarikat yang jelas",
      ],
      "Company Brain ialah gambaran produk ilustrasi. Aliran kerja profil, organisasi dan sumber yang mendasarinya merupakan sebahagian daripada produk aktif.",
      "Konsep Company Brain dipersembahkan sebagai modul dalam aplikasi super Plexus",
      "Asas profil",
    ],
    matching: [
      "Penemuan menjadi hubungan dalam aliran kerja bertadbir.",
      "Syarikat peserta menemui bakal rakan yang dibenarkan, meminta padanan dan hanya bergerak ke hadapan melalui semakan program serta persetujuan kedua-dua pihak.",
      ["Temui", "Minta", "Semak", "Penerimaan bersama"],
      "Skor dan status padanan ialah data produk aktif. Paparan susunan visual di sini hanyalah ilustrasi.",
      "Konsep Plexus Match yang menunjukkan hubungan perniagaan yang disemak",
    ],
    meetings: [
      "Mesyuarat ialah sebahagian daripada rekod operasi—bukan penghujungnya.",
      "Penjadualan dan status mesyuarat sudah aktif. Bergantung pada modul, perkhidmatan jurubahasa, penciptaan penyedia automatik, arahan masa nyata dan analisis transkrip pintar masih merupakan langkah terkawal, disokong penyesuai atau berbentuk konsep.",
      "Konsep untuk perkhidmatan jurubahasa dan konteks mesyuarat bersama, dengan kesiapsiagaan bahasa dan penyedia dinyatakan dengan jelas.",
      "Keupayaan konsep",
      "Gesaan ilustratif boleh mengetengahkan soalan belum selesai untuk semakan manusia tanpa membuat keputusan komersial.",
      "Gesaan ilustratif",
    ],
    followUp: [
      "Perbualan menjadi tindakan susulan dengan tanggungjawab yang jelas.",
      "Hala tuju produk membawa keputusan, pihak bertanggungjawab, rekod mesyuarat, status perjanjian dan tindakan seterusnya kembali ke aliran operasi yang sama.",
      "Lapisan ringkasan yang dirancang untuk keputusan, pihak bertanggungjawab, tarikh akhir, tindakan susulan dan rekod yang boleh disemak pada peranti mudah alih dan desktop.",
      [
        ["Status mesyuarat", "Aktif"],
        ["Ringkasan automatik", "Konsep"],
        ["Kemas kini penyedia", "Penyesuai"],
      ],
      "Status urus niaga dan penandatangan sudah aktif. Bantuan draf konteks negara PLEXA, senarai semak bidang kuasa, dokumen kolaboratif dan tandatangan elektronik masih merupakan keupayaan penyesuai atau konsep, dan kedua-dua pihak bertanggungjawab menyemaknya.",
      "Ringkasan tindakan Plexus diselaraskan merentasi desktop dan mudah alih",
      ["Draf", "Semak", "Bekerjasama", "E-tandatangan"],
      "Konsep Plexus Agreement Studio dengan bantuan draf konteks negara PLEXA dan semakan manusia yang diperlukan",
    ],
    capability: [
      "Peta superap lengkap, dengan kesediaan yang jelas.",
      "Pratonton yang kemas bukan bukti bahawa setiap modul sudah aktif. Peta keupayaan yang diselenggara membezakan tingkah laku produk yang disahkan daripada langkah terkawal, penyesuai penyedia dan hala tuju masa hadapan.",
    ],
    plexa: [
      "PLEXA boleh membantu sepanjang aliran kerja, tetapi tidak menggantikan keputusan manusia.",
      "Arah pembantu penerokaan ini boleh mengatur konteks yang diluluskan, menyediakan perbualan, mengetengahkan soalan terbuka dan menyusun tindakan susulan. Penyedia, skop, kawalan semakan dan pelancaran masih belum diputuskan.",
      ["Sediakan", "Orientasi", "Gesaan", "Susun"],
      "Konsep teras penyelarasan PLEXA yang menghubungkan konteks syarikat, taklimat padanan, bantuan mesyuarat, draf perjanjian dan tindakan susulan di bawah semakan manusia",
    ],
    cta: [
      "Lihat cara aliran kerja bertadbir sesuai dengan program anda.",
      "Minta demonstrasi pra-pelancaran yang memfokuskan organisasi, peserta, model operasi dan keperluan penyedia anda.",
      "Minta demonstrasi",
    ],
    footer: "Kembali ke laman web Plexus",
  },
  "zh-Hans": {
    metadata: {
      title: "Plexus 产品预览——规范化运营的商务超级应用",
      description:
        "探索 Plexus 如何将企业资料、配对、会议、协议、活动运营、治理及后续行动整合到一个多语言超级应用中。",
    },
    journey: [
      ["01", "资料", "建立一份企业记录"],
      ["02", "配对", "查看相关联系"],
      ["03", "会面", "协调对话"],
      ["04", "协议", "让审核和签署保持可见"],
      ["05", "行动", "指定责任明确的下一步"],
    ],
    capabilities: [
      { name: "平台框架与本地化", detail: "多语言、白标基础", state: "已上线" },
      { name: "身份与租户", detail: "角色、租户和公司范围", state: "已上线" },
      {
        name: "注册与企业资料",
        detail: "申请、审批和企业记录",
        state: "已上线",
      },
      { name: "名录与配对", detail: "探索、请求和双方接受", state: "已上线" },
      { name: "会议与口译", detail: "会议排期与服务供应商交接", state: "混合" },
      {
        name: "交易与文件",
        detail: "配有文件生命周期适配器的 MOU 状态",
        state: "混合",
      },
      {
        name: "活动运营",
        detail: "行程、实地考察、联络协调和口译",
        state: "已上线",
      },
      { name: "沟通与资源", detail: "公告、通知和私有文件", state: "混合" },
      {
        name: "合规",
        detail: "受保护工作区；供应商范围尚未完整",
        state: "适配器",
      },
      { name: "治理与审计", detail: "设置、配置和特权事件", state: "已上线" },
      {
        name: "报告与可观测性",
        detail: "运营摘要；监控仍在规划中",
        state: "混合",
      },
      { name: "AI 协助", detail: "经人工审核的示意产品方向", state: "概念" },
    ],
    states: [
      ["已上线", "已在受控产品环境中保存及验证"],
      ["混合", "设有受控或适配器步骤的上线流程"],
      ["适配器", "界面已存在；生产供应商集成尚未完成"],
      ["概念", "示意方向，并非上线功能"],
    ],
    hero: [
      "一份运营记录\n贯穿整个商务流程",
      "Plexus 连接企业记录、主办方审核、双方确认、会议、协议、活动运营及责任明确的后续行动，并让人工决策保持清晰可见。",
      "探索互联产品",
      "示意画面均有明确标注。功能可用情况因模块而异。",
      "预发布产品预览",
      "Plexus 超级应用覆盖一体化移动端与桌面端产品生态",
    ],
    nav: ["探索超级应用", "公司基础", "会议", "后续跟进", "所有功能"],
    intro: [
      "一份企业记录应推动工作持续向前",
      "Plexus 的设计让参与者无需在每个阶段重新开始。已批准的背景会随关系流转，同时租户运营人员保留审核、可见性和控制权。",
    ],
    foundation: [
      "先建立有用的公司基础",
      "结构化企业资料、租户批准及共享商业背景，为发现机会、会议、活动运营和后续行动建立来源记录。",
      [
        "代表团和合作伙伴企业资料",
        "租户申请审核及账户配置",
        "私人文件和已批准的共享资源",
        "明确的角色、租户和公司范围",
      ],
      "Company Brain 用于示意产品的处理方式。其底层企业资料、租户和资源流程均属于已上线产品的一部分。",
      "Company Brain 概念作为 Plexus 超级应用中的模块呈现",
      "资料基础",
    ],
    matching: [
      "让商务联系进入规范流程",
      "参与企业可以发现获准的合作对象并提出配对请求，只有通过项目审核及双方确认后才会继续推进。",
      ["发现", "请求", "审核", "双方确认"],
      "配对分数和状态属于已上线产品数据。此处展示的可视化排序方式仅作示意。",
      "Plexus Match 概念，展示经审核的商务联系",
    ],
    meetings: [
      "会议是运营记录的一部分——不是终点",
      "排期和会议状态已上线。具体取决于所选模块，口译、自动创建服务供应商账户、实时提示及会议文字记录智能分析仍属于受控、适配器支持或概念功能。",
      "一个用于口译和共享会议背景的概念，并清楚呈现语言和服务供应商准备情况。",
      "概念功能",
      "示意提示可以呈现待解决问题供人工审核，但不会代替人员作出商务决策。",
      "示意提示",
    ],
    followUp: [
      "让对话转化为责任明确的后续行动",
      "产品规划将决策、负责人、会议记录、协议状态及下一步行动带回同一运营流程。",
      "为决策、明确负责人、到期日、后续行动及可审核记录而规划的摘要层，适用于移动端和桌面端。",
      [
        ["会议状态", "已上线"],
        ["自动摘要", "概念"],
        ["服务供应商更新", "适配器"],
      ],
      "交易和签署方状态已上线。PLEXA 的国家背景起草辅助、司法辖区清单、协作文件及电子签署仍是适配器或概念功能，双方均须负责审核。",
      "Plexus 行动简报在桌面和移动设备间同步",
      ["起草", "审核", "协作", "电子签署"],
      "Plexus Agreement Studio 概念，配有 PLEXA 国家背景起草辅助及必要的人工审核",
    ],
    capability: [
      "完整超级应用地图\n清楚呈现准备情况",
      "精致的预览并非每个模块均已上线的证明。持续维护的功能地图区分已验证的产品行为、受控步骤、服务供应商适配器和未来方向。",
    ],
    plexa: [
      "PLEXA 可以协助整个流程\n但不会代替人员作出决策",
      "这一探索性助手的规划方向可以整理已批准的背景、准备对话、呈现开放问题及组织后续行动。服务供应商、范围、审核控制和发布安排仍未确定。",
      ["准备", "导向", "提示", "组织"],
      "PLEXA 协调核心概念，在人工审核下连接企业背景、配对简报、会议协助、协议起草及后续行动",
    ],
    cta: [
      "了解规范流程如何配合您的项目",
      "索取预发布演示，重点了解您的租户、参与者、运营模式及服务供应商需求。",
      "索取演示",
    ],
    footer: "返回 Plexus 网站",
  },
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>
}): Promise<Metadata> {
  const { lang } = await searchParams
  return productPreviewCopy[normalizePublicLocale(lang)].metadata
}

export default async function ProductPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>
}) {
  const { lang } = await searchParams
  const locale = normalizePublicLocale(lang)
  const content = getPublicContent(locale)
  const copy = productPreviewCopy[locale]
  const [heroTitle, heroBody, heroCta, heroNote, heroStatus, heroAlt] =
    copy.hero
  const [navLabel, foundationNav, meetingsNav, followUpNav, capabilitiesNav] =
    copy.nav
  const [
    foundationTitle,
    foundationBody,
    foundationPoints,
    foundationNote,
    foundationAlt,
    foundationTag,
  ] = copy.foundation
  const [
    matchingTitle,
    matchingBody,
    matchingSteps,
    matchingNote,
    matchingAlt,
  ] = copy.matching
  const [
    meetingsTitle,
    meetingsBody,
    talkBody,
    talkState,
    radarBody,
    radarState,
  ] = copy.meetings
  const [
    followUpTitle,
    followUpBody,
    actionBody,
    actionLabels,
    agreementBody,
    actionAlt,
    agreementSteps,
    agreementAlt,
  ] = copy.followUp
  const [capabilityTitle, capabilityBody] = copy.capability
  const [plexaTitle, plexaBody, plexaTasks, plexaAlt] = copy.plexa
  const [ctaTitle, ctaBody, ctaAction] = copy.cta

  return (
    <main className={styles.page}>
      <SiteHeader content={content} locale={locale} currentPath="/app" />
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <h1>{heroTitle}</h1>
            <p>{heroBody}</p>
            <div className={styles.heroActions}>
              <a className={styles.primaryAction} href="#experience">
                {heroCta}
                <HugeiconsIcon
                  icon={ArrowUpRight01Icon}
                  size={18}
                  strokeWidth={1.8}
                />
              </a>
              <span>{heroNote}</span>
            </div>
          </div>
          <div className={styles.heroVisual}>
            <span className={styles.previewStatus}>{heroStatus}</span>
            <Image
              src="/app-future/plexus-superapp-system-hero-v4.png"
              alt={heroAlt}
              fill
              priority
              loading="eager"
              sizes="(max-width: 900px) 100vw, 58vw"
              className={styles.heroImage}
            />
          </div>
        </div>
        <ol className={styles.journeyRail} aria-label={navLabel}>
          {copy.journey.map(([number, title, detail]) => (
            <li key={number}>
              <span>{number}</span>
              <div>
                <strong>{title}</strong>
                <small>{detail}</small>
              </div>
            </li>
          ))}
        </ol>
      </section>
      <nav className={styles.sectionNav} aria-label={navLabel}>
        <span>{navLabel}</span>
        <div>
          <a href="#foundation">{foundationNav}</a>
          <a href="#meetings">{meetingsNav}</a>
          <a href="#follow-up">{followUpNav}</a>
          <a href="#capabilities">{capabilitiesNav}</a>
        </div>
      </nav>
      <section id="experience" className={styles.intro}>
        <div>
          <h2>{copy.intro[0]}</h2>
        </div>
        <p>{copy.intro[1]}</p>
      </section>
      <section id="foundation" className={styles.foundation}>
        <div className={styles.foundationCopy}>
          <span className={styles.moduleIcon}>
            <HugeiconsIcon icon={AiBrain01Icon} size={24} strokeWidth={1.6} />
          </span>
          <h2>{foundationTitle}</h2>
          <p>{foundationBody}</p>
          <ul>
            {foundationPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
          <div className={styles.truthNote}>
            <HugeiconsIcon
              icon={SecurityCheckIcon}
              size={19}
              strokeWidth={1.7}
            />
            {foundationNote}
          </div>
        </div>
        <div className={styles.phoneStage}>
          <Image
            src="/app-future/company-brain-phone-transparent.png"
            alt={foundationAlt}
            fill
            sizes="(max-width: 840px) 92vw, 46vw"
            className={styles.phoneImage}
          />
          <span className={styles.moduleTag}>{foundationTag}</span>
        </div>
      </section>
      <section className={styles.matchingBand}>
        <div className={styles.matchingVisual}>
          <Image
            src="/app-future/plexus-match-phone-transparent.png"
            alt={matchingAlt}
            fill
            sizes="(max-width: 840px) 92vw, 44vw"
            className={styles.phoneImage}
          />
        </div>
        <div className={styles.matchingCopy}>
          <span className={styles.moduleIconDark}>
            <HugeiconsIcon icon={Globe02Icon} size={24} strokeWidth={1.6} />
          </span>
          <h2>{matchingTitle}</h2>
          <p>{matchingBody}</p>
          <div className={styles.flowSteps}>
            {matchingSteps.map((step) => (
              <span key={step}>{step}</span>
            ))}
          </div>
          <small>{matchingNote}</small>
        </div>
      </section>
      <section id="meetings" className={styles.meetingSuite}>
        <div className={styles.meetingHeader}>
          <h2>{meetingsTitle}</h2>
          <p>{meetingsBody}</p>
        </div>
        <div className={styles.meetingGrid}>
          <article className={styles.talkPanel}>
            <div className={styles.panelCopy}>
              <HugeiconsIcon icon={Mic02Icon} size={24} strokeWidth={1.6} />
              <h3>Plexus Talk</h3>
              <p>{talkBody}</p>
              <span>{talkState}</span>
            </div>
            <div className={styles.tallPhone}>
              <Image
                src="/app-future/plexus-talk-phone-front-v2.png"
                alt="Plexus Talk"
                fill
                sizes="(max-width: 760px) 86vw, 28vw"
                className={styles.phoneImage}
              />
            </div>
          </article>
          <article className={styles.radarPanel}>
            <div className={styles.panelCopy}>
              <HugeiconsIcon icon={Radar02Icon} size={24} strokeWidth={1.6} />
              <h3>Deal Radar</h3>
              <p>{radarBody}</p>
              <span>{radarState}</span>
            </div>
            <div className={styles.tallPhone}>
              <Image
                src="/app-future/deal-radar-phone-front-v2.png"
                alt="Deal Radar"
                fill
                sizes="(max-width: 760px) 86vw, 28vw"
                className={styles.phoneImage}
              />
            </div>
          </article>
        </div>
      </section>
      <section id="follow-up" className={styles.followUp}>
        <div className={styles.followUpHeader}>
          <h2>{followUpTitle}</h2>
          <p>{followUpBody}</p>
        </div>
        <article className={styles.deviceFeature}>
          <div className={styles.deviceVisual}>
            <Image
              src="/app-future/session-summary-devices-transparent.png"
              alt={actionAlt}
              fill
              sizes="(max-width: 900px) 100vw, 62vw"
              className={styles.deviceImage}
            />
          </div>
          <div className={styles.deviceCopy}>
            <HugeiconsIcon
              icon={CheckmarkCircle02Icon}
              size={25}
              strokeWidth={1.6}
            />
            <h3>Plexus Action Brief</h3>
            <p>{actionBody}</p>
            <dl>
              {actionLabels.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </article>
        <article
          className={`${styles.deviceFeature} ${styles.agreementFeature}`}
        >
          <div className={styles.deviceCopy}>
            <HugeiconsIcon
              icon={LicenseDraftIcon}
              size={25}
              strokeWidth={1.6}
            />
            <h3>Plexus Agreement Studio</h3>
            <p>{agreementBody}</p>
            <div className={styles.agreementFlow}>
              {agreementSteps.map((step) => (
                <span key={step}>{step}</span>
              ))}
            </div>
          </div>
          <div className={styles.deviceVisual}>
            <Image
              src="/app-future/agreement-studio-plexa-country-v2.png"
              alt={agreementAlt}
              fill
              sizes="(max-width: 900px) 100vw, 62vw"
              className={styles.deviceImage}
            />
          </div>
        </article>
      </section>
      <section id="capabilities" className={styles.capabilityMap}>
        <div className={styles.capabilityIntro}>
          <h2>{capabilityTitle}</h2>
          <p>{capabilityBody}</p>
          <div className={styles.statusLegend}>
            {copy.states.map(([name, note]) => (
              <div key={name}>
                <span data-state={name}>{name}</span>
                <small>{note}</small>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.capabilityList}>
          {copy.capabilities.map((capability, index) => (
            <div className={styles.capabilityRow} key={capability.name}>
              <span className={styles.capabilityIndex}>
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h3>{capability.name}</h3>
                <p>{capability.detail}</p>
              </div>
              <span className={styles.stateBadge} data-state={capability.state}>
                {capability.state}
              </span>
            </div>
          ))}
        </div>
      </section>
      <section className={styles.plexa}>
        <div className={styles.plexaVisual}>
          <Image
            src="/app-future/plexa-agent-system-v2.png"
            alt={plexaAlt}
            fill
            sizes="(max-width: 900px) 100vw, 58vw"
            className={styles.plexaImage}
          />
        </div>
        <div className={styles.plexaCopy}>
          <span className={styles.moduleIconDark}>
            <HugeiconsIcon icon={AiBrain01Icon} size={24} strokeWidth={1.6} />
          </span>
          <h2>{plexaTitle}</h2>
          <p>{plexaBody}</p>
          <div className={styles.plexaTasks}>
            {plexaTasks.map((task) => (
              <span key={task}>{task}</span>
            ))}
          </div>
        </div>
      </section>
      <section className={styles.cta}>
        <HugeiconsIcon icon={Building03Icon} size={30} strokeWidth={1.5} />
        <h2>{ctaTitle}</h2>
        <p>{ctaBody}</p>
        <Link
          className={styles.lightAction}
          href={withLocale("/contact", locale)}
        >
          {ctaAction}
          <HugeiconsIcon
            icon={ArrowUpRight01Icon}
            size={18}
            strokeWidth={1.8}
          />
        </Link>
      </section>
      <footer className={styles.footer}>
        <PlexusBrand compact />
        <Link href={withLocale("/", locale)}>{copy.footer}</Link>
        <span>© 2026 PLEXUS</span>
      </footer>
    </main>
  )
}
