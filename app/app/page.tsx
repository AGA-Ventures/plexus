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
  withLocale,
} from "@/lib/public-site"
import styles from "./styles.module.css"

export const metadata: Metadata = {
  title: "Plexus Product Preview — One Governed Business Superapp",
  description:
    "Explore how Plexus brings company profiles, matching, meetings, agreements, event operations, governance, and follow-up into one multilingual superapp.",
}

const journey = [
  ["01", "Profile", "Build one company record"],
  ["02", "Match", "Review relevant connections"],
  ["03", "Meet", "Coordinate the conversation"],
  ["04", "Agree", "Keep review and signing visible"],
  ["05", "Act", "Assign the responsible next step"],
]

const capabilityDomains = [
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
]

const statusNotes = [
  ["Live", "Persisted and verified in the controlled product"],
  ["Mixed", "Live workflow with a controlled or adapter step"],
  ["Adapter", "Interface exists; production provider is incomplete"],
  ["Concept", "Illustrative direction, not a live capability"],
]

export default async function ProductPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>
}) {
  const params = await searchParams
  const requestedLocale = normalizePublicLocale(params.lang)
  const locale = "en" as const
  const content = getPublicContent(locale)

  return (
    <main className={styles.page}>
      <SiteHeader
        content={content}
        locale={locale}
        currentPath="/app"
        supportedLocales={["en"]}
      />

      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <h1>The whole business journey, in one superapp.</h1>
            <p>
              Plexus connects the company record, organizer review, mutual
              acceptance, meetings, agreements, event operations, and
              accountable follow-up—without hiding the human decisions between
              them.
            </p>
            <div className={styles.heroActions}>
              <a className={styles.primaryAction} href="#experience">
                Explore the connected product
                <HugeiconsIcon
                  icon={ArrowUpRight01Icon}
                  size={18}
                  strokeWidth={1.8}
                />
              </a>
              <span>
                Illustrative screens are labelled. Availability varies by
                module.
              </span>
            </div>
          </div>

          <div className={styles.heroVisual}>
            <span className={styles.previewStatus}>
              Pre-launch product preview
            </span>
            <Image
              src="/app-future/plexus-superapp-system-hero-v4.png"
              alt="Plexus superapp across a unified mobile and desktop product ecosystem"
              fill
              priority
              loading="eager"
              sizes="(max-width: 900px) 100vw, 58vw"
              className={styles.heroImage}
            />
          </div>
        </div>

        <ol className={styles.journeyRail} aria-label="Plexus product journey">
          {journey.map(([number, title, detail]) => (
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

      <nav className={styles.sectionNav} aria-label="Product preview sections">
        <span>Explore the superapp</span>
        <div>
          <a href="#foundation">Company foundation</a>
          <a href="#meetings">Meetings</a>
          <a href="#follow-up">Follow-up</a>
          <a href="#capabilities">All capabilities</a>
        </div>
      </nav>

      <section id="experience" className={styles.intro}>
        <div>
          <h2>One company record should carry the work forward.</h2>
        </div>
        <p>
          Plexus is designed so participants do not restart the process at each
          stage. Approved context moves with the relationship while tenant
          operators retain review, visibility, and control.
        </p>
      </section>

      <section id="foundation" className={styles.foundation}>
        <div className={styles.foundationCopy}>
          <span className={styles.moduleIcon}>
            <HugeiconsIcon icon={AiBrain01Icon} size={24} strokeWidth={1.6} />
          </span>
          <h2>Start with a useful company foundation.</h2>
          <p>
            A structured profile, tenant approval, and shared business context
            create the source record for discovery, meetings, event operations,
            and follow-up.
          </p>
          <ul>
            <li>Delegation and Partner company profiles</li>
            <li>Tenant application review and account provisioning</li>
            <li>Private documents and approved shared resources</li>
            <li>Explicit role, tenant, and company scope</li>
          </ul>
          <div className={styles.truthNote}>
            <HugeiconsIcon
              icon={SecurityCheckIcon}
              size={19}
              strokeWidth={1.7}
            />
            Company Brain is an illustrative product treatment. The underlying
            profile, tenancy, and resource workflows are part of the live
            product.
          </div>
        </div>
        <div className={styles.phoneStage}>
          <Image
            src="/app-future/company-brain-phone-transparent.png"
            alt="Company Brain concept presented as a module inside the Plexus superapp"
            fill
            sizes="(max-width: 840px) 92vw, 46vw"
            className={styles.phoneImage}
          />
          <span className={styles.moduleTag}>Profile foundation</span>
        </div>
      </section>

      <section className={styles.matchingBand}>
        <div className={styles.matchingVisual}>
          <Image
            src="/app-future/plexus-match-phone-transparent.png"
            alt="Plexus Match concept showing a reviewed business connection"
            fill
            sizes="(max-width: 840px) 92vw, 44vw"
            className={styles.phoneImage}
          />
        </div>
        <div className={styles.matchingCopy}>
          <span className={styles.moduleIconDark}>
            <HugeiconsIcon icon={Globe02Icon} size={24} strokeWidth={1.6} />
          </span>
          <h2>Discovery becomes a governed connection.</h2>
          <p>
            Participating companies discover permitted counterparties, request a
            match, and move forward only through the program&apos;s review and
            mutual-acceptance workflow.
          </p>
          <div className={styles.flowSteps}>
            <span>Discover</span>
            <span>Request</span>
            <span>Review</span>
            <span>Mutual acceptance</span>
          </div>
          <small>
            Match score and status are live product data. The visual ranking
            treatment shown here is illustrative.
          </small>
        </div>
      </section>

      <section id="meetings" className={styles.meetingSuite}>
        <div className={styles.meetingHeader}>
          <h2>The meeting is part of the operating record—not a dead end.</h2>
          <p>
            Scheduling and meeting state are live. Interpretation, automated
            provider creation, live prompts, and transcript intelligence remain
            controlled, adapter-backed, or conceptual depending on the module.
          </p>
        </div>

        <div className={styles.meetingGrid}>
          <article className={styles.talkPanel}>
            <div className={styles.panelCopy}>
              <HugeiconsIcon icon={Mic02Icon} size={24} strokeWidth={1.6} />
              <h3>Plexus Talk</h3>
              <p>
                A concept for interpretation and shared meeting context, with
                language and provider readiness kept explicit.
              </p>
              <span>Concept capability</span>
            </div>
            <div className={styles.tallPhone}>
              <Image
                src="/app-future/plexus-talk-phone-front-v2.png"
                alt="Front-facing Plexus Talk concept with multilingual meeting interpretation and human review"
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
              <p>
                Illustrative prompts can surface unresolved questions for human
                review without making the commercial decision.
              </p>
              <span>Illustrative prompts</span>
            </div>
            <div className={styles.tallPhone}>
              <Image
                src="/app-future/deal-radar-phone-front-v2.png"
                alt="Front-facing Deal Radar concept with meeting prompts held for human review"
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
          <h2>Conversation becomes accountable follow-up.</h2>
          <p>
            The product direction brings decisions, owners, meeting records,
            agreement state, and the next action back into the same operating
            journey.
          </p>
        </div>

        <article className={styles.deviceFeature}>
          <div className={styles.deviceVisual}>
            <Image
              src="/app-future/session-summary-devices-transparent.png"
              alt="Plexus action brief synchronized across desktop and mobile"
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
            <p>
              A planned summary layer for decisions, named owners, due dates,
              follow-ups, and reviewable records across mobile and desktop.
            </p>
            <dl>
              <div>
                <dt>Meeting state</dt>
                <dd>Live</dd>
              </div>
              <div>
                <dt>Automated summary</dt>
                <dd>Concept</dd>
              </div>
              <div>
                <dt>Provider updates</dt>
                <dd>Adapter</dd>
              </div>
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
            <p>
              Deal and signatory state are live. PLEXA country-context draft
              assistance, jurisdiction checklists, collaborative documents,
              and e-signature remain adapter or concept capabilities, with
              both parties responsible for review.
            </p>
            <div className={styles.agreementFlow}>
              <span>Draft</span>
              <span>Review</span>
              <span>Collaborate</span>
              <span>E-sign</span>
            </div>
          </div>
          <div className={styles.deviceVisual}>
            <Image
              src="/app-future/agreement-studio-plexa-country-v2.png"
              alt="Plexus Agreement Studio concept with PLEXA country-context draft assistance and required human review"
              fill
              sizes="(max-width: 900px) 100vw, 62vw"
              className={styles.deviceImage}
            />
          </div>
        </article>
      </section>

      <section id="capabilities" className={styles.capabilityMap}>
        <div className={styles.capabilityIntro}>
          <h2>The complete superapp map, with readiness visible.</h2>
          <p>
            A polished preview is not evidence that every module is live. The
            maintained capability map distinguishes verified product behavior
            from controlled steps, provider adapters, and future direction.
          </p>
          <div className={styles.statusLegend}>
            {statusNotes.map(([name, note]) => (
              <div key={name}>
                <span data-state={name}>{name}</span>
                <small>{note}</small>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.capabilityList}>
          {capabilityDomains.map((capability, index) => (
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
            alt="PLEXA coordination-core concept connecting company context, match briefing, meeting assistance, agreement drafting, and follow-up under human review"
            fill
            sizes="(max-width: 900px) 100vw, 58vw"
            className={styles.plexaImage}
          />
        </div>
        <div className={styles.plexaCopy}>
          <span className={styles.moduleIconDark}>
            <HugeiconsIcon icon={AiBrain01Icon} size={24} strokeWidth={1.6} />
          </span>
          <h2>
            PLEXA may assist across the journey. It does not own the decision.
          </h2>
          <p>
            This exploratory assistant direction could organize approved
            context, prepare conversations, surface open questions, and
            structure follow-up. Providers, scope, review controls, and rollout
            remain uncommitted.
          </p>
          <div className={styles.plexaTasks}>
            <span>Prepare</span>
            <span>Orient</span>
            <span>Prompt</span>
            <span>Structure</span>
          </div>
        </div>
      </section>

      <section className={styles.cta}>
        <HugeiconsIcon icon={Building03Icon} size={30} strokeWidth={1.5} />
        <h2>See how the governed journey fits your program.</h2>
        <p>
          Request a pre-launch walkthrough focused on your tenant, participants,
          operating model, and provider requirements.
        </p>
        <Link
          className={styles.lightAction}
          href={withLocale("/contact", locale)}
        >
          Request a walkthrough
          <HugeiconsIcon
            icon={ArrowUpRight01Icon}
            size={18}
            strokeWidth={1.8}
          />
        </Link>
      </section>

      <footer className={styles.footer}>
        <PlexusBrand compact />
        <Link href={withLocale("/", locale)}>Return to the Plexus website</Link>
        <span>© 2026 PLEXUS</span>
      </footer>

      {requestedLocale !== locale ? (
        <span className="sr-only">
          This product preview is currently available in English only.
        </span>
      ) : null}
    </main>
  )
}
