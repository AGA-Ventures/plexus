import type { Metadata } from "next"
import Image from "next/image"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowUpRight01Icon,
  AiBrain01Icon,
  Building03Icon,
  CheckmarkCircle02Icon,
  Globe02Icon,
  LicenseDraftIcon,
  Mic02Icon,
  Radar02Icon,
  SecurityCheckIcon,
} from "@hugeicons/core-free-icons"

import {
  FutureButton,
  PlexusBrand,
  ShowcaseVideoLink,
  UiLabel,
  UiSignal,
} from "@/components/plexus-future-ui"
import styles from "./styles.module.css"

export const metadata: Metadata = {
  title: "PLEXUS Future App — The Trade Super App",
  description:
    "See how PLEXUS and PLEXA will connect global business discovery, meetings, intelligence, agreements, and trade execution in one super app.",
}

const features = [
  {
    id: "brain",
    number: "01",
    phase: "Before the meeting",
    title: "Company Brain",
    description:
      "Upload your company once. PLEXA understands your products, pricing, certifications, ambitions, and relationship history—then prepares every conversation around what matters.",
    signal: "Meeting brief · shared interests · risks · win probability",
    image: "/app-future/company-brain.png",
    alt: "An intelligent company profile connected to global business data",
    icon: AiBrain01Icon,
  },
  {
    id: "matching",
    number: "02",
    phase: "Discover opportunity",
    title: "Plexus Match",
    description:
      "Move beyond contact lists. PLEXUS ranks the right buyers, suppliers, and strategic partners by intent, capability, market fit, and trust signals.",
    signal: "Live intent · verified capability · 91% partnership fit",
    image: "/app-future/plexus-match.png",
    alt: "Two compatible global companies connecting across a trade network",
    icon: Globe02Icon,
  },
  {
    id: "talk",
    number: "03",
    phase: "Meet without borders",
    title: "Plexus Talk",
    description:
      "Everyone speaks naturally in their own language. Live interpretation, transcription, speaker recognition, and cultural context run quietly beneath the meeting.",
    signal: "Chinese ↔ English ↔ Japanese ↔ Korean · live",
    image: "/app-future/plexus-talk.png",
    alt: "An international business meeting connected by live translation",
    icon: Mic02Icon,
  },
  {
    id: "radar",
    number: "04",
    phase: "Intelligence in the room",
    title: "Deal Radar",
    description:
      "PLEXA listens for what is missing—not only what is said. It surfaces unresolved objections, delivery questions, compliance gaps, and the next best question in real time.",
    signal: "3 open signals · delivery · MOQ · compliance",
    image: "/app-future/deal-radar.png",
    alt: "A business negotiation table monitored by an intelligent deal radar",
    icon: Radar02Icon,
  },
  {
    id: "summary",
    number: "05",
    phase: "Turn talk into action",
    title: "AI Session Summary",
    description:
      "The moment the meeting ends, decisions become tasks, owners, follow-ups, CRM records, and a shared source of truth that moves the relationship forward.",
    signal: "Decisions · owners · next meeting · CRM updated",
    image: "/app-future/session-summary.png",
    alt: "A meeting record organizing itself into actions and follow-ups",
    icon: CheckmarkCircle02Icon,
  },
  {
    id: "mou",
    number: "06",
    phase: "From intent to agreement",
    title: "AI MOU Engine",
    description:
      "PLEXA drafts the MOU, NDA, cooperation agreement, or partnership proposal from the real conversation—ready for both sides to review, negotiate, and e-sign.",
    signal: "Draft → review → collaborate → e-sign",
    image: "/app-future/mou-engine.png",
    alt: "A cross-border agreement assembled from a business conversation",
    icon: LicenseDraftIcon,
  },
]

const modules = [
  ["Plexus ID", "One trusted business identity across the network."],
  ["Plexus Verify", "Company, license, certification, and reputation checks."],
  ["Plexus Connect", "Every relationship, conversation, and open opportunity."],
  ["Plexus Build", "Structure projects and partnerships together."],
  ["Plexus Move", "Logistics, customs, freight, and fulfilment."],
  ["Plexus Guide", "Market rules, grants, certifications, and practical answers."],
  ["Plexus Insight", "Pipeline, conversion, and network intelligence."],
  ["PLEXA", "One AI agent working across every module."],
]

const whatsappHref = "https://wa.me/6012677899"

export default function FutureAppPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.nav}>
          <div className={styles.brandGroup}>
            <PlexusBrand />
            <span className={styles.agentPill}>PLEXA · AI AGENT</span>
          </div>
          <FutureButton href={whatsappHref} size="small">
            Join the future
            <HugeiconsIcon icon={ArrowUpRight01Icon} size={15} strokeWidth={1.8} />
          </FutureButton>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <div className={styles.eyebrow}>The global trade super app</div>
          <h1>
            One relationship.
            <br />
            <em>Every step forward.</em>
          </h1>
          <p>
            PLEXUS brings discovery, live meetings, commercial intelligence,
            agreements, compliance, and trade execution into one connected
            experience—with PLEXA working across it all.
          </p>
          <div className={styles.heroActions}>
            <FutureButton href={whatsappHref}>
              Explore the future app
              <HugeiconsIcon icon={ArrowUpRight01Icon} size={17} strokeWidth={1.8} />
            </FutureButton>
            <span className={styles.heroNote}>Concept vision · 2026–2028</span>
          </div>
        </div>

        <div className={styles.heroVisual}>
          <Image
            src="/app-future/company-brain.png"
            alt="PLEXUS global business intelligence system"
            fill
            priority
            loading="eager"
            sizes="(max-width: 900px) 100vw, 52vw"
            className={styles.heroImage}
          />
          <div className={styles.heroBadge}>
            <span>LIVE SIGNAL</span>
            <strong>91%</strong>
            <small>partner fit</small>
          </div>
          <div className={styles.heroStatus}>
            <HugeiconsIcon icon={SecurityCheckIcon} size={18} strokeWidth={1.7} />
            <div>
              <span>PLEXA is ready</span>
              <small>6 signals prepared for your meeting</small>
            </div>
          </div>
        </div>

        <div className={styles.systemLine}>
          <span>NETWORK</span>
          <b>+</b>
          <span>AI COPILOT</span>
          <b>+</b>
          <span>LIVE INTERPRETER</span>
          <b>+</b>
          <span>TRADE OS</span>
        </div>
      </section>

      <section className={styles.videoShowcase}>
        <div className={styles.videoIntro}>
          <UiLabel>See the connected journey</UiLabel>
          <h2>Watch the future app in motion.</h2>
          <p>
            This video space is ready for your PLEXUS walkthrough—from the first
            signal to the signed trade.
          </p>
        </div>
        <ShowcaseVideoLink
          href="/videos/plexus-app-showcase.mp4"
          poster="/app-future/company-brain.png"
        />
      </section>

      <section id="experience" className={styles.features}>
        {features.map((feature, index) => {
          const Icon = feature.icon

          return (
            <article
              key={feature.id}
              id={feature.id}
              className={`${styles.feature} ${index % 2 === 1 ? styles.reverse : ""}`}
            >
              <div className={styles.featureImageWrap}>
                <Image
                  src={feature.image}
                  alt={feature.alt}
                  fill
                  loading={index === 0 ? "eager" : "lazy"}
                  sizes="(max-width: 840px) 100vw, 50vw"
                  className={styles.featureImage}
                />
                <div className={styles.imageIndex}>{feature.number}</div>
              </div>
              <div className={styles.featureCopy}>
                <div className={styles.featureMeta}>
                  <span className={styles.iconBox}>
                    <HugeiconsIcon icon={Icon} size={21} strokeWidth={1.6} />
                  </span>
                  <span>{feature.phase}</span>
                </div>
                <h2>{feature.title}</h2>
                <p>{feature.description}</p>
                <UiSignal>{feature.signal}</UiSignal>
              </div>
            </article>
          )
        })}
      </section>

      <section id="platform" className={styles.platform}>
        <div className={styles.platformIntro}>
          <UiLabel>One system, built in layers</UiLabel>
          <h2>The operating system underneath global business.</h2>
          <p>
            Start with the next best partner. Stay through the meeting, agreement,
            movement of goods, and growth of the relationship.
          </p>
        </div>
        <div className={styles.moduleGrid}>
          {modules.map(([name, description], index) => (
            <div className={styles.module} key={name}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h3>{name}</h3>
                <p>{description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="roadmap" className={styles.roadmap}>
        <div className={styles.roadmapHeader}>
          <UiLabel>The evolution</UiLabel>
          <h2>From an intelligent assistant to a global trade super app.</h2>
        </div>
        <div className={styles.stages}>
          {[
            ["Now", "AI Trade Assistant", "Meetings, translation, summaries, deal radar, and AI agreements."],
            ["Next", "Trusted Trade Network", "Verified business identities, discovery, matching, and referrals."],
            ["Then", "Trade Operating System", "Projects, compliance, logistics, documentation, and collaboration."],
            ["Future", "Trade Super App", "Marketplace, payments, finance, insurance, and digital contracts."],
          ].map(([label, title, copy], index) => (
            <div className={styles.stage} key={label}>
              <span className={styles.stageNumber}>{String(index + 1).padStart(2, "0")}</span>
              <span className={styles.stageLabel}>{label}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.cta}>
        <HugeiconsIcon icon={Building03Icon} size={28} strokeWidth={1.4} />
        <UiLabel>Built for business without borders</UiLabel>
        <h2>The next trade relationship could begin with one signal.</h2>
        <p>
          PLEXUS is building the intelligent infrastructure that carries it all
          the way to execution.
        </p>
        <FutureButton href={whatsappHref}>
          Request a future walkthrough
          <HugeiconsIcon icon={ArrowUpRight01Icon} size={17} strokeWidth={1.8} />
        </FutureButton>
      </section>

      <footer className={styles.footer}>
        <PlexusBrand compact />
        <span>From first handshake to signed trade.</span>
        <span>© 2026 PLEXUS</span>
      </footer>
    </main>
  )
}
