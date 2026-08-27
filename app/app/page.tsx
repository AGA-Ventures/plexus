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
      "The whole business journey, in one superapp.",
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
      title: "Pratonton Produk Plexus — Satu Superap Perniagaan Terkawal",
      description:
        "Terokai cara Plexus menyatukan profil syarikat, pemadanan, mesyuarat, perjanjian, operasi acara, tadbir urus, dan tindakan susulan dalam satu superap berbilang bahasa.",
    },
    journey: [
      ["01", "Profil", "Bina satu rekod syarikat"],
      ["02", "Padan", "Semak hubungan yang relevan"],
      ["03", "Temu", "Selaras perbualan"],
      ["04", "Setuju", "Pastikan semakan dan tandatangan kelihatan"],
      ["05", "Bertindak", "Tugaskan langkah seterusnya yang bertanggungjawab"],
    ],
    capabilities: [
      {
        name: "Cangkerang platform dan penyetempatan",
        detail: "Asas berbilang bahasa dan berlabel putih",
        state: "Langsung",
      },
      {
        name: "Identiti dan penyewaan",
        detail: "Peranan, penyewa dan skop syarikat",
        state: "Langsung",
      },
      {
        name: "Penyertaan dan profil",
        detail: "Permohonan, kelulusan dan rekod syarikat",
        state: "Langsung",
      },
      {
        name: "Direktori dan pemadanan",
        detail: "Penemuan, permintaan dan penerimaan bersama",
        state: "Langsung",
      },
      {
        name: "Mesyuarat dan jurubahasa",
        detail: "Penjadualan dengan serahan penyedia",
        state: "Campuran",
      },
      {
        name: "Urus niaga dan dokumen",
        detail: "Status MOU dengan penyesuai kitar hayat dokumen",
        state: "Campuran",
      },
      {
        name: "Operasi acara",
        detail: "Jadual perjalanan, lawatan tapak, penghubung dan jurubahasa",
        state: "Langsung",
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
        state: "Langsung",
      },
      {
        name: "Pelaporan dan pemerhatian",
        detail: "Ringkasan operasi; pemantauan masih dirancang",
        state: "Campuran",
      },
      {
        name: "Bantuan AI",
        detail: "Arah produk ilustratif yang disemak manusia",
        state: "Konsep",
      },
    ],
    states: [
      ["Langsung", "Disimpan dan disahkan dalam produk terkawal"],
      [
        "Campuran",
        "Aliran kerja langsung dengan langkah terkawal atau penyesuai",
      ],
      ["Penyesuai", "Antara muka wujud; penyedia pengeluaran belum lengkap"],
      ["Konsep", "Arah ilustratif, bukan keupayaan langsung"],
    ],
    hero: [
      "Keseluruhan perjalanan perniagaan, dalam satu superap.",
      "Plexus menghubungkan rekod syarikat, semakan penganjur, penerimaan bersama, mesyuarat, perjanjian, operasi acara dan tindakan susulan yang bertanggungjawab—tanpa menyembunyikan keputusan manusia di antaranya.",
      "Terokai produk berhubung",
      "Skrin ilustratif dilabelkan. Ketersediaan berbeza mengikut modul.",
      "Pratonton produk pra-pelancaran",
      "Superap Plexus merentasi ekosistem produk mudah alih dan desktop yang bersatu",
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
      "Plexus direka supaya peserta tidak perlu memulakan semula proses pada setiap peringkat. Konteks yang diluluskan bergerak bersama hubungan, manakala pengendali penyewa mengekalkan semakan, keterlihatan dan kawalan.",
    ],
    foundation: [
      "Mulakan dengan asas syarikat yang berguna.",
      "Profil berstruktur, kelulusan penyewa dan konteks perniagaan bersama membina rekod sumber untuk penemuan, mesyuarat, operasi acara dan tindakan susulan.",
      [
        "Profil syarikat Delegasi dan Rakan Kongsi",
        "Semakan permohonan penyewa dan penyediaan akaun",
        "Dokumen peribadi dan sumber bersama yang diluluskan",
        "Skop peranan, penyewa dan syarikat yang jelas",
      ],
      "Company Brain ialah rawatan produk ilustratif. Aliran kerja profil, penyewaan dan sumber yang mendasari merupakan sebahagian daripada produk langsung.",
      "Konsep Company Brain dipersembahkan sebagai modul dalam superap Plexus",
      "Asas profil",
    ],
    matching: [
      "Penemuan menjadi hubungan yang ditadbir urus.",
      "Syarikat peserta menemui pihak rakan yang dibenarkan, meminta padanan dan bergerak ke hadapan hanya melalui aliran kerja semakan dan penerimaan bersama program.",
      ["Temui", "Minta", "Semak", "Penerimaan bersama"],
      "Skor dan status padanan ialah data produk langsung. Rawatan kedudukan visual yang ditunjukkan di sini adalah ilustratif.",
      "Konsep Plexus Match yang menunjukkan hubungan perniagaan yang disemak",
    ],
    meetings: [
      "Mesyuarat ialah sebahagian daripada rekod operasi—bukan penghujungnya.",
      "Penjadualan dan status mesyuarat adalah langsung. Pentafsiran, penciptaan penyedia automatik, gesaan langsung dan kecerdasan transkrip kekal terkawal, disokong penyesuai atau konseptual bergantung pada modul.",
      "Konsep untuk pentafsiran dan konteks mesyuarat bersama, dengan kesediaan bahasa dan penyedia dinyatakan dengan jelas.",
      "Keupayaan konsep",
      "Gesaan ilustratif boleh mengetengahkan soalan belum selesai untuk semakan manusia tanpa membuat keputusan komersial.",
      "Gesaan ilustratif",
    ],
    followUp: [
      "Perbualan menjadi tindakan susulan yang bertanggungjawab.",
      "Arah produk membawa keputusan, pemilik, rekod mesyuarat, status perjanjian dan tindakan seterusnya kembali ke perjalanan operasi yang sama.",
      "Lapisan ringkasan yang dirancang untuk keputusan, pemilik yang dinamakan, tarikh akhir, tindakan susulan dan rekod boleh disemak merentasi mudah alih dan desktop.",
      [
        ["Status mesyuarat", "Langsung"],
        ["Ringkasan automatik", "Konsep"],
        ["Kemas kini penyedia", "Penyesuai"],
      ],
      "Status urus niaga dan penandatangan adalah langsung. Bantuan draf konteks negara PLEXA, senarai semak bidang kuasa, dokumen kolaboratif dan tandatangan elektronik kekal sebagai keupayaan penyesuai atau konsep, dengan kedua-dua pihak bertanggungjawab untuk semakan.",
      "Ringkasan tindakan Plexus diselaraskan merentasi desktop dan mudah alih",
      ["Draf", "Semak", "Bekerjasama", "E-tandatangan"],
      "Konsep Plexus Agreement Studio dengan bantuan draf konteks negara PLEXA dan semakan manusia yang diperlukan",
    ],
    capability: [
      "Peta superap lengkap, dengan kesediaan yang jelas.",
      "Pratonton yang kemas bukan bukti bahawa setiap modul adalah langsung. Peta keupayaan yang dikekalkan membezakan tingkah laku produk yang disahkan daripada langkah terkawal, penyesuai penyedia dan arah masa hadapan.",
    ],
    plexa: [
      "PLEXA boleh membantu sepanjang perjalanan. Ia tidak memiliki keputusan.",
      "Arah pembantu penerokaan ini boleh mengatur konteks yang diluluskan, menyediakan perbualan, mengetengahkan soalan terbuka dan menyusun tindakan susulan. Penyedia, skop, kawalan semakan dan pelancaran masih belum diputuskan.",
      ["Sediakan", "Orientasi", "Gesaan", "Susun"],
      "Konsep teras penyelarasan PLEXA yang menghubungkan konteks syarikat, taklimat padanan, bantuan mesyuarat, draf perjanjian dan tindakan susulan di bawah semakan manusia",
    ],
    cta: [
      "Lihat bagaimana perjalanan terkawal sesuai dengan program anda.",
      "Minta panduan pra-pelancaran yang memfokuskan penyewa, peserta, model operasi dan keperluan penyedia anda.",
      "Minta panduan",
    ],
    footer: "Kembali ke laman web Plexus",
  },
  "zh-Hant": {
    metadata: {
      title: "Plexus 產品預覽 — 一個受治理的商業超級應用",
      description:
        "探索 Plexus 如何把公司檔案、配對、會議、協議、活動營運、治理和後續跟進整合到一個多語言超級應用中。",
    },
    journey: [
      ["01", "檔案", "建立一份公司紀錄"],
      ["02", "配對", "審閱相關連結"],
      ["03", "會面", "協調對話"],
      ["04", "協議", "讓審閱和簽署保持可見"],
      ["05", "行動", "指派負責任的下一步"],
    ],
    capabilities: [
      { name: "平台框架與在地化", detail: "多語言、白標基礎", state: "已上線" },
      { name: "身分與租戶", detail: "角色、租戶和公司範圍", state: "已上線" },
      { name: "入駐與檔案", detail: "申請、審批和公司紀錄", state: "已上線" },
      { name: "名錄與配對", detail: "探索、請求和雙方接受", state: "已上線" },
      { name: "會議與傳譯", detail: "設有服務供應商交接的排程", state: "混合" },
      {
        name: "交易與文件",
        detail: "配有文件生命周期適配器的 MOU 狀態",
        state: "混合",
      },
      {
        name: "活動營運",
        detail: "行程、實地考察、聯絡協調和傳譯",
        state: "已上線",
      },
      { name: "通訊與資源", detail: "公告、通知和私人檔案", state: "混合" },
      {
        name: "合規",
        detail: "受保護工作區；供應商範圍尚未完整",
        state: "適配器",
      },
      { name: "治理與審計", detail: "設定、配置和特權事件", state: "已上線" },
      {
        name: "報告與可觀測性",
        detail: "營運摘要；監控仍在規劃中",
        state: "混合",
      },
      { name: "AI 協助", detail: "經人手審閱的示意產品方向", state: "概念" },
    ],
    states: [
      ["已上線", "已在受控產品中保存及驗證"],
      ["混合", "設有受控或適配器步驟的上線流程"],
      ["適配器", "介面已存在；生產供應商尚未完整"],
      ["概念", "示意方向，並非上線功能"],
    ],
    hero: [
      "完整商業旅程，盡在一個超級應用。",
      "Plexus 連結公司紀錄、主辦方審閱、雙方接受、會議、協議、活動營運和負責任的後續跟進——不會隱藏當中的人為決策。",
      "探索互連產品",
      "示意畫面均有標示。供應情況因模組而異。",
      "推出前產品預覽",
      "Plexus 超級應用橫跨整合式流動和桌面產品生態系統",
    ],
    nav: ["探索超級應用", "公司基礎", "會議", "後續跟進", "所有功能"],
    intro: [
      "一份公司紀錄應推動工作持續向前。",
      "Plexus 的設計讓參與者無須在每個階段重新開始。已批准的脈絡會隨關係流轉，同時租戶營運人員保留審閱、可見性和控制權。",
    ],
    foundation: [
      "先建立有用的公司基礎。",
      "結構化檔案、租戶批准和共享商業脈絡，為探索、會議、活動營運和後續跟進建立來源紀錄。",
      [
        "代表團和合作夥伴公司檔案",
        "租戶申請審閱及帳戶配置",
        "私人文件和已批准的共享資源",
        "明確的角色、租戶和公司範圍",
      ],
      "Company Brain 是示意產品處理方式。其底層檔案、租戶和資源流程均屬於已上線產品的一部分。",
      "Company Brain 概念作為 Plexus 超級應用中的模組呈現",
      "檔案基礎",
    ],
    matching: [
      "探索成為受治理的連結。",
      "參與公司探索獲准的對應方、提出配對請求，並只會透過計劃的審閱和雙方接受流程推進。",
      ["探索", "請求", "審閱", "雙方接受"],
      "配對分數和狀態是已上線產品資料。此處展示的視覺排序處理屬示意性質。",
      "Plexus Match 概念，展示經審閱的商業連結",
    ],
    meetings: [
      "會議是營運紀錄的一部分——不是終點。",
      "排程和會議狀態已上線。視乎模組而定，傳譯、自動建立服務供應商、即時提示和逐字稿智能仍屬受控、適配器支援或概念功能。",
      "一個用於傳譯和共享會議脈絡的概念，並清楚呈現語言和服務供應商準備情況。",
      "概念功能",
      "示意提示可呈現未解決問題供人手審閱，而不會作出商業決定。",
      "示意提示",
    ],
    followUp: [
      "對話成為可負責的後續跟進。",
      "產品方向把決定、負責人、會議紀錄、協議狀態和下一步行動帶回同一營運旅程。",
      "為決定、具名負責人、到期日、後續跟進和可審閱紀錄而規劃的摘要層，適用於流動和桌面裝置。",
      [
        ["會議狀態", "已上線"],
        ["自動摘要", "概念"],
        ["服務供應商更新", "適配器"],
      ],
      "交易和簽署方狀態已上線。PLEXA 的國家脈絡草擬協助、司法管轄區清單、協作文件和電子簽署仍是適配器或概念功能，雙方均須負責審閱。",
      "Plexus 行動簡報在桌面和流動裝置間同步",
      ["草擬", "審閱", "協作", "電子簽署"],
      "Plexus Agreement Studio 概念，配有 PLEXA 國家脈絡草擬協助及必需的人手審閱",
    ],
    capability: [
      "完整超級應用地圖，清楚呈現準備情況。",
      "精緻的預覽並非每個模組均已上線的證明。持續維護的功能地圖區分已驗證的產品行為、受控步驟、服務供應商適配器和未來方向。",
    ],
    plexa: [
      "PLEXA 可協助整個旅程，但不會擁有決定權。",
      "這個探索性助手方向可整理已批准的脈絡、準備對話、呈現開放問題和組織後續跟進。服務供應商、範圍、審閱控制和推出安排仍未承諾。",
      ["準備", "導向", "提示", "組織"],
      "PLEXA 協調核心概念，在人手審閱下連結公司脈絡、配對簡報、會議協助、協議草擬和後續跟進",
    ],
    cta: [
      "了解受治理旅程如何配合您的計劃。",
      "索取一場推出前導覽，聚焦您的租戶、參與者、營運模式和服務供應商要求。",
      "索取導覽",
    ],
    footer: "返回 Plexus 網站",
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
