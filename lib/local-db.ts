export type CompanyRole = "delegation" | "partner"

export type MatchStatus =
  | "Proposed"
  | "Accepted"
  | "Rejected"
  | "Session Scheduled"
export type MeetingStatus = "Scheduled" | "Live" | "Completed" | "Cancelled"
export type SigningStatus =
  | "Under Discussion"
  | "Agreement Reached"
  | "Signed"
  | "Failed"
export type AttendanceStatus = "Invited" | "Confirmed" | "Declined" | "Arrived"
export type AnnouncementTarget = "all" | "delegation" | "partner" | "admin"
export type AnnouncementChannel = "email" | "notification" | "both"
export type ResourceAudience = "all" | "delegation" | "partner" | "admin"
export type ResourceCategory =
  | "Agenda"
  | "Map"
  | "Briefing"
  | "Logistics"
  | "Other"

export type CompanyRegistrationProfile = {
  companyNameEn: string
  companyNameCn: string
  countryRegion: string
  countryOther: string
  yearEstablished: string
  registrationNumber: string
  website: string
  address: string
  employeeRange: string
  annualRevenueRange: string
  contactName: string
  contactPosition: string
  contactEmail: string
  mobileNumber: string
  chatId: string
  preferredLanguages: string[]
  industries: string[]
  industryOther: string
  introduction: string
  productsServices: string
  certifications: string[]
  certificationOther: string
  offers: string[]
  offerOther: string
  lookingFor: string[]
  lookingForOther: string
  preferredPartnerTypes: string[]
  preferredPartnerOther: string
  expectedOutcomes: string[]
  idealPartner: string
  opportunity: string
  exportsInternationally: string
  exportMarkets: string
  meetingFormat: string
  availableMeetingDates: string
  maxMeetings: string
  supportingDocuments: string[]
  consent: boolean
  consentName: string
  consentDate: string
}

export type DelegationCompany = {
  id: string
  role: "delegation"
  nameEn: string
  nameCn: string
  sector: string
  origin: string
  size: string
  needs: string
  contact: string
  contactMeta: string
  status: "Onboarded" | "Invited" | "Incomplete" | "Locked"
  profileComplete: number
  urgent: boolean
  coordinator: string
  profileData?: CompanyRegistrationProfile
}

export type PartnerCompany = {
  id: string
  role: "partner"
  nameEn: string
  nameCn: string
  sector: string
  type: "Government" | "Association" | "Enterprise"
  size: string
  offerings: string
  contact: string
  contactMeta: string
  status: "Sourced" | "Invited" | "Confirmed" | "Declined"
  profileComplete: number
  verified: "Verified" | "Pending" | "Flagged"
  attendance: AttendanceStatus
  arrived: boolean
  profileData?: CompanyRegistrationProfile
}

export type Match = {
  id: string
  delegationId: string
  partnerId: string
  status: MatchStatus
  score: number
  note: string
  delegationAcceptedAt: string | null
  partnerAcceptedAt: string | null
}

export type MatchCompanySummary = {
  id: string
  nameEn: string
  nameCn: string
  sector: string
}

export type Interpreter = {
  id: string
  name: string
  languages: string
  email: string
  notes: string
  available: boolean
}

export type Meeting = {
  id: string
  matchId: string
  startsAt: string
  duration: number
  platform: "Pending" | "Zoom" | "Lark" | "VooV"
  link: string
  interpreter: string
  requestedInterpreterId: string | null
  host: string
  status: MeetingStatus
  summary: string
}

export type MeetingProposal = {
  id: string
  matchId: string
  startsAt: string
  duration: number
  requestedInterpreterId: string | null
  requestedByVendorType: CompanyRole | null
  requestedByVendorCompanyId: string | null
  delegationApprovedAt: string | null
  partnerApprovedAt: string | null
  status: "pending" | "approved" | "cancelled"
  meetingId: string | null
}

export type Deal = {
  id: string
  matchId: string
  status: SigningStatus
  document: string
  documentId: string | null
  documentFileSize: number | null
  documentUploadedAt: string | null
  signatoryCheck: "Verified" | "Pending" | "Flagged"
  delegationSignedAt: string | null
  delegationSignedBy: string | null
  partnerSignedAt: string | null
  partnerSignedBy: string | null
}

export type ItinerarySlot = {
  id: string
  day: string
  time: string
  activity: string
  venue: string
  escort: string
  published: boolean
}

export type SiteVisit = {
  id: string
  venue: string
  date: string
  time: string
  delegationIds: string[]
  driver: string
  escort: string
  status: "Planned" | "Confirmed" | "Completed"
  notes: string
}

export type LiaisonContact = {
  id: string
  name: string
  title: string
  organisation: string
  status: "Draft" | "Confirmed" | "Briefed"
  protocol: string
}

export type Announcement = {
  id: string
  title: string
  message: string
  target: AnnouncementTarget
  channel: AnnouncementChannel
  status: "Draft" | "Queued" | "Sent"
  sentAt: string | null
  createdBy: string
}

export type EventResource = {
  id: string
  title: string
  category: ResourceCategory
  fileName: string
  fileUrl: string
  storagePath?: string | null
  audience: ResourceAudience
  visibleToDelegation: boolean
  notes: string
  updatedAt: string
}

export type LocalDb = {
  delegationCompanies: DelegationCompany[]
  partnerCompanies: PartnerCompany[]
  matchCompanies: MatchCompanySummary[]
  matches: Match[]
  interpreters: Interpreter[]
  meetingProposals: MeetingProposal[]
  meetings: Meeting[]
  deals: Deal[]
  itinerary: ItinerarySlot[]
  siteVisits: SiteVisit[]
  liaison: LiaisonContact[]
  notifications: string[]
  announcements: Announcement[]
  resources: EventResource[]
}

export const LOCAL_DB_KEY = "malayconnect-localdb-v1"

export const seedDb: LocalDb = {
  delegationCompanies: [
    {
      id: "del-1",
      role: "delegation",
      nameEn: "Hengqin Smart Mobility Group",
      nameCn: "横琴智慧出行集团",
      sector: "Smart Mobility",
      origin: "Hengqin",
      size: "120 employees",
      needs:
        "Seeking Malaysian EV charging operators, fleet partners and local assembly routes.",
      contact: "Li Wen",
      contactMeta: "CEO · liwen@example.cn · WeChat liwen-hq",
      status: "Onboarded",
      profileComplete: 92,
      urgent: false,
      coordinator: "Sarah Lim",
    },
    {
      id: "del-2",
      role: "delegation",
      nameEn: "Macao HealthTech Alliance",
      nameCn: "澳门健康科技联盟",
      sector: "HealthTech",
      origin: "Macao",
      size: "Association",
      needs:
        "Looking for hospital pilots, wellness distributors and regulatory briefing support.",
      contact: "Chan Mei",
      contactMeta:
        "Programme Lead · chanmei@example.mo · WhatsApp +853 6000 1000",
      status: "Invited",
      profileComplete: 68,
      urgent: true,
      coordinator: "Amir Rahman",
    },
    {
      id: "del-3",
      role: "delegation",
      nameEn: "Guangdong AgriCloud Co.",
      nameCn: "广东农云科技有限公司",
      sector: "AgriTech",
      origin: "Guangdong",
      size: "260 employees",
      needs:
        "Needs plantation groups and agri associations for traceability and IoT deployment.",
      contact: "Zhao Jun",
      contactMeta: "BD Director · zhao@example.cn · WeChat agri-zhao",
      status: "Locked",
      profileComplete: 100,
      urgent: false,
      coordinator: "Sarah Lim",
    },
  ],
  partnerCompanies: [
    {
      id: "par-1",
      role: "partner",
      nameEn: "Selangor EV Infrastructure Sdn Bhd",
      nameCn: "雪兰莪电动车基础设施有限公司",
      sector: "Smart Mobility",
      type: "Enterprise",
      size: "85 employees",
      offerings:
        "Charging operations, municipal EV rollout and maintenance teams.",
      contact: "Nur Aisyah",
      contactMeta: "Partnerships · aisyah@example.my · +60 12 200 2000",
      status: "Confirmed",
      profileComplete: 96,
      verified: "Verified",
      attendance: "Confirmed",
      arrived: false,
    },
    {
      id: "par-2",
      role: "partner",
      nameEn: "Malaysia Digital Health Association",
      nameCn: "马来西亚数字健康协会",
      sector: "HealthTech",
      type: "Association",
      size: "140 members",
      offerings:
        "Hospital network introductions, regulatory roundtables and pilot matching.",
      contact: "Dr. Kavitha Menon",
      contactMeta: "Secretary · kavitha@example.my · +60 13 300 3000",
      status: "Invited",
      profileComplete: 78,
      verified: "Pending",
      attendance: "Invited",
      arrived: false,
    },
    {
      id: "par-3",
      role: "partner",
      nameEn: "Penang Precision Manufacturing Council",
      nameCn: "槟城精密制造理事会",
      sector: "Advanced Manufacturing",
      type: "Association",
      size: "72 members",
      offerings:
        "Factory visits, contract manufacturing references and engineering suppliers.",
      contact: "Jason Teoh",
      contactMeta: "Council Manager · jason@example.my · +60 16 400 4000",
      status: "Sourced",
      profileComplete: 64,
      verified: "Pending",
      attendance: "Invited",
      arrived: false,
    },
    {
      id: "par-4",
      role: "partner",
      nameEn: "Johor Agro Innovation Hub",
      nameCn: "柔佛农业创新中心",
      sector: "AgriTech",
      type: "Government",
      size: "State-backed hub",
      offerings:
        "Pilot farms, grants facilitation and agri exporter introductions.",
      contact: "Farid Ismail",
      contactMeta: "Director · farid@example.my · +60 17 500 5000",
      status: "Confirmed",
      profileComplete: 88,
      verified: "Verified",
      attendance: "Confirmed",
      arrived: true,
    },
  ],
  matchCompanies: [],
  matches: [
    {
      id: "mat-1",
      delegationId: "del-1",
      partnerId: "par-1",
      status: "Session Scheduled",
      score: 94,
      note: "Strong sector fit and Malaysia rollout experience.",
      delegationAcceptedAt: "2026-07-01T09:00:00+08:00",
      partnerAcceptedAt: "2026-07-01T10:00:00+08:00",
    },
    {
      id: "mat-2",
      delegationId: "del-1",
      partnerId: "par-3",
      status: "Proposed",
      score: 72,
      note: "Useful for assembly and maintenance partner discovery.",
      delegationAcceptedAt: null,
      partnerAcceptedAt: null,
    },
    {
      id: "mat-3",
      delegationId: "del-2",
      partnerId: "par-2",
      status: "Accepted",
      score: 91,
      note: "Association can coordinate hospital pilot conversations.",
      delegationAcceptedAt: "2026-07-02T09:00:00+08:00",
      partnerAcceptedAt: "2026-07-02T11:00:00+08:00",
    },
    {
      id: "mat-4",
      delegationId: "del-3",
      partnerId: "par-4",
      status: "Session Scheduled",
      score: 96,
      note: "Pilot farms and government liaison are aligned.",
      delegationAcceptedAt: "2026-07-03T09:00:00+08:00",
      partnerAcceptedAt: "2026-07-03T10:30:00+08:00",
    },
  ],
  interpreters: [
    {
      id: "int-1",
      name: "Grace Wong",
      languages: "EN ⇄ ZH",
      email: "grace.wong@plexusconnect.example",
      notes:
        "Senior conference interpreter. Strong on smart-mobility and EV terminology.",
      available: true,
    },
    {
      id: "int-2",
      name: "Lee Wei",
      languages: "ZH ⇄ EN",
      email: "lee.wei@plexusconnect.example",
      notes: "Specialises in agri-tech and manufacturing site visits.",
      available: true,
    },
    {
      id: "int-3",
      name: "Nurul Aisyah",
      languages: "EN ⇄ MS ⇄ ZH",
      email: "nurul.aisyah@plexusconnect.example",
      notes:
        "Trilingual; available for Malaysia-side government liaison sessions.",
      available: true,
    },
    {
      id: "int-4",
      name: "Daniel Tan",
      languages: "ZH ⇄ EN",
      email: "daniel.tan@plexusconnect.example",
      notes: "Reserve interpreter. Currently unavailable until further notice.",
      available: false,
    },
  ],
  meetingProposals: [],
  meetings: [
    {
      id: "ses-1",
      matchId: "mat-1",
      startsAt: "2026-07-08T10:00:00+08:00",
      duration: 45,
      platform: "VooV",
      link: "/m/local-demo-session-0000000000000001",
      interpreter: "Grace Wong · EN-ZH",
      requestedInterpreterId: "int-1",
      host: "Sarah Lim",
      status: "Scheduled",
      summary:
        "Prep focus: regulatory approvals, pilot geography and charger uptime.",
    },
    {
      id: "ses-2",
      matchId: "mat-4",
      startsAt: "2026-07-09T14:30:00+08:00",
      duration: 60,
      platform: "Zoom",
      link: "/m/local-demo-session-0000000000000002",
      interpreter: "Lee Wei · ZH-EN",
      requestedInterpreterId: "int-2",
      host: "Amir Rahman",
      status: "Completed",
      summary: "Both sides want a September site visit and technical workshop.",
    },
  ],
  deals: [
    {
      id: "deal-1",
      matchId: "mat-4",
      status: "Agreement Reached",
      document: "AgriCloud-JohorHub-MOU-draft.pdf",
      documentId: null,
      documentFileSize: null,
      documentUploadedAt: null,
      signatoryCheck: "Verified",
      delegationSignedAt: "2026-07-09T15:45:00+08:00",
      delegationSignedBy: null,
      partnerSignedAt: "2026-07-09T15:50:00+08:00",
      partnerSignedBy: null,
    },
    {
      id: "deal-2",
      matchId: "mat-1",
      status: "Under Discussion",
      document: "Pending upload",
      documentId: null,
      documentFileSize: null,
      documentUploadedAt: null,
      signatoryCheck: "Pending",
      delegationSignedAt: null,
      delegationSignedBy: null,
      partnerSignedAt: null,
      partnerSignedBy: null,
    },
  ],
  itinerary: [
    {
      id: "iti-1",
      day: "Day 1 · 8 Sep",
      time: "09:00",
      activity: "Delegation arrival and welcome briefing",
      venue: "KLIA + EQ Kuala Lumpur",
      escort: "Sarah Lim",
      published: true,
    },
    {
      id: "iti-2",
      day: "Day 2 · 9 Sep",
      time: "10:30",
      activity: "Face-to-face business matching roundtables",
      venue: "MATRADE Hall B",
      escort: "Amir Rahman",
      published: true,
    },
    {
      id: "iti-3",
      day: "Day 3 · 10 Sep",
      time: "14:00",
      activity: "Company site visits and official liaison calls",
      venue: "Selangor + Putrajaya",
      escort: "Melissa Tan",
      published: false,
    },
  ],
  siteVisits: [
    {
      id: "visit-1",
      venue: "Selangor EV Operations Centre",
      date: "2026-09-10",
      time: "10:00",
      delegationIds: ["del-1"],
      driver: "Driver A",
      escort: "Sarah Lim",
      status: "Confirmed",
      notes: "Bring technical specs and pilot district maps.",
    },
    {
      id: "visit-2",
      venue: "Johor Agro Innovation Hub",
      date: "2026-09-11",
      time: "09:30",
      delegationIds: ["del-3"],
      driver: "Driver B",
      escort: "Melissa Tan",
      status: "Planned",
      notes: "Coordinate farm boots and translation briefing.",
    },
  ],
  liaison: [
    {
      id: "lia-1",
      name: "Dato' Seri Ahmad Rahim",
      title: "Senior Director",
      organisation: "MATRADE",
      status: "Confirmed",
      protocol:
        "Use formal title in opening remarks; share delegation one-pager 48h prior.",
    },
    {
      id: "lia-2",
      name: "Tan Mei Ling",
      title: "Investment Desk Lead",
      organisation: "MIDA",
      status: "Draft",
      protocol: "Brief on sectors: EV infrastructure, HealthTech, AgriTech.",
    },
  ],
  notifications: [
    "2 delegation companies have fewer than 2 confirmed matches.",
    "Zoom and Lark links are protected until the confirmed meeting window.",
    "September check-in QR codes are ready for confirmed partners.",
  ],
  announcements: [
    {
      id: "00000000-0000-4000-8000-000000000101",
      title: "Pre-visit briefing reminder",
      message:
        "Delegation and Malaysian partner teams should confirm profile readiness before the first matching call.",
      target: "all",
      channel: "both",
      status: "Queued",
      sentAt: null,
      createdBy: "Admin team",
    },
  ],
  resources: [
    {
      id: "00000000-0000-4000-8000-000000000201",
      title: "Delegation briefing pack",
      category: "Briefing",
      fileName: "delegation-briefing-pack.pdf",
      fileUrl: "/documents/AgriCloud-JohorHub-MOU-draft.pdf",
      audience: "delegation",
      visibleToDelegation: true,
      notes: "Replace with final bilingual event briefing PDF before launch.",
      updatedAt: "2026-06-25T00:00:00+08:00",
    },
    {
      id: "00000000-0000-4000-8000-000000000202",
      title: "Venue map and transport guide",
      category: "Map",
      fileName: "venue-map-transport.pdf",
      fileUrl: "/documents/AgriCloud-JohorHub-MOU-draft.pdf",
      audience: "all",
      visibleToDelegation: true,
      notes: "Visible to all confirmed participants.",
      updatedAt: "2026-06-25T00:00:00+08:00",
    },
  ],
}

export function getCompanyName(db: LocalDb, id: string) {
  return (
    db.delegationCompanies.find((company) => company.id === id)?.nameEn ??
    db.partnerCompanies.find((company) => company.id === id)?.nameEn ??
    db.matchCompanies.find((company) => company.id === id)?.nameEn ??
    "Unknown company"
  )
}

export function getCompanySector(db: LocalDb, id: string) {
  return (
    db.delegationCompanies.find((company) => company.id === id)?.sector ??
    db.partnerCompanies.find((company) => company.id === id)?.sector ??
    db.matchCompanies.find((company) => company.id === id)?.sector ??
    ""
  )
}
