"use client"

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useTransition,
  type FormEvent,
  type ReactNode,
} from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import type { CountryCode } from "libphonenumber-js"
import {
  AddIcon,
  Alert02Icon,
  AnalyticsUpIcon,
  ArrowDown01Icon,
  Building01Icon,
  Calendar03Icon,
  CameraVideoIcon,
  CheckmarkCircle02Icon,
  Copy01Icon,
  Delete02Icon,
  Download01Icon,
  File01Icon,
  Loading03Icon,
  Logout01Icon,
  Menu01Icon,
  PaintBoardIcon,
  QrCodeIcon,
  SaveIcon,
  SecurityCheckIcon,
  ShieldUserIcon,
  TranslationIcon,
  Upload01Icon,
  UserAccountIcon,
  UserGroupIcon,
  ViewIcon,
} from "@hugeicons/core-free-icons"
import { toast } from "sonner"

import { logoutAction, updateOwnProfileAction } from "@/app/actions/auth"
import {
  addMatchAction,
  assignMeetingInterpreterAction,
  checkInPartnerAction,
  completeMeetingAction,
  confirmAttendanceAction,
  createCompanyAction,
  createDealAction,
  createInterpreterAction,
  createManualMeetingAction,
  createProviderMeetingAction,
  createResourceAction,
  deleteCompanyAction,
  deleteInterpreterAction,
  publishItineraryAction,
  refreshPortalDbAction,
  scheduleMeetingAction,
  sendAnnouncementAction,
  toggleResourceVisibilityAction,
  updateCompanyAction,
  updateCompanyProfileAction,
  updateDealAction,
  updateInterpreterAction,
  updateMeetingAction,
  updateMatchStatusAction,
} from "@/app/actions/plexus"
import { downloadCsv, downloadIcs } from "@/lib/export"
import {
  isChineseLocale,
  localeLabels,
  protectedPortalLocales,
  type Locale,
} from "@/lib/i18n"
import {
  getCompanyProfileCompletion,
  getCompanyProfileSectionCompletion,
  getMalaysiaToday,
  validateCompanyRegistrationProfile,
} from "@/lib/company-profile"
import {
  IndustrySectorCombobox,
  IndustrySectorMultiCombobox,
} from "@/components/industry-sector-combobox"
import {
  composeInternationalPhoneNumber,
  countryCallingCodeOptions,
  getCountryCodeForRegion,
  splitInternationalPhoneNumber,
} from "@/lib/international-phone"
import { supportedMarketNames } from "@/lib/markets"
import {
  type Announcement,
  type AnnouncementChannel,
  type AnnouncementTarget,
  type CompanyRegistrationProfile,
  getCompanyName,
  getCompanySector,
  type Deal,
  type DelegationCompany,
  type EventResource,
  type Interpreter,
  type LocalDb,
  type Match,
  type MatchStatus,
  type Meeting,
  type PartnerCompany,
  type ResourceAudience,
  type ResourceCategory,
} from "@/lib/local-db"
import {
  type MeetingProviderReadiness,
  type MeetingProviderState,
  unavailableMeetingProviderReadiness,
} from "@/lib/meeting-provider-readiness"
import {
  extractMeetingAgenda,
  type ManualMeetingInput,
  type MeetingAmendmentInput,
} from "@/lib/manual-meeting"
import { scoreMatch } from "@/lib/matching"
import type { PortalSession } from "@/lib/plexus-data"
import { createSupabaseBrowserClient } from "@/lib/supabase/browser"
import { cn } from "@/lib/utils"
import {
  getVendorDashboardMetrics,
  getVendorRealtimeTargets,
} from "@/lib/vendor-dashboard"
import type { VendorProfileDocument } from "@/lib/vendor-profile-documents"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { TenantProfileForm } from "@/components/tenant-profile-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { Checkbox } from "@/components/ui/checkbox"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

type PortalRole = "admin" | "delegation" | "partner"
type CompanyKind = "delegation" | "partner"
type ManagedCompany = DelegationCompany | PartnerCompany
type NavItem = {
  value: string
  label: string
  icon: typeof AnalyticsUpIcon
  children?: Array<{
    value: string
    label: string
    icon: typeof AnalyticsUpIcon
  }>
}
type ExternalNavItem = {
  href: string
  label: string
  icon: typeof AnalyticsUpIcon
}
type LocalizedLabels = Partial<Record<Locale, string>> & { en: string }
type PortalCopy = Record<PortalRole, Record<string, string>>
type UiCopy = Record<string, string>

type ResourceUploadRow = {
  id: string
  title: string
  category: ResourceCategory
  file_name: string
  file_url: string
  storage_path: string | null
  audience: ResourceAudience
  visible_to_delegation: boolean
  notes: string
  updated_at: string
}

const portalCopy: Partial<Record<Locale, PortalCopy>> & { en: PortalCopy } = {
  en: {
    admin: {
      eyebrow: "AGA organiser control room",
      title: "Admin operations dashboard",
      subtitle:
        "Manage matching, sessions, signing, on-site check-in, itinerary, liaison and reports from one Supabase-backed workspace.",
      primary: "Schedule session",
    },
    delegation: {
      eyebrow: "Chinese / Macao company portal",
      title: "Delegation company workspace",
      subtitle:
        "Review bilingual profile readiness, accept Malaysian matches, join meetings, track MOU status and view the Malaysia itinerary.",
      primary: "Update profile",
    },
    partner: {
      eyebrow: "Malaysian partner portal",
      title: "Partner enterprise workspace",
      subtitle:
        "Confirm matches, manage meeting preparation, track MOU documents and generate your event attendance QR check-in status.",
      primary: "Confirm attendance",
    },
  },
  zh: {
    admin: {
      eyebrow: "AGA 主办方控制台",
      title: "管理员运营仪表板",
      subtitle:
        "在同一个本地优先工作台管理配对、会议、签约、现场签到、行程、官方联络与报告。",
      primary: "安排会议",
    },
    delegation: {
      eyebrow: "中国 / 澳门企业门户",
      title: "代表团企业工作台",
      subtitle:
        "查看双语资料完整度，确认马来西亚配对伙伴，加入会议，追踪 MOU 状态并查看马来西亚行程。",
      primary: "更新资料",
    },
    partner: {
      eyebrow: "马来西亚伙伴门户",
      title: "马方企业工作台",
      subtitle: "确认配对、管理会议准备、追踪 MOU 文件，并生成现场出席二维码。",
      primary: "确认出席",
    },
  },
  "zh-Hant": {
    admin: {
      eyebrow: "AGA 主辦方控制台",
      title: "管理員營運儀表板",
      subtitle:
        "在同一個本地優先工作台管理配對、會議、簽約、現場簽到、行程、官方聯絡與報告。",
      primary: "安排會議",
    },
    delegation: {
      eyebrow: "中國 / 澳門企業門戶",
      title: "代表團企業工作台",
      subtitle:
        "查看雙語資料完整度，確認馬來西亞配對夥伴，加入會議，追蹤 MOU 狀態並查看馬來西亞行程。",
      primary: "更新資料",
    },
    partner: {
      eyebrow: "馬來西亞夥伴門戶",
      title: "馬方企業工作台",
      subtitle: "確認配對、管理會議準備、追蹤 MOU 文件，並生成現場出席二維碼。",
      primary: "確認出席",
    },
  },
  th: {
    admin: {
      eyebrow: "ห้องควบคุมผู้จัดงาน AGA",
      title: "แดชบอร์ดปฏิบัติการผู้ดูแล",
      subtitle:
        "จัดการการจับคู่ การประชุม การลงนาม เช็กอินหน้างาน กำหนดการ ผู้ประสานงาน และรายงานจากพื้นที่ทำงานเดียว",
      primary: "จัดตารางประชุม",
    },
    delegation: {
      eyebrow: "พอร์ทัลบริษัทจีน / มาเก๊า",
      title: "พื้นที่ทำงานบริษัทคณะผู้แทน",
      subtitle:
        "ตรวจสอบความพร้อมของโปรไฟล์สองภาษา ยืนยันคู่จับคู่มาเลเซีย เข้าประชุม ติดตามสถานะ MOU และดูแผนการเดินทางในมาเลเซีย",
      primary: "อัปเดตโปรไฟล์",
    },
    partner: {
      eyebrow: "พอร์ทัลพันธมิตรมาเลเซีย",
      title: "พื้นที่ทำงานองค์กรพันธมิตร",
      subtitle:
        "ยืนยันการจับคู่ จัดการการเตรียมประชุม ติดตามเอกสาร MOU และสร้างสถานะ QR สำหรับเข้าร่วมงาน",
      primary: "ยืนยันเข้าร่วม",
    },
  },
}

const roleLinks: Array<{ label: LocalizedLabels; role: PortalRole }> = [
  {
    label: { en: "Admin", zh: "管理员", "zh-Hant": "管理員", th: "ผู้ดูแล" },
    role: "admin",
  },
  {
    label: {
      en: "Delegation",
      zh: "代表团",
      "zh-Hant": "代表團",
      th: "คณะผู้แทน",
    },
    role: "delegation",
  },
  {
    label: {
      en: "Partner",
      zh: "马方伙伴",
      "zh-Hant": "馬方夥伴",
      th: "พันธมิตรมาเลเซีย",
    },
    role: "partner",
  },
]

const uiCopy: Partial<Record<Locale, UiCopy>> & { en: UiCopy } = {
  en: {
    workspaceSubtitle: "Portal workspace",
    menu: "Menu",
    navigation: "Navigation",
    dashboard: "Dashboard",
    companies: "Companies",
    delegation: "Delegation",
    malaysianPartners: "Malaysian partners",
    matching: "Matching",
    meetings: "Meetings",
    interpreters: "Interpreters",
    signing: "Signing",
    onsite: "On-site",
    reports: "Reports",
    communications: "Communications",
    resources: "Documents & Resources",
    vendorAccounts: "Vendor accounts",
    compliance: "Compliance",
    companyProfile: "Company Profile",
    partnerProfile: "Partner Profile",
    myMatches: "My Matches",
    myMeetings: "My Meetings",
    production: "Supabase production",
    saving: "Saving...",
    delegationCompanies: "Delegation companies",
    delegationTarget: "35 target",
    partnersSourced: "MY partners sourced",
    partnerTarget: "70+ target",
    sessionsScheduled: "Sessions scheduled",
    completed: "completed",
    signingConversion: "Signing conversion",
    conversionTarget: "30% target",
    operationalAlerts: "Operational alerts",
    persistedNotice:
      "Data is persisted in Supabase with Auth and RLS enabled for launch mode.",
    account: "account",
    userProfile: "User profile",
    userProfileDescription:
      "Manage your profile, workspace identity, branding, and secure access.",
    profileSection: "Profile",
    brandingSection: "White label",
    accessSection: "Access",
    personalDetails: "Personal details",
    personalDetailsDescription:
      "Update the name shown to your workspace team. Your login email is managed separately.",
    displayName: "Display name",
    loginEmail: "Login email",
    saveProfile: "Save profile",
    workspaceIdentity: "Workspace identity",
    accessAndSecurity: "Access & security",
    accessAndSecurityDescription:
      "Review your role, language, password recovery, and current session.",
    launchRole: "Launch role",
    locale: "Locale",
    userId: "User ID",
    language: "Language",
    portalAccess: "Portal access",
    logout: "Logout",
    openRolePage: "Open {role} page",
  },
  zh: {
    workspaceSubtitle: "门户工作台",
    menu: "菜单",
    navigation: "导航",
    dashboard: "仪表板",
    companies: "企业",
    delegation: "代表团",
    malaysianPartners: "马来西亚伙伴",
    matching: "配对",
    meetings: "会议",
    interpreters: "翻译",
    signing: "签约",
    onsite: "现场",
    reports: "报告",
    communications: "通讯",
    resources: "文件与资源",
    vendorAccounts: "供应商账号",
    compliance: "合规",
    companyProfile: "企业资料",
    partnerProfile: "伙伴资料",
    myMatches: "我的配对",
    myMeetings: "我的会议",
    production: "Supabase 生产环境",
    saving: "保存中...",
    delegationCompanies: "代表团企业",
    delegationTarget: "35 目标",
    partnersSourced: "马方伙伴来源",
    partnerTarget: "70+ 目标",
    sessionsScheduled: "已安排会议",
    completed: "已完成",
    signingConversion: "签约转化",
    conversionTarget: "30% 目标",
    operationalAlerts: "运营提醒",
    persistedNotice: "数据已存入 Supabase，并为上线模式启用 Auth 与 RLS。",
    account: "账号",
    userProfile: "用户资料",
    userProfileDescription: "账号、门户访问与会话控制。",
    launchRole: "上线角色",
    locale: "语言",
    userId: "用户 ID",
    language: "语言",
    portalAccess: "门户访问",
    logout: "退出",
    openRolePage: "打开{role}页面",
  },
  "zh-Hant": {
    workspaceSubtitle: "門戶工作台",
    menu: "選單",
    navigation: "導覽",
    dashboard: "儀表板",
    companies: "企業",
    delegation: "代表團",
    malaysianPartners: "馬來西亞夥伴",
    matching: "配對",
    meetings: "會議",
    interpreters: "翻譯",
    signing: "簽約",
    onsite: "現場",
    reports: "報告",
    communications: "通訊",
    resources: "文件與資源",
    vendorAccounts: "供應商帳號",
    compliance: "合規",
    companyProfile: "企業資料",
    partnerProfile: "夥伴資料",
    myMatches: "我的配對",
    myMeetings: "我的會議",
    production: "Supabase 生產環境",
    saving: "儲存中...",
    delegationCompanies: "代表團企業",
    delegationTarget: "35 目標",
    partnersSourced: "馬方夥伴來源",
    partnerTarget: "70+ 目標",
    sessionsScheduled: "已安排會議",
    completed: "已完成",
    signingConversion: "簽約轉化",
    conversionTarget: "30% 目標",
    operationalAlerts: "營運提醒",
    persistedNotice: "資料已存入 Supabase，並為上線模式啟用 Auth 與 RLS。",
    account: "帳號",
    userProfile: "使用者資料",
    userProfileDescription: "帳號、門戶存取與工作階段控制。",
    launchRole: "上線角色",
    locale: "語言",
    userId: "使用者 ID",
    language: "語言",
    portalAccess: "門戶存取",
    logout: "登出",
    openRolePage: "開啟{role}頁面",
  },
  th: {
    workspaceSubtitle: "พื้นที่ทำงานพอร์ทัล",
    menu: "เมนู",
    navigation: "การนำทาง",
    dashboard: "แดชบอร์ด",
    companies: "บริษัท",
    delegation: "คณะผู้แทน",
    malaysianPartners: "พันธมิตรมาเลเซีย",
    matching: "จับคู่",
    meetings: "ประชุม",
    interpreters: "ล่าม",
    signing: "ลงนาม",
    onsite: "หน้างาน",
    reports: "รายงาน",
    communications: "สื่อสาร",
    resources: "เอกสารและทรัพยากร",
    vendorAccounts: "บัญชีผู้ขาย",
    compliance: "การปฏิบัติตามข้อกำหนด",
    companyProfile: "โปรไฟล์บริษัท",
    partnerProfile: "โปรไฟล์พันธมิตร",
    myMatches: "คู่ของฉัน",
    myMeetings: "ประชุมของฉัน",
    production: "Supabase production",
    saving: "กำลังบันทึก...",
    delegationCompanies: "บริษัทคณะผู้แทน",
    delegationTarget: "เป้าหมาย 35",
    partnersSourced: "พันธมิตร MY ที่หาได้",
    partnerTarget: "เป้าหมาย 70+",
    sessionsScheduled: "ประชุมที่จัดแล้ว",
    completed: "เสร็จสิ้น",
    signingConversion: "อัตราลงนาม",
    conversionTarget: "เป้าหมาย 30%",
    operationalAlerts: "แจ้งเตือนปฏิบัติการ",
    persistedNotice:
      "ข้อมูลถูกบันทึกใน Supabase พร้อม Auth และ RLS สำหรับโหมดเปิดตัว",
    account: "บัญชี",
    userProfile: "โปรไฟล์ผู้ใช้",
    userProfileDescription: "บัญชี การเข้าถึงพอร์ทัล และการควบคุมเซสชัน",
    launchRole: "บทบาทเปิดตัว",
    locale: "ภาษา",
    userId: "User ID",
    language: "ภาษา",
    portalAccess: "การเข้าถึงพอร์ทัล",
    logout: "ออกจากระบบ",
    openRolePage: "เปิดหน้า{role}",
  },
}

function getUiCopy(locale: Locale): UiCopy {
  return {
    ...uiCopy.en,
    ...(uiCopy[locale] ?? {}),
  }
}

function getPortalCopy(locale: Locale, role: PortalRole) {
  return {
    ...portalCopy.en[role],
    ...(portalCopy[locale]?.[role] ?? {}),
  }
}

function localizedLabel(labels: LocalizedLabels, locale: Locale) {
  return labels[locale] ?? labels.en
}

const thaiText: Record<string, string> = {
  "Live operating picture": "ภาพรวมการดำเนินงานสด",
  "Pre-visit progress, alerts and today's session queue.":
    "ความคืบหน้าก่อนเยี่ยม แจ้งเตือน และคิวประชุมวันนี้",
  "Fully matched": "จับคู่ครบแล้ว",
  "Arrived guests": "แขกที่มาถึงแล้ว",
  "Signed MOUs": "MOU ที่ลงนามแล้ว",
  "Add Company": "เพิ่มบริษัท",
  "Export Report": "ส่งออกรายงาน",
  "Phase timeline": "ไทม์ไลน์แต่ละช่วง",
  "June to September delivery checkpoints.":
    "จุดตรวจงานส่งมอบตั้งแต่มิถุนายนถึงกันยายน",
  "Pre-visit": "ก่อนเยี่ยม",
  "Needs analysis, matching, video sessions":
    "วิเคราะห์ความต้องการ จับคู่ และประชุมวิดีโอ",
  "On-site": "หน้างาน",
  "Check-in, itinerary, liaison, site visits":
    "เช็กอิน กำหนดการ ประสานงาน และเยี่ยมชมสถานที่",
  Reporting: "รายงาน",
  "Pre-visit and post-event exports": "ส่งออกก่อนเยี่ยมและหลังงาน",
  "Delegation companies": "บริษัทคณะผู้แทน",
  "Manage Chinese and Macao delegation profiles, readiness and matching coverage.":
    "จัดการโปรไฟล์ ความพร้อม และความครอบคลุมการจับคู่ของคณะผู้แทนจีนและมาเก๊า",
  "Add Delegation": "เพิ่มคณะผู้แทน",
  "Total delegation": "คณะผู้แทนทั้งหมด",
  "Onboarded / locked": "เริ่มใช้งาน / ล็อกแล้ว",
  "Profile average": "ค่าเฉลี่ยโปรไฟล์",
  "With matches": "มีการจับคู่",
  "Search delegation companies": "ค้นหาบริษัทคณะผู้แทน",
  "Sector, company name, origin or status":
    "อุตสาหกรรม ชื่อบริษัท แหล่งที่มา หรือสถานะ",
  "Delegation company records": "บันทึกบริษัทคณะผู้แทน",
  "Malaysian partners": "พันธมิตรมาเลเซีย",
  "Manage sourced Malaysian partners, verification, attendance and readiness.":
    "จัดการพันธมิตรมาเลเซียที่คัดหาแล้ว การตรวจสอบ การเข้าร่วม และความพร้อม",
  "Add MY Partner": "เพิ่มพันธมิตร MY",
  "Total partners": "พันธมิตรทั้งหมด",
  "Confirmed attendance": "ยืนยันเข้าร่วมแล้ว",
  "Verified partners": "พันธมิตรที่ตรวจสอบแล้ว",
  "Search Malaysian partners": "ค้นหาพันธมิตรมาเลเซีย",
  "Sector, company name, type or status":
    "อุตสาหกรรม ชื่อบริษัท ประเภท หรือสถานะ",
  "Malaysian partner records": "บันทึกพันธมิตรมาเลเซีย",
  "Matching board": "กระดานจับคู่",
  "Assign at least two Malaysian partners per delegation company.":
    "มอบหมายพันธมิตรมาเลเซียอย่างน้อยสองรายต่อบริษัทคณะผู้แทน",
  "Delegation company": "บริษัทคณะผู้แทน",
  fit: "เหมาะสม",
  Assign: "มอบหมาย",
  "Match status": "สถานะการจับคู่",
  "Both parties accept before a session is scheduled.":
    "ทั้งสองฝ่ายต้องยอมรับก่อนจึงจะจัดตารางประชุม",
  Pair: "คู่",
  Score: "คะแนน",
  Status: "สถานะ",
  Action: "การดำเนินการ",
  Accept: "ยอมรับ",
  Schedule: "จัดตาราง",
  "Online meeting scheduler": "ตัวจัดตารางประชุมออนไลน์",
  "Zoom and Lark links are protected by Plexus and created only after both Vendors accept.":
    "ลิงก์ Zoom และ Lark ได้รับการปกป้องโดย Plexus และสร้างขึ้นหลังจากผู้ขายทั้งสองฝ่ายยอมรับแล้วเท่านั้น",
  "Calendar days": "วันในปฏิทิน",
  "Meetings tracked": "ประชุมที่ติดตาม",
  "Agreement reached": "บรรลุข้อตกลง",
  "Booked time": "เวลาที่จอง",
  "Calendar view": "มุมมองปฏิทิน",
  "Track each meeting slot with agreement status, host and interpreter coverage.":
    "ติดตามแต่ละช่วงประชุมพร้อมสถานะข้อตกลง ผู้ดำเนินรายการ และล่าม",
  "Export calendar": "ส่งออกปฏิทิน",
  Host: "ผู้ดำเนินรายการ",
  Interpreter: "ล่าม",
  Agreement: "ข้อตกลง",
  "No deal yet": "ยังไม่มีข้อตกลง",
  "Signing tracker": "ตัวติดตามการลงนาม",
  "Track MOU status, document availability and signatory checks.":
    "ติดตามสถานะ MOU ความพร้อมเอกสาร และการตรวจสอบผู้ลงนาม",
  Deal: "ข้อตกลง",
  Document: "เอกสาร",
  "Signatory check": "ตรวจสอบผู้ลงนาม",
  "Mark signed": "ทำเครื่องหมายว่าลงนามแล้ว",
  Open: "เปิด",
  "Document not uploaded": "ยังไม่ได้อัปโหลดเอกสาร",
  "Preview the MOU PDF without leaving the signing tracker.":
    "ดูตัวอย่าง PDF ของ MOU ได้โดยไม่ต้องออกจากตัวติดตามการลงนาม",
  "This deal is still pending an uploaded MOU document.":
    "ข้อตกลงนี้ยังรออัปโหลดเอกสาร MOU",
  "Pending upload": "รออัปโหลด",
  "Upload the signed or draft MOU PDF before previewing it here.":
    "อัปโหลด MOU PDF ฉบับลงนามหรือฉบับร่างก่อนดูตัวอย่างที่นี่",
  "Open in new tab": "เปิดในแท็บใหม่",
  "Download PDF": "ดาวน์โหลด PDF",
  Communications: "สื่อสาร",
  "Send announcements to all participants or a role group. Email blasts are queued for provider integration; in-app notifications are written immediately.":
    "ส่งประกาศถึงผู้เข้าร่วมทั้งหมดหรือกลุ่มบทบาท อีเมลจะถูกจัดคิวเพื่อเชื่อมต่อผู้ให้บริการ ส่วนการแจ้งเตือนในแอปจะถูกบันทึกทันที",
  "Audience group": "กลุ่มผู้รับ",
  "All participants": "ผู้เข้าร่วมทั้งหมด",
  Delegation: "คณะผู้แทน",
  "Admin team": "ทีมผู้ดูแล",
  "Delivery channel": "ช่องทางส่ง",
  "Email + notification": "อีเมล + แจ้งเตือน",
  "Email blast": "อีเมลกลุ่ม",
  "In-app notification": "แจ้งเตือนในแอป",
  Subject: "หัวข้อ",
  Announcement: "ประกาศ",
  "Queue blast": "จัดคิวส่ง",
  "Mark sent": "ทำเครื่องหมายว่าส่งแล้ว",
  "Announcement log": "บันทึกประกาศ",
  "System-generated invite emails and participant notifications are tracked here.":
    "อีเมลเชิญและการแจ้งเตือนผู้เข้าร่วมที่ระบบสร้างจะถูกติดตามที่นี่",
  "Documents & Resources": "เอกสารและทรัพยากร",
  "Upload event materials such as agendas, maps and briefing documents, then control what is visible to the delegation.":
    "อัปโหลดเอกสารงาน เช่น กำหนดการ แผนที่ และเอกสารบรีฟ แล้วควบคุมสิ่งที่คณะผู้แทนมองเห็น",
  "Material title": "ชื่อเอกสาร",
  Category: "หมวดหมู่",
  "Visible to": "มองเห็นโดย",
  "Admin only": "ผู้ดูแลเท่านั้น",
  "Upload file": "อัปโหลดไฟล์",
  "PDF, briefing decks, Word documents and venue maps up to 15 MB.":
    "รองรับ PDF สไลด์บรีฟ เอกสาร Word และแผนที่สถานที่ สูงสุด 15 MB",
  "File name": "ชื่อไฟล์",
  "File URL": "URL ไฟล์",
  Notes: "หมายเหตุ",
  "Visible to delegation portal": "แสดงในพอร์ทัลคณะผู้แทน",
  "Upload material": "อัปโหลดเอกสาร",
  "Add material": "เพิ่มเอกสาร",
  "Delegation-visible library": "คลังเอกสารที่คณะผู้แทนเห็น",
  "Manage which event materials are available to delegation users.":
    "จัดการว่าเอกสารงานใดพร้อมให้ผู้ใช้คณะผู้แทนดู",
  Visible: "มองเห็น",
  Hidden: "ซ่อน",
  "Guest check-in": "เช็กอินแขก",
  "QR scan and manual check-in simulation for event day.":
    "จำลองการสแกน QR และเช็กอินด้วยตนเองสำหรับวันงาน",
  Arrived: "มาถึงแล้ว",
  Invited: "เชิญแล้ว",
  "Check in": "เช็กอิน",
  "Itinerary manager": "จัดการกำหนดการ",
  "Publish read-only schedule updates to delegation portal.":
    "เผยแพร่การอัปเดตกำหนดการแบบอ่านอย่างเดียวไปยังพอร์ทัลคณะผู้แทน",
  Published: "เผยแพร่แล้ว",
  "Site visits": "เยี่ยมชมสถานที่",
  "Driver, escort and confirmation tracking.":
    "ติดตามคนขับ ผู้ติดตาม และการยืนยัน",
  "Official liaison": "ผู้ประสานงานทางการ",
  "Government contact directory and protocol notes.":
    "รายชื่อผู้ติดต่อภาครัฐและบันทึกพิธีการ",
  "Pre-visit report": "รายงานก่อนเยี่ยม",
  "Match summary, sessions held and signing conversion rate.":
    "สรุปการจับคู่ การประชุมที่จัดแล้ว และอัตราแปลงเป็นการลงนาม",
  "Post-event report": "รายงานหลังงาน",
  "Attendance, face-to-face outcomes and 30 / 60 / 90-day follow-up.":
    "การเข้าร่วม ผลลัพธ์พบปะโดยตรง และการติดตาม 30 / 60 / 90 วัน",
  "Export CSV": "ส่งออก CSV",
  View: "ดู",
  Edit: "แก้ไข",
  Delete: "ลบ",
  Cancel: "ยกเลิก",
  "Confirm delete": "ยืนยันลบ",
  "No sessions scheduled yet.": "ยังไม่มีการประชุมที่จัดไว้",
  Join: "เข้าร่วม",
  Complete: "เสร็จสิ้น",
  Calendar: "ปฏิทิน",
  min: "นาที",
  "Match confidence": "ความมั่นใจในการจับคู่",
  "Request meeting": "ขอประชุม",
  "Meeting requested": "ขอประชุมแล้ว",
  "Request change": "ขอปรับแก้",
  "Choose preferred times": "เลือกเวลาที่ต้องการ",
  "Pick at least 3 future working-day slots. Each slot is 1 hour.":
    "เลือกเวลาในวันทำงานในอนาคตอย่างน้อย 3 ช่วง แต่ละช่วงใช้เวลา 1 ชั่วโมง",
  "Available 1-hour slots": "ช่วงเวลา 1 ชั่วโมงที่ว่าง",
  selected: "เลือกแล้ว",
  "Save time preferences": "บันทึกเวลาที่ต้องการ",
  "Select 3 slots to continue": "เลือก 3 ช่วงเวลาเพื่อดำเนินการต่อ",
  "Working days only": "เฉพาะวันทำงาน",
}

function toTraditional(value: string) {
  const replacements: Array<[string, string]> = [
    ["管理员", "管理員"],
    ["运营", "營運"],
    ["仪表板", "儀表板"],
    ["设置", "設定"],
    ["就绪", "就緒"],
    ["链接", "連結"],
    ["范围", "範圍"],
    ["清单", "清單"],
    ["凭证", "憑證"],
    ["授权", "授權"],
    ["服务器", "伺服器"],
    ["当前", "目前"],
    ["时效", "時效"],
    ["权限", "權限"],
    ["租户", "租戶"],
    ["超级", "超級"],
    ["检查", "檢查"],
    ["系统会", "系統會"],
    ["系统", "系統"],
    ["手动", "手動"],
    ["代表团", "代表團"],
    ["日历", "日曆"],
    ["翻译", "翻譯"],
    ["时区", "時區"],
    ["输入", "輸入"],
    ["议程", "議程"],
    ["产品", "產品"],
    ["介绍", "介紹"],
    ["分销", "分銷"],
    ["后续", "後續"],
    ["步骤", "步驟"],
    ["才会", "才會"],
    ["将", "將"],
    ["并", "並"],
    ["后", "後"],
    ["长", "長"],
    ["会收到", "會收到"],
    ["参与者", "參與者"],
    ["会议时", "會議時"],
    ["与", "與"],
    ["供应商", "供應商"],
    ["创建", "建立"],
    ["保护", "保護"],
    ["在线", "線上"],
    ["配置", "設定"],
    ["验证", "驗證"],
    ["总数", "總數"],
    ["分钟", "分鐘"],
    ["预订", "預訂"],
    ["时长", "時長"],
    ["进行中", "進行中"],
    ["场", "場"],
    ["双方", "雙方"],
    ["自动", "自動"],
    ["显示", "顯示"],
    ["这里", "這裡"],
    ["环境", "環境"],
    ["来源", "來源"],
    ["相关", "相關"],
    ["关联", "關聯"],
    ["详情", "詳情"],
    ["决定", "決定"],
    ["进度", "進度"],
    ["说明", "說明"],
    ["配对", "配對"],
    ["企业", "企業"],
    ["会议", "會議"],
    ["请求", "請求"],
    ["请", "請"],
    ["调整", "調整"],
    ["回应", "回應"],
    ["即将", "即將"],
    ["举行", "舉行"],
    ["补充", "補充"],
    ["选择", "選擇"],
    ["首选", "首選"],
    ["未来", "未來"],
    ["时段", "時段"],
    ["每个", "每個"],
    ["个", "個"],
    ["为", "為"],
    ["小时", "小時"],
    ["仅限", "僅限"],
    ["已选择", "已選擇"],
    ["可选", "可選"],
    ["保存", "儲存"],
    ["时间", "時間"],
    ["偏好", "偏好"],
    ["继续", "繼續"],
    ["签约", "簽約"],
    ["现场", "現場"],
    ["签到", "簽到"],
    ["联络", "聯絡"],
    ["报告", "報告"],
    ["中国", "中國"],
    ["澳门", "澳門"],
    ["门户", "門戶"],
    ["工作台", "工作台"],
    ["资料", "資料"],
    ["完整度", "完整度"],
    ["确认", "確認"],
    ["马来西亚", "馬來西亞"],
    ["伙伴", "夥伴"],
    ["机会", "機會"],
    ["状态", "狀態"],
    ["出席", "出席"],
    ["二维码", "二維碼"],
    ["文件", "文件"],
    ["语言", "語言"],
    ["账号", "帳號"],
    ["用户", "使用者"],
    ["页面", "頁面"],
    ["打开", "開啟"],
    ["退出", "登出"],
    ["简报", "簡報"],
    ["类别", "類別"],
    ["对象", "對象"],
    ["上传", "上傳"],
    ["可见", "可見"],
    ["隐藏", "隱藏"],
    ["记录", "記錄"],
    ["通知", "通知"],
    ["发送", "傳送"],
    ["已安排", "已安排"],
    ["已完成", "已完成"],
    ["已确认", "已確認"],
    ["已邀请", "已邀請"],
    ["已抵达", "已抵達"],
    ["已核验", "已核驗"],
    ["已签署", "已簽署"],
    ["已拒绝", "已拒絕"],
    ["待处理", "待處理"],
    ["洽谈中", "洽談中"],
    ["导出", "匯出"],
    ["删除", "刪除"],
    ["取消", "取消"],
    ["新增", "新增"],
    ["查看", "查看"],
    ["编辑", "編輯"],
  ]

  return replacements.reduce(
    (current, [from, to]) => current.replaceAll(from, to),
    value
  )
}

function textFor(locale: Locale, en: string, zh: string, th?: string) {
  if (locale === "zh") {
    return zh
  }

  if (locale === "zh-Hant") {
    return toTraditional(zh)
  }

  if (locale === "th") {
    return th ?? thaiText[en] ?? thaiText[zh] ?? en
  }

  return en
}

const profileOptionGroups = {
  countryRegion: [...supportedMarketNames, "Macau", "Other"],
  employeeRange: ["1-10", "11-50", "51-200", "201-500", "500+"],
  annualRevenueRange: [
    "Below USD 1M",
    "USD 1M-10M",
    "USD 10M-50M",
    "Above USD 50M",
  ],
  preferredLanguages: [
    "English",
    "Mandarin",
    "Cantonese",
    "Japanese",
    "Korean",
    "Bahasa Malaysia",
    "Thai",
    "Bahasa Indonesia",
    "Filipino",
    "Vietnamese",
    "Spanish",
    "French",
    "Russian",
  ],
  certifications: ["Halal", "ISO", "HACCP", "GMP", "CE", "FDA"],
  offers: [
    "Manufacturer",
    "Brand Owner",
    "Distributor",
    "Wholesaler",
    "Retailer",
    "Service Provider",
    "Technology Provider",
    "Franchise Owner",
    "Investor",
    "Consultant",
    "Government / Agency",
  ],
  lookingFor: [
    "Buyers",
    "Importers",
    "Exporters",
    "Distributors",
    "Retail Partners",
    "Franchisees",
    "Suppliers",
    "OEM Partners",
    "ODM Partners",
    "Technology Partners",
    "Joint Venture Partners",
    "Strategic Alliances",
    "Investors",
    "Business Acquisition Opportunities",
    "Market Entry Partners",
    "Government Connections",
  ],
  preferredPartnerTypes: [
    "SME",
    "Large Corporation",
    "Government Agency",
    "Chamber of Commerce",
    "Investor",
    "Startup",
    "Technology Company",
    "Manufacturer",
    "Distributor",
  ],
  expectedOutcomes: [
    "Sales Opportunities",
    "Distribution Agreement",
    "Joint Venture",
    "Investment",
    "Technology Collaboration",
    "Licensing",
    "Franchise Expansion",
    "Market Expansion",
    "Strategic Partnership",
  ],
  exportsInternationally: ["Yes", "No"],
  meetingFormat: ["Physical", "Virtual", "Either"],
  maxMeetings: ["3", "5", "10", "No Limit"],
  supportingDocuments: [
    "Company Profile",
    "Product Catalogue",
    "Corporate Presentation",
    "Business License",
    "Certifications",
    "Promotional Video",
  ],
} satisfies Record<string, string[]>

function blankRegistrationProfile(): CompanyRegistrationProfile {
  return {
    companyNameEn: "",
    companyNameCn: "",
    countryRegion: "",
    countryOther: "",
    yearEstablished: "",
    registrationNumber: "",
    website: "",
    address: "",
    employeeRange: "",
    annualRevenueRange: "",
    contactName: "",
    contactPosition: "",
    contactEmail: "",
    mobileNumber: "",
    chatId: "",
    preferredLanguages: [],
    industries: [],
    industryOther: "",
    introduction: "",
    productsServices: "",
    certifications: [],
    certificationOther: "",
    offers: [],
    offerOther: "",
    lookingFor: [],
    lookingForOther: "",
    preferredPartnerTypes: [],
    preferredPartnerOther: "",
    expectedOutcomes: [],
    idealPartner: "",
    opportunity: "",
    exportsInternationally: "",
    exportMarkets: "",
    meetingFormat: "",
    availableMeetingDates: "",
    maxMeetings: "",
    supportingDocuments: [],
    consent: false,
    consentName: "",
    consentDate: "",
  }
}

function getRegistrationProfile(
  company: DelegationCompany | PartnerCompany
): CompanyRegistrationProfile {
  const blank = blankRegistrationProfile()
  const profile = company.profileData ?? blank

  return {
    ...blank,
    ...profile,
    companyNameEn: profile.companyNameEn || company.nameEn,
    companyNameCn: profile.companyNameCn || company.nameCn,
    contactName: profile.contactName || company.contact,
    contactEmail:
      profile.contactEmail ||
      company.contactMeta.match(/[^\s·]+@[^\s·]+/)?.[0] ||
      "",
  }
}

const meetingSlotDates = [
  "2026-07-01",
  "2026-07-02",
  "2026-07-03",
  "2026-07-06",
  "2026-07-07",
]
const meetingSlotHours = [10, 11, 14, 15]

function getMeetingSlotOptions() {
  return meetingSlotDates.flatMap((date) =>
    meetingSlotHours.map((hour) => {
      const paddedHour = String(hour).padStart(2, "0")

      return `${date}T${paddedHour}:00:00+08:00`
    })
  )
}

function localeTag(locale: Locale) {
  const tags: Record<Locale, string> = {
    en: "en-MY",
    zh: "zh-CN",
    "zh-Hant": "zh-Hant-TW",
    ja: "ja-JP",
    ko: "ko-KR",
    ms: "ms-MY",
    th: "th-TH",
    id: "id-ID",
    fil: "fil-PH",
    vi: "vi-VN",
    es: "es-MX",
    fr: "fr-CA",
    ru: "ru-RU",
  }

  return tags[locale]
}

function formatMeetingSlot(slot: string, locale: Locale) {
  const start = new Date(slot)
  const end = new Date(start.getTime() + 60 * 60 * 1000)
  const dateLabel = new Intl.DateTimeFormat(localeTag(locale), {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "Asia/Kuala_Lumpur",
  }).format(start)
  const timeFormatter = new Intl.DateTimeFormat(localeTag(locale), {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Kuala_Lumpur",
  })

  return `${dateLabel} · ${timeFormatter.format(start)}-${timeFormatter.format(end)}`
}

function statusLabel(status: string, locale: Locale) {
  if (locale === "en") {
    return status
  }

  const labels: Record<string, string> = {
    Accepted: "已接受",
    Arrived: "已抵达",
    Cancelled: "已取消",
    Completed: "已完成",
    Confirmed: "已确认",
    Declined: "已拒绝",
    Draft: "草稿",
    Failed: "失败",
    Flagged: "已标记",
    Incomplete: "未完成",
    Invited: "已邀请",
    Live: "进行中",
    Locked: "已锁定",
    Onboarded: "已入驻",
    Pending: "待处理",
    Planned: "已计划",
    Proposed: "已提议",
    Rejected: "已拒绝",
    Scheduled: "已安排",
    Sent: "已发送",
    Signed: "已签署",
    Sourced: "已搜集",
    Queued: "已排队",
    Verified: "已核验",
    "Agreement Reached": "已达成协议",
    "Session Scheduled": "已安排会议",
    "Under Discussion": "洽谈中",
  }

  const thaiLabels: Record<string, string> = {
    Accepted: "ยอมรับแล้ว",
    Arrived: "มาถึงแล้ว",
    Cancelled: "ยกเลิกแล้ว",
    Completed: "เสร็จสิ้น",
    Confirmed: "ยืนยันแล้ว",
    Declined: "ปฏิเสธแล้ว",
    Draft: "ร่าง",
    Failed: "ล้มเหลว",
    Flagged: "ถูกตั้งธง",
    Incomplete: "ยังไม่ครบ",
    Invited: "เชิญแล้ว",
    Live: "สด",
    Locked: "ล็อกแล้ว",
    Onboarded: "เริ่มใช้งานแล้ว",
    Pending: "รอดำเนินการ",
    Planned: "วางแผนแล้ว",
    Proposed: "เสนอแล้ว",
    Queued: "อยู่ในคิว",
    Rejected: "ปฏิเสธแล้ว",
    Scheduled: "จัดตารางแล้ว",
    Sent: "ส่งแล้ว",
    Signed: "ลงนามแล้ว",
    Sourced: "คัดหาแล้ว",
    Verified: "ตรวจสอบแล้ว",
    "Agreement Reached": "บรรลุข้อตกลง",
    "Session Scheduled": "จัดตารางประชุมแล้ว",
    "Under Discussion": "กำลังหารือ",
  }

  if (locale === "th") {
    return thaiLabels[status] ?? status
  }

  if (!isChineseLocale(locale)) {
    return status
  }

  const label = labels[status] ?? status

  return locale === "zh-Hant" ? toTraditional(label) : label
}

function categoryLabel(category: ResourceCategory, locale: Locale) {
  if (locale === "en") {
    return category
  }

  const labels: Record<ResourceCategory, string> = {
    Agenda: "议程",
    Map: "地图",
    Briefing: "简报",
    Logistics: "后勤",
    Other: "其他",
  }

  const thaiLabels: Record<ResourceCategory, string> = {
    Agenda: "กำหนดการ",
    Map: "แผนที่",
    Briefing: "บรีฟ",
    Logistics: "โลจิสติกส์",
    Other: "อื่นๆ",
  }

  if (locale === "th") {
    return thaiLabels[category]
  }

  if (!isChineseLocale(locale)) {
    return category
  }

  return locale === "zh-Hant"
    ? toTraditional(labels[category])
    : labels[category]
}

function audienceLabel(
  audience: ResourceAudience | AnnouncementTarget,
  locale: Locale
) {
  if (locale === "en") {
    return audience
  }

  const labels: Record<ResourceAudience, string> = {
    all: "全部参与者",
    delegation: "代表团",
    partner: "马方伙伴",
    admin: "管理团队",
  }

  const thaiLabels: Record<ResourceAudience, string> = {
    all: "ผู้เข้าร่วมทั้งหมด",
    delegation: "คณะผู้แทน",
    partner: "พันธมิตร",
    admin: "ทีมผู้ดูแล",
  }

  if (locale === "th") {
    return thaiLabels[audience]
  }

  if (!isChineseLocale(locale)) {
    return audience
  }

  return locale === "zh-Hant"
    ? toTraditional(labels[audience])
    : labels[audience]
}

function channelLabel(channel: AnnouncementChannel, locale: Locale) {
  if (locale === "en") {
    return channel
  }

  const labels: Record<AnnouncementChannel, string> = {
    both: "邮件 + 通知",
    email: "邮件群发",
    notification: "站内通知",
  }

  const thaiLabels: Record<AnnouncementChannel, string> = {
    both: "อีเมล + แจ้งเตือน",
    email: "อีเมลกลุ่ม",
    notification: "แจ้งเตือนในแอป",
  }

  if (locale === "th") {
    return thaiLabels[channel]
  }

  if (!isChineseLocale(locale)) {
    return channel
  }

  return locale === "zh-Hant" ? toTraditional(labels[channel]) : labels[channel]
}

function adminTabItems(locale: Locale) {
  const t = getUiCopy(locale)

  return [
    { value: "dashboard", label: t.dashboard, icon: AnalyticsUpIcon },
    {
      value: "companies",
      label: t.companies,
      icon: Building01Icon,
      children: [
        {
          value: "delegation-companies",
          label: t.delegation,
          icon: Building01Icon,
        },
        {
          value: "partner-companies",
          label: t.malaysianPartners,
          icon: UserGroupIcon,
        },
      ],
    },
    { value: "matching", label: t.matching, icon: UserGroupIcon },
    {
      value: "meeting-management",
      label: t.meetings,
      icon: CameraVideoIcon,
      children: [
        {
          value: "meetings",
          label: textFor(locale, "Meeting dashboard", "会议仪表板"),
          icon: Calendar03Icon,
        },
        {
          value: "meeting-settings",
          label: textFor(locale, "Meeting settings", "会议设置"),
          icon: SecurityCheckIcon,
        },
      ],
    },
    { value: "interpreters", label: t.interpreters, icon: TranslationIcon },
    { value: "signing", label: t.signing, icon: File01Icon },
    { value: "communications", label: t.communications, icon: Alert02Icon },
    { value: "resources", label: t.resources, icon: Upload01Icon },
    { value: "onsite", label: t.onsite, icon: QrCodeIcon },
    { value: "reports", label: t.reports, icon: Download01Icon },
  ] satisfies NavItem[]
}

function portalTabItems(locale: Locale, profileLabel: string) {
  const t = getUiCopy(locale)

  return [
    { value: "dashboard", label: t.dashboard, icon: AnalyticsUpIcon },
    { value: "profile", label: profileLabel, icon: Building01Icon },
    { value: "matches", label: t.myMatches, icon: UserGroupIcon },
    { value: "meetings", label: t.myMeetings, icon: CameraVideoIcon },
    { value: "signing", label: "MOU", icon: File01Icon },
    { value: "onsite", label: t.onsite, icon: QrCodeIcon },
  ] satisfies NavItem[]
}

function formatDateTime(value: string, locale: Locale = "en") {
  return new Intl.DateTimeFormat(localeTag(locale), {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kuala_Lumpur",
  }).format(new Date(value))
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function Icon({
  icon,
  inline,
  className,
}: {
  icon: Parameters<typeof HugeiconsIcon>[0]["icon"]
  inline?: "inline-start" | "inline-end"
  className?: string
}) {
  return (
    <HugeiconsIcon
      icon={icon}
      data-icon={inline}
      strokeWidth={1.7}
      className={className}
    />
  )
}

function statusVariant(
  status: string
): "default" | "secondary" | "outline" | "destructive" {
  if (
    [
      "Signed",
      "Accepted",
      "Confirmed",
      "Completed",
      "Arrived",
      "Verified",
      "Locked",
    ].includes(status)
  ) {
    return "default"
  }
  if (
    ["Rejected", "Failed", "Flagged", "Cancelled", "Declined"].includes(status)
  ) {
    return "destructive"
  }
  if (
    [
      "Scheduled",
      "Session Scheduled",
      "Agreement Reached",
      "Onboarded",
    ].includes(status)
  ) {
    return "secondary"
  }
  return "outline"
}

export function PlexusConnectMvp({
  role,
  locale = "en",
  initialDb,
  session,
  initialAdminSection,
  initialVendorSection,
  meetingProviderReadiness = unavailableMeetingProviderReadiness,
}: {
  role: PortalRole
  locale?: Locale
  initialDb: LocalDb
  session: PortalSession
  initialAdminSection?: string
  initialVendorSection?: string
  meetingProviderReadiness?: MeetingProviderReadiness
}) {
  const router = useRouter()
  const [db, setDb] = useState<LocalDb>(initialDb)
  const [, setIsSaving] = useState(false)
  const [query, setQuery] = useState("")
  const [vendorRealtimeStatus, setVendorRealtimeStatus] = useState<
    "connecting" | "live" | "degraded"
  >("connecting")
  const [selectedDelegation, setSelectedDelegation] = useState(
    initialDb.delegationCompanies[0]?.id ?? ""
  )
  const [selectedPartner] = useState(initialDb.partnerCompanies[0]?.id ?? "")

  const selectedDelegationCompany =
    db.delegationCompanies.find(
      (company) => company.id === selectedDelegation
    ) ??
    db.delegationCompanies[0] ??
    (makeBlankCompany("delegation") as DelegationCompany)
  const selectedPartnerCompany =
    db.partnerCompanies.find((company) => company.id === selectedPartner) ??
    db.partnerCompanies[0] ??
    (makeBlankCompany("partner") as PartnerCompany)

  const metrics = useMemo(() => getMetrics(db), [db])
  const copy = getPortalCopy(locale, role)
  const vendorMatchIds = useMemo(() => {
    if (role === "admin" || !session.vendorCompanyId) {
      return []
    }

    return db.matches
      .filter((match) =>
        role === "delegation"
          ? match.delegationId === session.vendorCompanyId
          : match.partnerId === session.vendorCompanyId
      )
      .map((match) => match.id)
      .sort()
  }, [db.matches, role, session.vendorCompanyId])
  const vendorMatchKey = vendorMatchIds.join(",")

  useEffect(() => {
    if (role === "admin" || !session.vendorCompanyId || !session.vendorType) {
      return
    }

    let active = true
    let refreshRunning = false
    let refreshQueued = false
    let refreshTimeout: ReturnType<typeof setTimeout> | undefined
    const supabase = createSupabaseBrowserClient()
    const targets = getVendorRealtimeTargets({
      vendorType: session.vendorType,
      vendorCompanyId: session.vendorCompanyId,
      matchIds: vendorMatchKey ? vendorMatchKey.split(",") : [],
    })

    async function refreshWorkspace() {
      if (refreshRunning) {
        refreshQueued = true
        return
      }

      refreshRunning = true

      try {
        do {
          refreshQueued = false
          const result = await refreshPortalDbAction()

          if (!active) {
            return
          }

          if (!result.ok) {
            setVendorRealtimeStatus("degraded")
            return
          }

          setDb(result.db)
          setVendorRealtimeStatus("live")
        } while (active && refreshQueued)
      } catch {
        if (active) {
          setVendorRealtimeStatus("degraded")
        }
      } finally {
        refreshRunning = false
      }
    }

    function scheduleRefresh() {
      if (refreshTimeout) {
        clearTimeout(refreshTimeout)
      }

      refreshTimeout = setTimeout(() => {
        void refreshWorkspace()
      }, 150)
    }

    let channel = supabase.channel(`vendor-dashboard-${session.userId}`)

    for (const target of targets) {
      channel = channel
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: target.table,
            filter: target.filter,
          },
          scheduleRefresh
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: target.table,
            filter: target.filter,
          },
          scheduleRefresh
        )
    }

    channel.subscribe((status, error) => {
      if (!active) {
        return
      }

      if (status === "SUBSCRIBED" && !error) {
        setVendorRealtimeStatus("live")
        return
      }

      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || error) {
        setVendorRealtimeStatus("degraded")
      }
    })

    const fallbackRefresh = window.setInterval(() => {
      void refreshWorkspace()
    }, 60_000)
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") {
        scheduleRefresh()
      }
    }

    window.addEventListener("focus", scheduleRefresh)
    document.addEventListener("visibilitychange", refreshWhenVisible)

    return () => {
      active = false

      if (refreshTimeout) {
        clearTimeout(refreshTimeout)
      }

      window.clearInterval(fallbackRefresh)
      window.removeEventListener("focus", scheduleRefresh)
      document.removeEventListener("visibilitychange", refreshWhenVisible)
      void supabase.removeChannel(channel)
    }
  }, [
    role,
    session.userId,
    session.vendorCompanyId,
    session.vendorType,
    vendorMatchKey,
  ])

  async function applyServerResult(
    action: Promise<{ ok: true; db: LocalDb } | { ok: false; error: string }>,
    successMessage: string
  ) {
    setIsSaving(true)
    try {
      const result = await action

      if (!result.ok) {
        toast.error(result.error)
        return false
      }

      setDb(result.db)
      toast.success(successMessage)
      router.refresh()
      return true
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Supabase action failed."
      )
      return false
    } finally {
      setIsSaving(false)
    }
  }

  function createCompany(_kind: CompanyKind, values: ManagedCompany) {
    void applyServerResult(
      createCompanyAction(values),
      `${values.nameEn} created.`
    )
  }

  function updateManagedCompany(_kind: CompanyKind, values: ManagedCompany) {
    void applyServerResult(
      updateCompanyAction(values),
      `${values.nameEn} saved.`
    )
  }

  function deleteManagedCompany(kind: CompanyKind, id: string) {
    const companyName =
      kind === "delegation"
        ? db.delegationCompanies.find((company) => company.id === id)?.nameEn
        : db.partnerCompanies.find((company) => company.id === id)?.nameEn

    void applyServerResult(
      deleteCompanyAction(kind, id),
      `${companyName ?? "Company"} deleted from Supabase.`
    )
  }

  function addMatch(partnerId: string) {
    const existing = db.matches.some(
      (match) =>
        match.delegationId === selectedDelegationCompany.id &&
        match.partnerId === partnerId
    )

    if (existing) {
      toast("This match already exists.")
      return
    }

    void applyServerResult(
      addMatchAction(selectedDelegationCompany.id, partnerId),
      "Match proposed in Supabase."
    )
  }

  function updateMatchStatus(matchId: string, status: MatchStatus) {
    void applyServerResult(
      updateMatchStatusAction(matchId, status),
      `Match marked ${status}.`
    )
  }

  function scheduleMeeting(
    match: Match,
    requestedSlots?: string[],
    requestedInterpreterId?: string | null
  ) {
    void applyServerResult(
      scheduleMeetingAction(match.id, requestedSlots, requestedInterpreterId),
      "Meeting preferences saved for Admin confirmation."
    )
  }

  function createProviderMeeting(match: Match, provider: "zoom" | "lark") {
    void applyServerResult(
      createProviderMeetingAction({ matchId: match.id, provider }),
      `${provider === "zoom" ? "Zoom" : "Lark"} meeting created with a protected join link.`
    )
  }

  function createManualMeeting(values: ManualMeetingInput) {
    const delegation = db.delegationCompanies.find(
      (company) => company.id === values.delegationId
    )
    const partner = db.partnerCompanies.find(
      (company) => company.id === values.partnerId
    )

    return applyServerResult(
      createManualMeetingAction(values),
      `${delegation?.nameEn ?? "Delegation Vendor"} ↔ ${partner?.nameEn ?? "Partner Vendor"} meeting added to the calendar.`
    )
  }

  function updateMeeting(values: MeetingAmendmentInput) {
    return applyServerResult(
      updateMeetingAction(values),
      "Meeting details updated."
    )
  }

  function completeMeeting(meetingId: string) {
    void applyServerResult(
      completeMeetingAction(meetingId),
      "Post-session summary saved."
    )
  }

  function createInterpreter(values: {
    name: string
    languages: string
    email: string
    notes: string
    available: boolean
  }) {
    void applyServerResult(
      createInterpreterAction(values),
      `${values.name} added to the interpreter roster.`
    )
  }

  function updateInterpreter(
    interpreterId: string,
    values: {
      name: string
      languages: string
      email: string
      notes: string
      available: boolean
    }
  ) {
    void applyServerResult(
      updateInterpreterAction(interpreterId, values),
      `${values.name} updated.`
    )
  }

  function deleteInterpreter(interpreterId: string) {
    const interpreter = db.interpreters.find(
      (item) => item.id === interpreterId
    )

    void applyServerResult(
      deleteInterpreterAction(interpreterId),
      `${interpreter?.name ?? "Interpreter"} removed from the roster.`
    )
  }

  function assignMeetingInterpreter(
    meetingId: string,
    interpreterId: string | null
  ) {
    void applyServerResult(
      assignMeetingInterpreterAction(meetingId, interpreterId),
      interpreterId
        ? "Interpreter assigned to the session."
        : "Interpreter assignment cleared."
    )
  }

  function updateDeal(dealId: string, status: Deal["status"]) {
    void applyServerResult(
      updateDealAction(dealId, status),
      `Deal marked ${status}.`
    )
  }

  function createDeal(matchId: string) {
    return applyServerResult(
      createDealAction(matchId),
      "MOU record created for the selected Vendor match."
    )
  }

  function refreshDeals(successMessage: string) {
    return applyServerResult(refreshPortalDbAction(), successMessage)
  }

  function confirmAttendance(partnerId: string) {
    void applyServerResult(
      confirmAttendanceAction(partnerId),
      "Attendance confirmed and QR code generated."
    )
  }

  function checkInPartner(partnerId: string) {
    void applyServerResult(checkInPartnerAction(partnerId), "Guest checked in.")
  }

  function publishItinerary(slotId: string) {
    void applyServerResult(
      publishItineraryAction(slotId),
      "Itinerary publish status updated."
    )
  }

  function updateCompanyProfile(
    kind: "delegation" | "partner",
    id: string,
    profile: CompanyRegistrationProfile
  ) {
    void applyServerResult(
      updateCompanyProfileAction(kind, id, profile),
      "Profile saved to Supabase."
    )
  }

  function sendAnnouncement(values: {
    title: string
    message: string
    target: AnnouncementTarget
    channel: AnnouncementChannel
    status?: Announcement["status"]
  }) {
    void applyServerResult(
      sendAnnouncementAction(values),
      values.status === "Sent"
        ? "Announcement sent and logged."
        : "Announcement queued."
    )
  }

  function createResource(values: {
    title: string
    category: ResourceCategory
    fileName: string
    fileUrl: string
    audience: ResourceAudience
    visibleToDelegation: boolean
    notes: string
  }) {
    void applyServerResult(
      createResourceAction(values),
      `${values.title} added to resources.`
    )
  }

  async function uploadResource(formData: FormData) {
    setIsSaving(true)

    try {
      const response = await fetch("/api/admin/resources/upload", {
        method: "POST",
        body: formData,
      })
      const payload = (await response.json().catch(() => null)) as
        | { ok: true; resource: ResourceUploadRow }
        | { error?: string }
        | null

      if (!response.ok || !payload || !("ok" in payload)) {
        const errorPayload = payload as { error?: string } | null
        toast.error(
          errorPayload?.error ??
            "Resource upload failed. Check the file and retry."
        )
        return
      }

      const resource: EventResource = {
        id: payload.resource.id,
        title: payload.resource.title,
        category: payload.resource.category,
        fileName: payload.resource.file_name,
        fileUrl: payload.resource.file_url,
        storagePath: payload.resource.storage_path,
        audience: payload.resource.audience,
        visibleToDelegation: payload.resource.visible_to_delegation,
        notes: payload.resource.notes,
        updatedAt: payload.resource.updated_at,
      }

      setDb((current) => ({
        ...current,
        resources: [
          resource,
          ...current.resources.filter((item) => item.id !== resource.id),
        ],
      }))
      toast.success(`${resource.title} uploaded to resources.`)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed.")
    } finally {
      setIsSaving(false)
    }
  }

  function toggleResourceVisibility(
    resourceId: string,
    visibleToDelegation: boolean
  ) {
    const resource = db.resources.find((item) => item.id === resourceId)

    void applyServerResult(
      toggleResourceVisibilityAction(resourceId, visibleToDelegation),
      `${resource?.title ?? "Resource"} visibility updated.`
    )
  }

  async function logout() {
    const result = await logoutAction(locale)
    router.push(result.redirectTo)
  }

  const visibleMatches =
    role === "delegation"
      ? db.matches.filter(
          (match) => match.delegationId === selectedDelegationCompany.id
        )
      : role === "partner"
        ? db.matches.filter(
            (match) => match.partnerId === selectedPartnerCompany.id
          )
        : db.matches

  const visibleMeetings = db.meetings.filter((meeting) =>
    visibleMatches.some((match) => match.id === meeting.matchId)
  )

  return (
    <main className="min-h-svh bg-background">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 pb-8 sm:px-6 lg:px-8">
        {role === "admin" ? (
          <AdminPortal
            db={db}
            role={role}
            locale={locale}
            copy={copy}
            session={session}
            initialSection={initialAdminSection}
            query={query}
            setQuery={setQuery}
            metrics={metrics}
            logout={logout}
            selectedDelegation={selectedDelegation}
            setSelectedDelegation={setSelectedDelegation}
            createCompany={createCompany}
            updateManagedCompany={updateManagedCompany}
            deleteManagedCompany={deleteManagedCompany}
            addMatch={addMatch}
            createManualMeeting={createManualMeeting}
            updateMeeting={updateMeeting}
            createProviderMeeting={createProviderMeeting}
            completeMeeting={completeMeeting}
            assignMeetingInterpreter={assignMeetingInterpreter}
            createInterpreter={createInterpreter}
            updateInterpreter={updateInterpreter}
            deleteInterpreter={deleteInterpreter}
            createDeal={createDeal}
            updateDeal={updateDeal}
            refreshDeals={refreshDeals}
            checkInPartner={checkInPartner}
            publishItinerary={publishItinerary}
            sendAnnouncement={sendAnnouncement}
            createResource={createResource}
            uploadResource={uploadResource}
            toggleResourceVisibility={toggleResourceVisibility}
            meetingProviderReadiness={meetingProviderReadiness}
          />
        ) : role === "delegation" ? (
          <DelegationPortal
            company={selectedDelegationCompany}
            dashboardHeader={
              <VendorDashboardHeader
                copy={copy}
                company={selectedDelegationCompany}
                matches={visibleMatches}
                meetings={visibleMeetings}
                db={db}
                locale={locale}
                realtimeStatus={vendorRealtimeStatus}
              />
            }
            role={role}
            locale={locale}
            session={session}
            logout={logout}
            initialSection={initialVendorSection}
            matches={visibleMatches}
            meetings={visibleMeetings}
            db={db}
            updateMatchStatus={updateMatchStatus}
            scheduleMeeting={scheduleMeeting}
            updateCompanyProfile={updateCompanyProfile}
          />
        ) : (
          <PartnerPortal
            company={selectedPartnerCompany}
            dashboardHeader={
              <VendorDashboardHeader
                copy={copy}
                company={selectedPartnerCompany}
                matches={visibleMatches}
                meetings={visibleMeetings}
                db={db}
                locale={locale}
                realtimeStatus={vendorRealtimeStatus}
              />
            }
            role={role}
            locale={locale}
            session={session}
            logout={logout}
            initialSection={initialVendorSection}
            matches={visibleMatches}
            meetings={visibleMeetings}
            db={db}
            updateMatchStatus={updateMatchStatus}
            scheduleMeeting={scheduleMeeting}
            updateCompanyProfile={updateCompanyProfile}
            confirmAttendance={confirmAttendance}
          />
        )}
      </div>
    </main>
  )
}

function getMetrics(db: LocalDb) {
  const sessionsScheduled = db.meetings.filter((meeting) =>
    ["Scheduled", "Live", "Completed"].includes(meeting.status)
  ).length
  const sessionsCompleted = db.meetings.filter(
    (meeting) => meeting.status === "Completed"
  ).length
  const signed = db.deals.filter((deal) => deal.status === "Signed").length
  const conversion = sessionsCompleted
    ? Math.round((signed / sessionsCompleted) * 100)
    : 0
  const arrived = db.partnerCompanies.filter(
    (partner) => partner.arrived
  ).length
  const invited = db.partnerCompanies.filter((partner) =>
    ["Invited", "Confirmed", "Arrived"].includes(partner.attendance)
  ).length
  const fullyMatched = db.delegationCompanies.filter((company) => {
    const accepted = db.matches.filter(
      (match) =>
        match.delegationId === company.id &&
        ["Accepted", "Session Scheduled"].includes(match.status)
    )
    return accepted.length >= 2
  }).length

  return {
    delegationTotal: db.delegationCompanies.length,
    partnerTotal: db.partnerCompanies.length,
    sessionsScheduled,
    sessionsCompleted,
    signed,
    conversion,
    arrived,
    invited,
    fullyMatched,
  }
}

function MetricCard({
  label,
  value,
  detail,
  icon,
}: {
  label: string
  value: string | number
  detail: string
  icon: Parameters<typeof HugeiconsIcon>[0]["icon"]
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <CardDescription>{label}</CardDescription>
          <CardTitle className="text-2xl">{value}</CardTitle>
        </div>
        <div className="flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <Icon icon={icon} />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  )
}

function DashboardHeader({
  copy,
  metrics,
  locale,
}: {
  copy: Record<string, string>
  metrics: ReturnType<typeof getMetrics>
  locale: Locale
}) {
  const t = getUiCopy(locale)

  return (
    <section className="flex flex-col gap-5 rounded-lg border bg-card p-4 sm:p-5">
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground">
            {copy.eyebrow}
          </p>
          <h1 className="text-2xl font-semibold tracking-normal sm:text-3xl">
            {copy.title}
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            {copy.subtitle}
          </p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label={t.delegationCompanies}
          value={metrics.delegationTotal}
          detail={t.delegationTarget}
          icon={Building01Icon}
        />
        <MetricCard
          label={t.partnersSourced}
          value={metrics.partnerTotal}
          detail={t.partnerTarget}
          icon={UserGroupIcon}
        />
        <MetricCard
          label={t.sessionsScheduled}
          value={metrics.sessionsScheduled}
          detail={`${metrics.sessionsCompleted} ${t.completed}`}
          icon={CameraVideoIcon}
        />
        <MetricCard
          label={t.signingConversion}
          value={`${metrics.conversion}%`}
          detail={t.conversionTarget}
          icon={AnalyticsUpIcon}
        />
      </div>
    </section>
  )
}

function VendorDashboardHeader({
  copy,
  company,
  matches,
  meetings,
  db,
  locale,
  realtimeStatus,
}: {
  copy: Record<string, string>
  company: DelegationCompany | PartnerCompany
  matches: Match[]
  meetings: Meeting[]
  db: LocalDb
  locale: Locale
  realtimeStatus: "connecting" | "live" | "degraded"
}) {
  const dashboardMetrics = getVendorDashboardMetrics({
    company,
    matches,
    meetings,
    deals: db.deals,
  })

  return (
    <section className="flex flex-col gap-5 rounded-lg border bg-card p-4 sm:p-5">
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-2">
            <p className="text-xs font-medium text-muted-foreground">
              {copy.eyebrow}
            </p>
            <h1 className="text-2xl font-semibold tracking-normal sm:text-3xl">
              {copy.title}
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              {copy.subtitle}
            </p>
          </div>
          <Badge
            variant="outline"
            className="h-7 gap-2 rounded-full px-3 text-xs"
            data-testid="vendor-realtime-status"
          >
            <span
              className={cn(
                "size-1.5 rounded-full",
                realtimeStatus === "live"
                  ? "bg-emerald-500"
                  : realtimeStatus === "connecting"
                    ? "animate-pulse bg-amber-500"
                    : "bg-muted-foreground"
              )}
              aria-hidden="true"
            />
            {realtimeStatus === "live"
              ? textFor(locale, "Live data", "实时数据")
              : realtimeStatus === "connecting"
                ? textFor(locale, "Connecting", "正在连接")
                : textFor(locale, "Auto-refreshing", "自动刷新")}
          </Badge>
        </div>
      </div>
      <div
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        data-testid="vendor-dashboard-metrics"
      >
        <MetricCard
          label={textFor(locale, "Profile readiness", "资料完成度")}
          value={`${dashboardMetrics.profileComplete}%`}
          detail={
            dashboardMetrics.profileRemaining
              ? textFor(
                  locale,
                  `${dashboardMetrics.profileRemaining}% remaining`,
                  `${dashboardMetrics.profileRemaining}% 待完成`
                )
              : textFor(locale, "Profile ready", "资料已完成")
          }
          icon={UserAccountIcon}
        />
        <MetricCard
          label={textFor(locale, "Pending matches", "待回应配对")}
          value={dashboardMetrics.pendingMatches}
          detail={textFor(
            locale,
            `${dashboardMetrics.totalMatches} total opportunities`,
            `共 ${dashboardMetrics.totalMatches} 个配对机会`
          )}
          icon={UserGroupIcon}
        />
        <MetricCard
          label={textFor(locale, "Upcoming meetings", "即将举行会议")}
          value={dashboardMetrics.upcomingMeetings}
          detail={textFor(
            locale,
            `${dashboardMetrics.completedMeetings} completed`,
            `${dashboardMetrics.completedMeetings} 场已完成`
          )}
          icon={CameraVideoIcon}
        />
        <MetricCard
          label={textFor(locale, "Active MOUs", "进行中 MOU")}
          value={dashboardMetrics.activeMous}
          detail={textFor(
            locale,
            `${dashboardMetrics.signedMous} signed agreements`,
            `${dashboardMetrics.signedMous} 份已签署`
          )}
          icon={File01Icon}
        />
      </div>
    </section>
  )
}

function AdminPortal(props: {
  db: LocalDb
  role: PortalRole
  locale: Locale
  copy: Record<string, string>
  session: PortalSession
  initialSection?: string
  query: string
  setQuery: (value: string) => void
  metrics: ReturnType<typeof getMetrics>
  logout: () => void
  selectedDelegation: string
  setSelectedDelegation: (value: string) => void
  createCompany: (kind: CompanyKind, values: ManagedCompany) => void
  updateManagedCompany: (kind: CompanyKind, values: ManagedCompany) => void
  deleteManagedCompany: (kind: CompanyKind, id: string) => void
  addMatch: (partnerId: string) => void
  createManualMeeting: (values: ManualMeetingInput) => Promise<boolean>
  updateMeeting: (values: MeetingAmendmentInput) => Promise<boolean>
  createProviderMeeting: (match: Match, provider: "zoom" | "lark") => void
  completeMeeting: (meetingId: string) => void
  assignMeetingInterpreter: (
    meetingId: string,
    interpreterId: string | null
  ) => void
  createInterpreter: (values: InterpreterFormValues) => void
  updateInterpreter: (
    interpreterId: string,
    values: InterpreterFormValues
  ) => void
  deleteInterpreter: (interpreterId: string) => void
  createDeal: (matchId: string) => Promise<boolean>
  updateDeal: (dealId: string, status: Deal["status"]) => void
  refreshDeals: (successMessage: string) => Promise<boolean>
  checkInPartner: (partnerId: string) => void
  publishItinerary: (slotId: string) => void
  sendAnnouncement: (values: {
    title: string
    message: string
    target: AnnouncementTarget
    channel: AnnouncementChannel
    status?: Announcement["status"]
  }) => void
  createResource: (values: {
    title: string
    category: ResourceCategory
    fileName: string
    fileUrl: string
    audience: ResourceAudience
    visibleToDelegation: boolean
    notes: string
  }) => void
  uploadResource: (formData: FormData) => Promise<void>
  toggleResourceVisibility: (
    resourceId: string,
    visibleToDelegation: boolean
  ) => void
  meetingProviderReadiness: MeetingProviderReadiness
}) {
  const {
    db,
    role,
    locale,
    copy,
    session,
    initialSection,
    query,
    setQuery,
    metrics,
    logout,
    selectedDelegation,
    setSelectedDelegation,
    createCompany,
    updateManagedCompany,
    deleteManagedCompany,
    addMatch,
    createManualMeeting,
    updateMeeting,
    createProviderMeeting,
    completeMeeting,
    assignMeetingInterpreter,
    createInterpreter,
    updateInterpreter,
    deleteInterpreter,
    createDeal,
    updateDeal,
    refreshDeals,
    checkInPartner,
    publishItinerary,
    sendAnnouncement,
    createResource,
    uploadResource,
    toggleResourceVisibility,
    meetingProviderReadiness,
  } = props
  const navigationCopy = getUiCopy(locale)
  const navigationItems = adminTabItems(locale)
  const validSections = navigationItems.flatMap((item) =>
    item.children ? item.children.map((child) => child.value) : [item.value]
  )
  const [activeTab, setActiveTab] = useState(
    initialSection && validSections.includes(initialSection)
      ? initialSection
      : "dashboard"
  )
  const filteredDelegationCompanies = db.delegationCompanies.filter((company) =>
    matchCompanyQuery(company, query)
  )
  const filteredPartnerCompanies = db.partnerCompanies.filter((company) =>
    matchCompanyQuery(company, query)
  )
  const delegationProfileAverage = db.delegationCompanies.length
    ? Math.round(
        db.delegationCompanies.reduce(
          (sum, company) => sum + company.profileComplete,
          0
        ) / db.delegationCompanies.length
      )
    : 0
  const partnerProfileAverage = db.partnerCompanies.length
    ? Math.round(
        db.partnerCompanies.reduce(
          (sum, company) => sum + company.profileComplete,
          0
        ) / db.partnerCompanies.length
      )
    : 0
  const matchedDelegations = db.delegationCompanies.filter((company) =>
    db.matches.some((match) => match.delegationId === company.id)
  ).length
  const confirmedPartners = db.partnerCompanies.filter((partner) =>
    ["Confirmed", "Arrived"].includes(partner.attendance)
  ).length
  const verifiedPartners = db.partnerCompanies.filter(
    (partner) => partner.verified === "Verified"
  ).length
  const matchingDelegation = db.delegationCompanies.find(
    (company) => company.id === selectedDelegation
  )
  const timelineItems = [
    [
      textFor(locale, "Pre-visit", "访前准备"),
      textFor(
        locale,
        "Needs analysis, matching, video sessions",
        "需求分析、配对与视频会议"
      ),
      72,
    ],
    [
      textFor(locale, "On-site", "现场执行"),
      textFor(
        locale,
        "Check-in, itinerary, liaison, site visits",
        "签到、行程、联络与参访"
      ),
      38,
    ],
    [
      textFor(locale, "Reporting", "报告输出"),
      textFor(
        locale,
        "Pre-visit and post-event exports",
        "访前与活动后报告导出"
      ),
      44,
    ],
  ] as const

  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      orientation="vertical"
      className="flex-col gap-4 lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start"
    >
      <ResponsiveTabsNav
        items={navigationItems}
        externalItems={[
          {
            href: `/${locale}/admin/vendors`,
            label: navigationCopy.vendorAccounts,
            icon: UserAccountIcon,
          },
          {
            href: `/${locale}/compliance`,
            label: navigationCopy.compliance,
            icon: SecurityCheckIcon,
          },
        ]}
        activeValue={activeTab}
        onValueChange={setActiveTab}
        role={role}
        locale={locale}
        session={session}
        logout={logout}
      />

      <TabsContent value="dashboard" className="min-w-0">
        <div className="flex flex-col gap-4">
          <DashboardHeader copy={copy} metrics={metrics} locale={locale} />
          <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
            <Card>
              <CardHeader>
                <CardTitle>
                  {textFor(locale, "Live operating picture", "实时运营概览")}
                </CardTitle>
                <CardDescription>
                  {textFor(
                    locale,
                    "Pre-visit progress, alerts and today's session queue.",
                    "访前进度、运营提醒与今日会议队列。"
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <Progress
                  value={Math.min(100, (metrics.fullyMatched / 35) * 100)}
                />
                <div className="grid gap-3 sm:grid-cols-3">
                  <InfoTile
                    label={textFor(locale, "Fully matched", "已完成配对")}
                    value={`${metrics.fullyMatched} / 35`}
                  />
                  <InfoTile
                    label={textFor(locale, "Arrived guests", "已抵达嘉宾")}
                    value={`${metrics.arrived} / ${metrics.invited}`}
                  />
                  <InfoTile
                    label={textFor(locale, "Signed MOUs", "已签署 MOU")}
                    value={metrics.signed}
                  />
                </div>
                <SessionList
                  db={db}
                  meetings={db.meetings}
                  onComplete={completeMeeting}
                  onUpdateMeeting={updateMeeting}
                  locale={locale}
                />
              </CardContent>
              <CardFooter className="flex flex-wrap gap-2">
                <CompanyDialog
                  kind="delegation"
                  mode="create"
                  onSave={(company) => createCompany("delegation", company)}
                >
                  <Button>
                    <Icon icon={AddIcon} inline="inline-start" />
                    {textFor(locale, "Add Company", "新增企业")}
                  </Button>
                </CompanyDialog>
                <Button
                  variant="outline"
                  onClick={() => exportPreVisitReport(db, locale)}
                >
                  <Icon icon={Download01Icon} inline="inline-start" />
                  {textFor(locale, "Export Report", "导出报告")}
                </Button>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>
                  {textFor(locale, "Phase timeline", "阶段时间线")}
                </CardTitle>
                <CardDescription>
                  {textFor(
                    locale,
                    "June to September delivery checkpoints.",
                    "六月至九月的交付检查点。"
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {timelineItems.map(([label, detail, value]) => (
                  <div key={label} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium">{label}</span>
                      <span className="text-muted-foreground">{value}%</span>
                    </div>
                    <Progress value={Number(value)} />
                    <p className="text-xs text-muted-foreground">{detail}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="delegation-companies" className="min-w-0">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold">
                {textFor(locale, "Delegation companies", "代表团企业")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {textFor(
                  locale,
                  "Manage Chinese and Macao delegation profiles, readiness and matching coverage.",
                  "管理中国与澳门代表团企业资料、准备度与配对覆盖。"
                )}
              </p>
            </div>
            <CompanyDialog
              kind="delegation"
              mode="create"
              onSave={(company) => createCompany("delegation", company)}
            >
              <Button>
                <Icon icon={AddIcon} inline="inline-start" />
                {textFor(locale, "Add Delegation", "新增代表团")}
              </Button>
            </CompanyDialog>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <InfoTile
              label={textFor(locale, "Total delegation", "代表团总数")}
              value={db.delegationCompanies.length}
            />
            <InfoTile
              label={textFor(locale, "Onboarded / locked", "已入驻 / 已锁定")}
              value={
                db.delegationCompanies.filter((company) =>
                  ["Onboarded", "Locked"].includes(company.status)
                ).length
              }
            />
            <InfoTile
              label={textFor(locale, "Profile average", "资料平均完成度")}
              value={`${delegationProfileAverage}%`}
            />
            <InfoTile
              label={textFor(locale, "With matches", "已有配对")}
              value={`${matchedDelegations} / ${db.delegationCompanies.length}`}
            />
          </div>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="delegation-search">
                {textFor(
                  locale,
                  "Search delegation companies",
                  "搜索代表团企业"
                )}
              </FieldLabel>
              <Input
                id="delegation-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={textFor(
                  locale,
                  "Sector, company name, origin or status",
                  "行业、企业名称、来源地或状态"
                )}
              />
            </Field>
          </FieldGroup>
          <CompanyTable
            title={textFor(
              locale,
              "Delegation company records",
              "代表团企业记录"
            )}
            kind="delegation"
            companies={filteredDelegationCompanies}
            locale={locale}
            onSave={(company) => updateManagedCompany("delegation", company)}
            onDelete={(company) =>
              deleteManagedCompany("delegation", company.id)
            }
          />
        </div>
      </TabsContent>

      <TabsContent value="partner-companies" className="min-w-0">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold">
                {textFor(locale, "Malaysian partners", "马来西亚伙伴")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {textFor(
                  locale,
                  "Manage sourced Malaysian partners, verification, attendance and readiness.",
                  "管理已搜集的马来西亚伙伴、核验、出席与准备情况。"
                )}
              </p>
            </div>
            <CompanyDialog
              kind="partner"
              mode="create"
              onSave={(company) => createCompany("partner", company)}
            >
              <Button>
                <Icon icon={AddIcon} inline="inline-start" />
                {textFor(locale, "Add MY Partner", "新增马方伙伴")}
              </Button>
            </CompanyDialog>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <InfoTile
              label={textFor(locale, "Total partners", "伙伴总数")}
              value={db.partnerCompanies.length}
            />
            <InfoTile
              label={textFor(locale, "Confirmed attendance", "已确认出席")}
              value={`${confirmedPartners} / ${db.partnerCompanies.length}`}
            />
            <InfoTile
              label={textFor(locale, "Verified partners", "已核验伙伴")}
              value={verifiedPartners}
            />
            <InfoTile
              label={textFor(locale, "Profile average", "资料平均完成度")}
              value={`${partnerProfileAverage}%`}
            />
          </div>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="partner-search">
                {textFor(locale, "Search Malaysian partners", "搜索马方伙伴")}
              </FieldLabel>
              <Input
                id="partner-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={textFor(
                  locale,
                  "Sector, company name, type or status",
                  "行业、企业名称、类型或状态"
                )}
              />
            </Field>
          </FieldGroup>
          <CompanyTable
            title={textFor(locale, "Malaysian partner records", "马方伙伴记录")}
            kind="partner"
            companies={filteredPartnerCompanies}
            locale={locale}
            onSave={(company) => updateManagedCompany("partner", company)}
            onDelete={(company) => deleteManagedCompany("partner", company.id)}
          />
        </div>
      </TabsContent>

      <TabsContent value="matching" className="min-w-0">
        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <CardHeader>
              <CardTitle>
                {textFor(locale, "Matching board", "配对看板")}
              </CardTitle>
              <CardDescription>
                {textFor(
                  locale,
                  "Assign at least two Malaysian partners per delegation company.",
                  "为每家代表团企业至少分配两家马来西亚伙伴。"
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <FieldGroup>
                <Field>
                  <FieldLabel>
                    {textFor(locale, "Delegation company", "代表团企业")}
                  </FieldLabel>
                  <Select
                    value={selectedDelegation}
                    onValueChange={setSelectedDelegation}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {db.delegationCompanies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.nameEn}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
              </FieldGroup>
              <div className="flex flex-col gap-3">
                {[...db.partnerCompanies]
                  .map((partner) => ({
                    partner,
                    predicted: matchingDelegation
                      ? scoreMatch({ delegation: matchingDelegation, partner })
                          .score
                      : null,
                  }))
                  .sort((a, b) => (b.predicted ?? 0) - (a.predicted ?? 0))
                  .map(({ partner, predicted }) => (
                    <div
                      key={partner.id}
                      className="flex items-center justify-between gap-3 rounded-md border p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {partner.nameEn}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {partner.sector} · {partner.type}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {predicted !== null ? (
                          <Badge
                            variant={
                              predicted >= 70
                                ? "default"
                                : predicted >= 45
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {predicted}% {textFor(locale, "fit", "匹配")}
                          </Badge>
                        ) : null}
                        <Button
                          variant="outline"
                          onClick={() => addMatch(partner.id)}
                        >
                          {textFor(locale, "Assign", "分配")}
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>
                {textFor(locale, "Match status", "配对状态")}
              </CardTitle>
              <CardDescription>
                {textFor(
                  locale,
                  "Both parties accept before a session is scheduled.",
                  "双方接受后才会安排会议。"
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MatchTable
                db={db}
                matches={db.matches}
                onCreateProvider={createProviderMeeting}
                locale={locale}
              />
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="meetings" className="min-w-0">
        <Card>
          <CardHeader className="gap-3 sm:flex sm:flex-row sm:items-start sm:justify-between">
            <div className="grid gap-1.5">
              <CardTitle>
                {textFor(locale, "Meeting operations", "会议运营")}
              </CardTitle>
              <CardDescription>
                {textFor(
                  locale,
                  "Monitor every tenant meeting, provider readiness, calendar slot and interpreter assignment.",
                  "集中监控租户内所有会议、平台就绪状态、日历时段与翻译分配。"
                )}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <ManualMeetingDialog
                db={db}
                locale={locale}
                onCreate={createManualMeeting}
              />
              <Button
                className="sm:shrink-0"
                variant="outline"
                onClick={() => setActiveTab("meeting-settings")}
              >
                <Icon icon={SecurityCheckIcon} inline="inline-start" />
                {textFor(locale, "Meeting settings", "会议设置")}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <MeetingProviderStatusStrip
              readiness={meetingProviderReadiness}
              locale={locale}
            />
            <MeetingCalendarView
              db={db}
              meetings={db.meetings}
              onUpdateMeeting={updateMeeting}
              locale={locale}
            />
            <Separator />
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold">
                  {textFor(locale, "All meetings", "全部会议")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {textFor(
                    locale,
                    "The complete tenant-scoped meeting list, including completed and cancelled sessions.",
                    "租户范围内的完整会议清单，包括已完成与已取消的会议。"
                  )}
                </p>
              </div>
              <Badge variant="outline">
                {db.meetings.length} {textFor(locale, "total", "场")}
              </Badge>
            </div>
            <SessionList
              db={db}
              meetings={db.meetings}
              onComplete={completeMeeting}
              onAssignInterpreter={assignMeetingInterpreter}
              onUpdateMeeting={updateMeeting}
              locale={locale}
            />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="meeting-settings" className="min-w-0">
        <MeetingSettings
          readiness={meetingProviderReadiness}
          locale={locale}
          onBack={() => setActiveTab("meetings")}
        />
      </TabsContent>

      <TabsContent value="interpreters" className="min-w-0">
        <InterpreterManagement
          db={db}
          locale={locale}
          onCreate={createInterpreter}
          onUpdate={updateInterpreter}
          onDelete={deleteInterpreter}
        />
      </TabsContent>

      <TabsContent value="signing" className="min-w-0">
        <Card>
          <CardHeader>
            <CardTitle>
              {textFor(locale, "Signing tracker", "签约追踪")}
            </CardTitle>
            <CardDescription>
              {textFor(
                locale,
                "Track MOU status, document availability and signatory checks.",
                "追踪 MOU 状态、文件可用性与签署人核验。"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DealTable
              db={db}
              deals={db.deals}
              onCreateDeal={createDeal}
              onDeal={updateDeal}
              onRefresh={refreshDeals}
              locale={locale}
            />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="communications" className="min-w-0">
        <CommunicationsPanel
          db={db}
          onSendAnnouncement={sendAnnouncement}
          locale={locale}
        />
      </TabsContent>

      <TabsContent value="resources" className="min-w-0">
        <ResourcesPanel
          db={db}
          onCreateResource={createResource}
          onUploadResource={uploadResource}
          onToggleVisibility={toggleResourceVisibility}
          locale={locale}
        />
      </TabsContent>

      <TabsContent value="onsite" className="min-w-0">
        <div className="grid gap-4 lg:grid-cols-2">
          <CheckInBoard db={db} onCheckIn={checkInPartner} locale={locale} />
          <ItineraryBoard
            db={db}
            onPublish={publishItinerary}
            locale={locale}
          />
          <SiteVisitBoard db={db} locale={locale} />
          <LiaisonBoard db={db} locale={locale} />
        </div>
      </TabsContent>

      <TabsContent value="reports" className="min-w-0">
        <ReportsPanel db={db} metrics={metrics} locale={locale} />
      </TabsContent>
    </Tabs>
  )
}

function DelegationPortal(props: {
  company: DelegationCompany
  dashboardHeader: React.ReactNode
  role: PortalRole
  locale: Locale
  session: PortalSession
  logout: () => void
  initialSection?: string
  matches: Match[]
  meetings: Meeting[]
  db: LocalDb
  updateMatchStatus: (matchId: string, status: MatchStatus) => void
  scheduleMeeting: (
    match: Match,
    requestedSlots?: string[],
    requestedInterpreterId?: string | null
  ) => void
  updateCompanyProfile: (
    kind: "delegation" | "partner",
    id: string,
    profile: CompanyRegistrationProfile
  ) => void
}) {
  const {
    company,
    dashboardHeader,
    role,
    locale,
    session,
    logout,
    initialSection,
    matches,
    meetings,
    db,
    updateMatchStatus,
    scheduleMeeting,
    updateCompanyProfile,
  } = props

  return (
    <PortalTabs
      profileLabel={getUiCopy(locale).companyProfile}
      role={role}
      locale={locale}
      session={session}
      logout={logout}
      initialSection={initialSection}
      dashboard={
        <div className="flex flex-col gap-4">
          {dashboardHeader}
          <UserDashboard
            title={`Welcome, ${company.nameEn}`}
            subtitle={`${company.nameCn} · Coordinator: ${company.coordinator}`}
            profileComplete={company.profileComplete}
            matchSummary={`${matches.filter((match) => ["Accepted", "Session Scheduled"].includes(match.status)).length} of 2 matches confirmed`}
            nextMeeting={meetings[0]}
            db={db}
          />
        </div>
      }
      profile={
        <ProfileForm
          key={company.id}
          company={company}
          onSave={(profile) =>
            updateCompanyProfile("delegation", company.id, profile)
          }
        />
      }
      matches={
        <UserMatches
          db={db}
          matches={matches}
          perspective="delegation"
          onStatus={updateMatchStatus}
          onSchedule={scheduleMeeting}
          locale={locale}
        />
      }
      meetings={<UserMeetings db={db} meetings={meetings} />}
      signing={<UserSigning db={db} matches={matches} />}
      onsite={<UserItinerary db={db} />}
    />
  )
}

function PartnerPortal(props: {
  company: PartnerCompany
  dashboardHeader: React.ReactNode
  role: PortalRole
  locale: Locale
  session: PortalSession
  logout: () => void
  initialSection?: string
  matches: Match[]
  meetings: Meeting[]
  db: LocalDb
  updateMatchStatus: (matchId: string, status: MatchStatus) => void
  scheduleMeeting: (
    match: Match,
    requestedSlots?: string[],
    requestedInterpreterId?: string | null
  ) => void
  updateCompanyProfile: (
    kind: "delegation" | "partner",
    id: string,
    profile: CompanyRegistrationProfile
  ) => void
  confirmAttendance: (partnerId: string) => void
}) {
  const {
    company,
    dashboardHeader,
    role,
    locale,
    session,
    logout,
    initialSection,
    matches,
    meetings,
    db,
    updateMatchStatus,
    scheduleMeeting,
    updateCompanyProfile,
    confirmAttendance,
  } = props

  return (
    <PortalTabs
      profileLabel={getUiCopy(locale).partnerProfile}
      role={role}
      locale={locale}
      session={session}
      logout={logout}
      initialSection={initialSection}
      dashboard={
        <div className="flex flex-col gap-4">
          {dashboardHeader}
          <UserDashboard
            title={`Welcome, ${company.nameEn}`}
            subtitle={`${company.nameCn} · ${company.contact}`}
            profileComplete={company.profileComplete}
            matchSummary={`${matches.length} matched delegation companies`}
            nextMeeting={meetings[0]}
            db={db}
            attendance={
              <AttendanceCard
                company={company}
                onConfirm={() => confirmAttendance(company.id)}
              />
            }
          />
        </div>
      }
      profile={
        <ProfileForm
          key={company.id}
          company={company}
          onSave={(profile) =>
            updateCompanyProfile("partner", company.id, profile)
          }
        />
      }
      matches={
        <UserMatches
          db={db}
          matches={matches}
          perspective="partner"
          onStatus={updateMatchStatus}
          onSchedule={scheduleMeeting}
          locale={locale}
        />
      }
      meetings={<UserMeetings db={db} meetings={meetings} />}
      signing={<UserSigning db={db} matches={matches} />}
      onsite={
        <AttendanceCard
          company={company}
          onConfirm={() => confirmAttendance(company.id)}
        />
      }
    />
  )
}

function PortalTabs({
  dashboard,
  profile,
  matches,
  meetings,
  signing,
  onsite,
  profileLabel,
  role,
  locale,
  session,
  logout,
  initialSection,
}: {
  dashboard: React.ReactNode
  profile: React.ReactNode
  matches: React.ReactNode
  meetings: React.ReactNode
  signing: React.ReactNode
  onsite: React.ReactNode
  profileLabel: string
  role: PortalRole
  locale: Locale
  session: PortalSession
  logout: () => void
  initialSection?: string
}) {
  const items = portalTabItems(locale, profileLabel)
  const validSections = items.map((item) => item.value)
  const [activeTab, setActiveTab] = useState(
    initialSection && validSections.includes(initialSection)
      ? initialSection
      : "dashboard"
  )

  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      orientation="vertical"
      className="flex-col gap-4 lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start"
    >
      <ResponsiveTabsNav
        items={items}
        activeValue={activeTab}
        onValueChange={setActiveTab}
        role={role}
        locale={locale}
        session={session}
        logout={logout}
      />
      <TabsContent value="dashboard" className="min-w-0">
        {dashboard}
      </TabsContent>
      <TabsContent value="profile" className="min-w-0">
        {profile}
      </TabsContent>
      <TabsContent value="matches" className="min-w-0">
        {matches}
      </TabsContent>
      <TabsContent value="meetings" className="min-w-0">
        {meetings}
      </TabsContent>
      <TabsContent value="signing" className="min-w-0">
        {signing}
      </TabsContent>
      <TabsContent value="onsite" className="min-w-0">
        {onsite}
      </TabsContent>
    </Tabs>
  )
}

function TenantWorkspaceBrand({
  session,
  subtitle,
  testId,
  prominence = "compact",
}: {
  session: PortalSession
  subtitle: string
  testId: string
  prominence?: "compact" | "mobile" | "sheet"
}) {
  const workspaceName = session.tenantName?.trim() || "Plexus Connect"
  const large = prominence !== "compact"

  return (
    <div className="flex min-w-0 items-center gap-3" data-testid={testId}>
      <Avatar
        className={cn(
          "shrink-0 rounded-md border border-sidebar-border bg-background",
          large ? "size-10" : "size-8"
        )}
      >
        {session.tenantLogoUrl ? (
          <AvatarImage
            src={session.tenantLogoUrl}
            alt={`${workspaceName} workspace logo`}
            className="rounded-md bg-background object-contain p-1"
          />
        ) : null}
        <AvatarFallback className="rounded-md text-[0.625rem] font-semibold">
          {getInitials(workspaceName)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate font-semibold text-sidebar-foreground",
            prominence === "sheet"
              ? "text-base"
              : prominence === "mobile"
                ? "text-sm"
                : "text-xs"
          )}
        >
          {workspaceName}
        </p>
        <p
          className={cn(
            "mt-0.5 truncate text-muted-foreground",
            large ? "text-sm" : "text-xs"
          )}
        >
          {subtitle}
        </p>
      </div>
    </div>
  )
}

function ResponsiveTabsNav({
  items,
  externalItems = [],
  activeValue,
  activeExternalHref,
  itemHref,
  onValueChange,
  role,
  locale,
  session,
  logout,
}: {
  items: NavItem[]
  externalItems?: ExternalNavItem[]
  activeValue?: string
  activeExternalHref?: string
  itemHref?: (value: string) => string
  onValueChange?: (value: string) => void
  role: PortalRole
  locale: Locale
  session: PortalSession
  logout: () => void
}) {
  const t = getUiCopy(locale)
  const navTriggerClass =
    "h-10 w-full justify-start gap-2 rounded-md px-3 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-sidebar-ring/45 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=active]:hover:bg-primary"
  const mobileNavTriggerClass =
    "h-12 w-full flex-none shrink-0 justify-start gap-3 rounded-lg px-4 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-sidebar-ring/45 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=active]:hover:bg-primary"
  const childTriggerClass =
    "h-8 w-full justify-start gap-2 rounded-md px-3 pl-8 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[state=active]:bg-sidebar-accent data-[state=active]:text-sidebar-accent-foreground data-[state=active]:shadow-none"
  const mobileChildTriggerClass =
    "h-12 w-full flex-none shrink-0 justify-start gap-3 rounded-lg px-4 pl-12 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[state=active]:bg-sidebar-accent data-[state=active]:text-sidebar-accent-foreground data-[state=active]:shadow-none"
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const activeLabel =
    items
      .flatMap((item) => [
        { value: item.value, label: item.label },
        ...(item.children ?? []),
      ])
      .find((item) => item.value === activeValue)?.label ??
    externalItems.find((item) => item.href === activeExternalHref)?.label ??
    items[0]?.label ??
    t.navigation

  function isGroupOpen(item: NavItem) {
    const isActive =
      item.children?.some((child) => child.value === activeValue) ?? false
    return openGroups[item.value] ?? isActive
  }

  function renderNavItems(
    onNavigate?: () => void,
    surface: "desktop" | "mobile" = "desktop"
  ) {
    const isMobile = surface === "mobile"
    const triggerClass = isMobile ? mobileNavTriggerClass : navTriggerClass
    const nestedTriggerClass = isMobile
      ? mobileChildTriggerClass
      : childTriggerClass
    const iconClass = isMobile ? "size-5" : "size-4"
    const childIconClass = isMobile ? "size-[1.125rem]" : "size-3.5"

    return items.map((item) => {
      if (!item.children) {
        if (itemHref) {
          return (
            <Button
              key={item.value}
              asChild
              variant="ghost"
              data-state={item.value === activeValue ? "active" : "inactive"}
              className={cn(
                triggerClass,
                isMobile ? "text-sm font-medium" : "text-xs font-medium"
              )}
            >
              <Link href={itemHref(item.value)} onClick={onNavigate}>
                <HugeiconsIcon
                  icon={item.icon}
                  strokeWidth={1.7}
                  className={iconClass}
                />
                {item.label}
              </Link>
            </Button>
          )
        }

        return (
          <TabsTrigger
            key={item.value}
            value={item.value}
            className={triggerClass}
            onClick={() => {
              onValueChange?.(item.value)
              onNavigate?.()
            }}
          >
            <HugeiconsIcon
              icon={item.icon}
              strokeWidth={1.7}
              className={iconClass}
            />
            {item.label}
          </TabsTrigger>
        )
      }

      const groupOpen = isGroupOpen(item)
      const childActive = item.children.some(
        (child) => child.value === activeValue
      )

      return (
        <div key={item.value} className="flex flex-col gap-1">
          <button
            type="button"
            aria-expanded={groupOpen}
            data-state={childActive ? "active" : "inactive"}
            className={cn(
              "relative inline-flex flex-1 items-center border border-transparent py-0.5 font-medium whitespace-nowrap transition-all outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
              isMobile ? "text-sm" : "text-xs",
              triggerClass
            )}
            onClick={() =>
              setOpenGroups((current) => ({
                ...current,
                [item.value]: !groupOpen,
              }))
            }
          >
            <HugeiconsIcon
              icon={item.icon}
              strokeWidth={1.7}
              className={iconClass}
            />
            <span className="min-w-0 flex-1 text-left">{item.label}</span>
            <HugeiconsIcon
              icon={ArrowDown01Icon}
              strokeWidth={1.7}
              className={cn(
                isMobile
                  ? "size-4 transition-transform"
                  : "size-3.5 transition-transform",
                groupOpen ? "rotate-180" : ""
              )}
            />
          </button>
          {groupOpen ? (
            <div className="flex flex-col gap-1">
              {item.children.map((child) =>
                itemHref ? (
                  <Button
                    key={child.value}
                    asChild
                    variant="ghost"
                    data-state={
                      child.value === activeValue ? "active" : "inactive"
                    }
                    className={cn(
                      nestedTriggerClass,
                      isMobile ? "text-sm font-medium" : "text-xs font-medium"
                    )}
                  >
                    <Link href={itemHref(child.value)} onClick={onNavigate}>
                      <HugeiconsIcon
                        icon={child.icon}
                        strokeWidth={1.7}
                        className={childIconClass}
                      />
                      {child.label}
                    </Link>
                  </Button>
                ) : (
                  <TabsTrigger
                    key={child.value}
                    value={child.value}
                    className={nestedTriggerClass}
                    onClick={() => {
                      onValueChange?.(child.value)
                      onNavigate?.()
                    }}
                  >
                    <HugeiconsIcon
                      icon={child.icon}
                      strokeWidth={1.7}
                      className={childIconClass}
                    />
                    {child.label}
                  </TabsTrigger>
                )
              )}
            </div>
          ) : null}
        </div>
      )
    })
  }

  function renderExternalItems(
    onNavigate?: () => void,
    surface: "desktop" | "mobile" = "desktop"
  ) {
    const isMobile = surface === "mobile"

    return externalItems.map((item) => (
      <Button
        key={item.href}
        asChild
        variant="ghost"
        data-state={item.href === activeExternalHref ? "active" : "inactive"}
        className={cn(
          isMobile ? mobileNavTriggerClass : navTriggerClass,
          isMobile ? "text-sm font-medium" : "text-xs font-medium"
        )}
      >
        <Link href={item.href} onClick={onNavigate}>
          <HugeiconsIcon
            icon={item.icon}
            strokeWidth={1.7}
            className={isMobile ? "size-5" : "size-4"}
          />
          {item.label}
        </Link>
      </Button>
    ))
  }

  return (
    <>
      <aside className="hidden self-stretch lg:block">
        <div className="sticky top-4 flex min-h-[calc(100svh-12rem)] flex-col rounded-lg border border-sidebar-border bg-sidebar p-3 text-sidebar-foreground shadow-sm">
          <div className="mb-3 rounded-md border border-sidebar-border bg-background/70 px-3 py-2">
            <TenantWorkspaceBrand
              session={session}
              subtitle={t.workspaceSubtitle}
              testId="tenant-workspace-brand-desktop"
            />
          </div>
          {itemHref ? (
            <nav
              aria-label={t.navigation}
              className="flex h-auto w-full flex-col items-stretch gap-1"
            >
              {renderNavItems()}
            </nav>
          ) : (
            <TabsList className="h-auto w-full flex-col items-stretch gap-1 bg-transparent p-0">
              {renderNavItems()}
            </TabsList>
          )}
          {externalItems.length ? (
            <div className="mt-1 flex flex-col gap-1 border-t border-sidebar-border pt-2">
              {renderExternalItems()}
            </div>
          ) : null}
          <SidebarUserAccount
            role={role}
            locale={locale}
            session={session}
            logout={logout}
          />
        </div>
      </aside>
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <div className="sticky top-3 z-30 flex min-h-16 items-center gap-3 rounded-lg border border-sidebar-border bg-sidebar/95 p-2.5 text-sidebar-foreground shadow-sm backdrop-blur-sm lg:hidden">
          <div className="min-w-0 flex-1 px-1.5">
            <TenantWorkspaceBrand
              session={session}
              subtitle={activeLabel}
              testId="tenant-workspace-brand-mobile"
              prominence="mobile"
            />
          </div>
          <SheetTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-11 shrink-0 gap-2 border-sidebar-border bg-background/80 px-3.5 text-sm text-sidebar-foreground"
              aria-label={`${t.menu}: ${activeLabel}`}
            >
              <HugeiconsIcon
                icon={Menu01Icon}
                strokeWidth={1.8}
                className="size-4"
              />
              {t.menu}
            </Button>
          </SheetTrigger>
        </div>
        <SheetContent
          side="left"
          className="border-sidebar-border bg-sidebar p-0 text-sidebar-foreground data-[side=left]:w-[calc(100vw-1.5rem)] data-[side=left]:max-w-[24rem]"
        >
          <SheetHeader className="border-b border-sidebar-border px-5 py-5">
            <SheetTitle className="sr-only">
              {session.tenantName?.trim() || "Plexus Connect"}
            </SheetTitle>
            <SheetDescription asChild>
              <TenantWorkspaceBrand
                session={session}
                subtitle={t.workspaceSubtitle}
                testId="tenant-workspace-brand-sheet"
                prominence="sheet"
              />
            </SheetDescription>
          </SheetHeader>
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
              <p className="mb-2.5 px-4 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {t.navigation}
              </p>
              {itemHref ? (
                <nav
                  aria-label={t.navigation}
                  className="flex h-auto w-full flex-col items-stretch gap-1.5"
                >
                  {renderNavItems(() => setMobileNavOpen(false), "mobile")}
                </nav>
              ) : (
                <TabsList className="h-auto w-full flex-col items-stretch gap-1.5 bg-transparent p-0">
                  {renderNavItems(() => setMobileNavOpen(false), "mobile")}
                </TabsList>
              )}
              {externalItems.length ? (
                <div className="mt-3 flex flex-col gap-1.5 border-t border-sidebar-border pt-3">
                  {renderExternalItems(() => setMobileNavOpen(false), "mobile")}
                </div>
              ) : null}
            </div>
            <div className="border-t border-sidebar-border p-3 pt-0">
              <SidebarUserAccount
                role={role}
                locale={locale}
                session={session}
                logout={logout}
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

export function AdminWorkspaceRouteNavigation({
  locale,
  session,
  activeHref,
}: {
  locale: Locale
  session: PortalSession
  activeHref: string
}) {
  const router = useRouter()
  const copy = getUiCopy(locale)

  async function logout() {
    const result = await logoutAction(locale)
    router.push(result.redirectTo)
  }

  return (
    <ResponsiveTabsNav
      items={adminTabItems(locale)}
      externalItems={[
        {
          href: `/${locale}/admin/vendors`,
          label: copy.vendorAccounts,
          icon: UserAccountIcon,
        },
        {
          href: `/${locale}/compliance`,
          label: copy.compliance,
          icon: SecurityCheckIcon,
        },
      ]}
      itemHref={(value) => `/${locale}/admin?section=${value}`}
      activeExternalHref={activeHref}
      role="admin"
      locale={locale}
      session={session}
      logout={logout}
    />
  )
}

export function VendorWorkspaceRouteNavigation({
  locale,
  session,
  activeSection,
}: {
  locale: Locale
  session: PortalSession
  activeSection: string
}) {
  const router = useRouter()
  const profileLabel =
    session.vendorType === "partner"
      ? getUiCopy(locale).partnerProfile
      : getUiCopy(locale).companyProfile

  async function logout() {
    const result = await logoutAction(locale)
    router.push(result.redirectTo)
  }

  return (
    <ResponsiveTabsNav
      items={portalTabItems(locale, profileLabel)}
      itemHref={(value) => `/${locale}/vendor?section=${value}`}
      activeValue={activeSection}
      role={session.vendorType ?? "delegation"}
      locale={locale}
      session={session}
      logout={logout}
    />
  )
}

function SidebarUserAccount({
  role,
  locale,
  session,
  logout,
}: {
  role: PortalRole
  locale: Locale
  session: PortalSession
  logout: () => void
}) {
  const t = getUiCopy(locale)
  const router = useRouter()
  const [section, setSection] = useState<"profile" | "branding" | "access">(
    "profile"
  )
  const [displayName, setDisplayName] = useState(session.displayName)
  const [savingProfile, startProfileTransition] = useTransition()
  const currentRoleLink = roleLinks.find((item) => item.role === role)
  const workspaceRoute = session.role
  const roleLabel = currentRoleLink
    ? localizedLabel(currentRoleLink.label, locale)
    : session.role
  const workspaceName = session.tenantName ?? "Plexus"
  const canManageBranding = session.role === "admin" && Boolean(session.adminId)
  const accountSections = [
    {
      value: "profile" as const,
      label: t.profileSection,
      description: "Name and workspace",
      icon: UserAccountIcon,
      visible: true,
    },
    {
      value: "branding" as const,
      label: t.brandingSection,
      description: "Login and identity",
      icon: PaintBoardIcon,
      visible: canManageBranding,
    },
    {
      value: "access" as const,
      label: t.accessSection,
      description: "Security and session",
      icon: SecurityCheckIcon,
      visible: true,
    },
  ].filter((item) => item.visible)

  function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)

    startProfileTransition(async () => {
      const result = await updateOwnProfileAction({
        displayName: form.get("displayName"),
        locale,
      })

      if (!result.ok || !result.displayName) {
        toast.error(result.error ?? "Unable to update your profile.")
        return
      }

      setDisplayName(result.displayName)
      toast.success("Profile name updated.")
      router.refresh()
    })
  }

  return (
    <Dialog
      onOpenChange={(open) => {
        if (open) {
          setSection("profile")
          setDisplayName(session.displayName)
        }
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          className="mt-3 flex min-h-14 w-full items-center gap-3 rounded-lg border border-sidebar-border bg-background/80 px-3.5 py-3 text-left shadow-xs transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring/45 focus-visible:outline-none lg:mt-auto lg:min-h-0 lg:rounded-md lg:px-3 lg:py-2.5"
        >
          <Avatar className="size-9 lg:size-8">
            {session.tenantLogoUrl ? (
              <AvatarImage
                src={session.tenantLogoUrl}
                alt={`${workspaceName} workspace logo`}
                className="bg-background object-contain p-1"
              />
            ) : null}
            <AvatarFallback className="text-xs">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-sidebar-foreground lg:text-xs">
              {displayName}
            </span>
            <span className="block truncate text-sm text-muted-foreground lg:text-xs">
              {roleLabel} {t.account}
            </span>
          </span>
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            strokeWidth={1.7}
            className="size-3.5 text-muted-foreground"
          />
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100svh-2rem)] gap-0 overflow-hidden p-0 sm:max-w-4xl">
        <DialogHeader className="border-b px-5 py-4 pr-12 sm:px-6 sm:py-5">
          <DialogTitle className="text-base">{t.userProfile}</DialogTitle>
          <DialogDescription>{t.userProfileDescription}</DialogDescription>
        </DialogHeader>
        <div className="grid min-h-0 overflow-hidden sm:grid-cols-[13rem_minmax(0,1fr)]">
          <aside className="border-b bg-muted/20 p-3 sm:border-r sm:border-b-0 sm:p-4">
            <div className="mb-3 hidden items-center gap-3 rounded-lg border bg-background/80 p-3 sm:flex">
              <Avatar className="size-9" data-testid="account-brand-avatar">
                {session.tenantLogoUrl ? (
                  <AvatarImage
                    src={session.tenantLogoUrl}
                    alt={`${workspaceName} workspace logo`}
                    className="bg-background object-contain p-1"
                  />
                ) : null}
                <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold">{displayName}</p>
                <p className="truncate text-[0.6875rem] text-muted-foreground">
                  {workspaceName}
                </p>
              </div>
            </div>
            <nav
              aria-label="Account settings"
              className={cn(
                "grid gap-1",
                accountSections.length === 3
                  ? "grid-cols-3 sm:grid-cols-1"
                  : "grid-cols-2 sm:grid-cols-1"
              )}
            >
              {accountSections.map((item) => {
                const selected = section === item.value

                return (
                  <button
                    key={item.value}
                    type="button"
                    aria-current={selected ? "page" : undefined}
                    onClick={() => setSection(item.value)}
                    className={cn(
                      "flex min-w-0 items-center justify-center gap-2 rounded-md px-2.5 py-2 text-left transition-colors sm:justify-start sm:px-3",
                      selected
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <HugeiconsIcon
                      icon={item.icon}
                      strokeWidth={1.8}
                      className="size-4 shrink-0"
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-medium">
                        {item.label}
                      </span>
                      <span
                        className={cn(
                          "hidden truncate text-[0.625rem] sm:block",
                          selected
                            ? "text-primary-foreground/75"
                            : "text-muted-foreground"
                        )}
                      >
                        {item.description}
                      </span>
                    </span>
                  </button>
                )
              })}
            </nav>
          </aside>
          <div className="min-h-0 overflow-y-auto">
            {section === "profile" ? (
              <section className="grid gap-5 p-5 sm:p-6">
                <div>
                  <h3 className="font-heading text-sm font-medium">
                    {t.personalDetails}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t.personalDetailsDescription}
                  </p>
                </div>
                <form className="grid gap-4" onSubmit={saveProfile}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="grid gap-1.5">
                      <label
                        htmlFor="accountDisplayName"
                        className="text-xs font-medium"
                      >
                        {t.displayName}
                      </label>
                      <Input
                        id="accountDisplayName"
                        name="displayName"
                        defaultValue={displayName}
                        minLength={2}
                        maxLength={120}
                        required
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <label
                        htmlFor="accountLoginEmail"
                        className="text-xs font-medium"
                      >
                        {t.loginEmail}
                      </label>
                      <Input
                        id="accountLoginEmail"
                        value={session.email}
                        readOnly
                        aria-describedby="accountLoginEmailDescription"
                      />
                      <p
                        id="accountLoginEmailDescription"
                        className="text-[0.6875rem] text-muted-foreground"
                      >
                        Used for sign-in and password recovery.
                      </p>
                    </div>
                  </div>
                  <div className="rounded-lg border bg-muted/25 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium">
                          {t.workspaceIdentity}
                        </p>
                        <p className="mt-1 text-sm font-semibold">
                          {workspaceName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {roleLabel} workspace account
                        </p>
                      </div>
                      <Badge variant="outline" className="gap-1.5">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        Active
                      </Badge>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" disabled={savingProfile}>
                      <HugeiconsIcon icon={SaveIcon} data-icon="inline-start" />
                      {savingProfile ? t.saving : t.saveProfile}
                    </Button>
                  </div>
                </form>
              </section>
            ) : null}

            {section === "branding" && canManageBranding && session.adminId ? (
              <section className="grid gap-5 p-5 sm:p-6">
                <div>
                  <h3 className="font-heading text-sm font-medium">
                    White-label workspace
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Control the public name, support contact, logo, and primary
                    color shown on your tenant login.
                  </p>
                </div>
                <TenantProfileForm
                  locale={locale}
                  tenantId={session.adminId}
                  initialName={session.tenantName}
                  initialSupportEmail={session.tenantSupportEmail}
                  initialPrimaryColor={session.tenantPrimaryColor}
                  initialLogoUrl={session.tenantLogoUrl}
                />
              </section>
            ) : null}

            {section === "access" ? (
              <section className="grid gap-5 p-5 sm:p-6">
                <div>
                  <h3 className="font-heading text-sm font-medium">
                    {t.accessAndSecurity}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t.accessAndSecurityDescription}
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoTile label="Account role" value={roleLabel} />
                  <InfoTile label="Workspace" value={workspaceName} />
                </div>
                <Separator />
                <div className="grid gap-2">
                  <p className="text-xs font-medium">{t.language}</p>
                  <ToggleGroup
                    type="single"
                    value={locale}
                    variant="outline"
                    size="sm"
                    aria-label={t.language}
                    className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4"
                  >
                    {protectedPortalLocales.map((item) => (
                      <ToggleGroupItem
                        key={item}
                        value={item}
                        asChild
                        className="w-full"
                      >
                        <Link href={`/${item}/${workspaceRoute}`}>
                          {localeLabels[item]}
                        </Link>
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>
                <div className="rounded-lg border bg-muted/25 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-background">
                      <HugeiconsIcon icon={ShieldUserIcon} className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium">Password security</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Your account is protected. Recovery sends a verified,
                        single-use link to your login email.
                      </p>
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="mt-3"
                      >
                        <Link href={`/${locale}/forgot-password`}>
                          Send password recovery
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-between">
                  <Button variant="outline" onClick={logout}>
                    <HugeiconsIcon
                      icon={Logout01Icon}
                      data-icon="inline-start"
                    />
                    {t.logout}
                  </Button>
                  <Button asChild>
                    <Link href={`/${locale}/${workspaceRoute}`}>
                      {t.openRolePage.replace("{role}", roleLabel)}
                    </Link>
                  </Button>
                </div>
              </section>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function UserDashboard({
  title,
  subtitle,
  profileComplete,
  matchSummary,
  nextMeeting,
  db,
  attendance,
}: {
  title: string
  subtitle: string
  profileComplete: number
  matchSummary: string
  nextMeeting?: Meeting
  db: LocalDb
  attendance?: React.ReactNode
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{subtitle}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <InfoTile label="Profile" value={`${profileComplete}%`} />
            <InfoTile label="Match status" value={matchSummary} />
            <InfoTile label="MOU status" value="In progress" />
          </div>
          <Progress value={profileComplete} />
          {nextMeeting ? (
            <div className="rounded-md border p-4">
              <p className="text-sm font-medium">Next session</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatDateTime(nextMeeting.startsAt)} · {nextMeeting.platform}{" "}
                · {nextMeeting.interpreter}
              </p>
              {nextMeeting.link ? (
                <Button className="mt-3" asChild>
                  <a href={nextMeeting.link} target="_blank" rel="noreferrer">
                    <Icon icon={CameraVideoIcon} inline="inline-start" />
                    Join meeting
                  </a>
                </Button>
              ) : (
                <Button className="mt-3" disabled>
                  <Icon icon={CameraVideoIcon} inline="inline-start" />
                  Awaiting secure link
                </Button>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>
      {attendance ?? <UserItinerary db={db} compact />}
    </div>
  )
}

const vendorProfileSections = [
  "company",
  "contact",
  "industry",
  "profile",
  "offer",
  "looking-for",
  "preferences",
  "needs",
  "export",
  "meeting",
  "documents",
  "consent",
] as const

type VendorProfileSectionId = (typeof vendorProfileSections)[number]

const profileFieldSections: Partial<
  Record<keyof CompanyRegistrationProfile, VendorProfileSectionId>
> = {
  companyNameEn: "company",
  companyNameCn: "company",
  countryRegion: "company",
  countryOther: "company",
  yearEstablished: "company",
  registrationNumber: "company",
  website: "company",
  address: "company",
  contactName: "contact",
  contactPosition: "contact",
  contactEmail: "contact",
  mobileNumber: "contact",
  chatId: "contact",
  introduction: "profile",
  productsServices: "profile",
  industryOther: "industry",
  certificationOther: "profile",
  offerOther: "offer",
  lookingForOther: "looking-for",
  preferredPartnerOther: "preferences",
  idealPartner: "needs",
  opportunity: "needs",
  exportMarkets: "export",
  availableMeetingDates: "meeting",
  consentName: "consent",
  consentDate: "consent",
}

function ProfileForm({
  company,
  onSave,
}: {
  company: DelegationCompany | PartnerCompany
  onSave: (profile: CompanyRegistrationProfile) => void
}) {
  const [profile, setProfile] = useState(() => getRegistrationProfile(company))
  const [openSections, setOpenSections] = useState<Set<VendorProfileSectionId>>(
    () => new Set(vendorProfileSections)
  )
  const [touchedFields, setTouchedFields] = useState<
    Set<keyof CompanyRegistrationProfile>
  >(() => new Set())
  const [validationRequested, setValidationRequested] = useState(false)
  const [profileDocuments, setProfileDocuments] = useState<
    VendorProfileDocument[]
  >([])
  const [documentsLoading, setDocumentsLoading] = useState(true)
  const [documentUploading, setDocumentUploading] = useState(false)
  const [deletingDocumentId, setDeletingDocumentId] = useState<string>()
  const documentInputRef = useRef<HTMLInputElement>(null)
  const validationErrors = validateCompanyRegistrationProfile(profile)
  const completion = getCompanyProfileCompletion(profile)
  const sectionCompletion = getCompanyProfileSectionCompletion(profile)
  const introductionWords = profile.introduction.trim()
    ? profile.introduction.trim().split(/\s+/).length
    : 0

  useEffect(() => {
    const controller = new AbortController()

    async function loadProfileDocuments() {
      setDocumentsLoading(true)

      try {
        const response = await fetch("/api/vendor/profile-documents", {
          signal: controller.signal,
        })
        const payload = (await response.json()) as {
          documents?: VendorProfileDocument[]
          error?: string
        }

        if (!response.ok || !payload.documents) {
          throw new Error(payload.error ?? "Profile documents could not load.")
        }

        setProfileDocuments(payload.documents)
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return
        }

        toast.error(
          error instanceof Error
            ? error.message
            : "Profile documents could not load."
        )
      } finally {
        if (!controller.signal.aborted) {
          setDocumentsLoading(false)
        }
      }
    }

    void loadProfileDocuments()

    return () => controller.abort()
  }, [])

  function setValue<K extends keyof CompanyRegistrationProfile>(
    field: K,
    value: CompanyRegistrationProfile[K]
  ) {
    setProfile((current) => ({ ...current, [field]: value }))
  }

  function toggleList(field: keyof CompanyRegistrationProfile, value: string) {
    setProfile((current) => {
      const existing = current[field]

      if (!Array.isArray(existing)) {
        return current
      }

      return {
        ...current,
        [field]: existing.includes(value)
          ? existing.filter((item) => item !== value)
          : [...existing, value],
      }
    })
  }

  function setSectionOpen(section: VendorProfileSectionId, open: boolean) {
    setOpenSections((current) => {
      const next = new Set(current)

      if (open) {
        next.add(section)
      } else {
        next.delete(section)
      }

      return next
    })
  }

  function fieldState(field: keyof CompanyRegistrationProfile) {
    return {
      error:
        validationRequested || touchedFields.has(field)
          ? validationErrors[field]
          : undefined,
      onBlur: () => setTouchedFields((current) => new Set(current).add(field)),
    }
  }

  function saveProfile() {
    const invalidFields = Object.keys(validationErrors) as Array<
      keyof CompanyRegistrationProfile
    >

    if (invalidFields.length) {
      setValidationRequested(true)
      setOpenSections((current) => {
        const next = new Set(current)

        invalidFields.forEach((field) => {
          const section = profileFieldSections[field]

          if (section) {
            next.add(section)
          }
        })

        return next
      })
      toast.error("Check the highlighted profile fields and try again.")
      return
    }

    onSave(profile)
  }

  async function uploadProfileDocument(file?: File) {
    if (!file) {
      return
    }

    setDocumentUploading(true)

    try {
      const formData = new FormData()
      formData.set("file", file)
      const response = await fetch("/api/vendor/profile-documents", {
        method: "POST",
        body: formData,
      })
      const payload = (await response.json()) as {
        document?: VendorProfileDocument
        error?: string
      }

      if (!response.ok || !payload.document) {
        throw new Error(payload.error ?? "The PDF could not be uploaded.")
      }

      setProfileDocuments((current) => [payload.document!, ...current])
      toast.success("PDF uploaded to your private document library.")
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "The PDF could not be uploaded."
      )
    } finally {
      setDocumentUploading(false)

      if (documentInputRef.current) {
        documentInputRef.current.value = ""
      }
    }
  }

  async function deleteProfileDocument(document: VendorProfileDocument) {
    setDeletingDocumentId(document.id)

    try {
      const response = await fetch("/api/vendor/profile-documents", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: document.id }),
      })
      const payload = (await response.json()) as {
        error?: string
      }

      if (!response.ok) {
        throw new Error(payload.error ?? "The PDF could not be deleted.")
      }

      setProfileDocuments((current) =>
        current.filter((item) => item.id !== document.id)
      )
      toast.success("PDF deleted from private storage.")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "The PDF could not be deleted."
      )
    } finally {
      setDeletingDocumentId(undefined)
    }
  }

  return (
    <Card>
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          saveProfile()
        }}
      >
        <CardHeader className="border-b">
          <CardTitle>Macau-Malaysia B2B registration profile</CardTitle>
          <CardDescription>
            Complete your company details to improve matching quality and
            meeting readiness.
          </CardDescription>
          <div
            className="mt-3 rounded-md border bg-muted/35 p-3"
            data-testid="company-profile-completion"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">
                  Company profile completion
                </p>
                <p className="text-xs text-muted-foreground">
                  {completion.completed} of {completion.total} profile items
                  complete
                </p>
              </div>
              <span className="text-lg font-semibold tabular-nums">
                {completion.percentage}%
              </span>
            </div>
            <Progress
              value={completion.percentage}
              className="mt-3"
              aria-label={`Company profile ${completion.percentage}% complete`}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          <ProfileSection
            title="1. Company information"
            collapsible
            progress={sectionCompletion.company}
            open={openSections.has("company")}
            onOpenChange={(open) => setSectionOpen("company", open)}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <ProfileTextField
                id="company-name-en"
                label="Company name (English)"
                required
                maxLength={240}
                value={profile.companyNameEn}
                onChange={(value) => setValue("companyNameEn", value)}
                {...fieldState("companyNameEn")}
              />
              <ProfileTextField
                id="company-name-cn"
                label="Company name (Chinese, if applicable)"
                maxLength={240}
                value={profile.companyNameCn}
                onChange={(value) => setValue("companyNameCn", value)}
                {...fieldState("companyNameCn")}
              />
            </div>
            <ProfileRadioGroup
              label="Country / Region"
              options={profileOptionGroups.countryRegion}
              value={profile.countryRegion}
              onChange={(value) => setValue("countryRegion", value)}
            />
            {profile.countryRegion === "Other" ? (
              <ProfileTextField
                id="country-other"
                label="Other country / region"
                required
                maxLength={120}
                value={profile.countryOther}
                onChange={(value) => setValue("countryOther", value)}
                {...fieldState("countryOther")}
              />
            ) : null}
            <div className="grid gap-4 md:grid-cols-2">
              <ProfileTextField
                id="year-established"
                label="Year established"
                type="number"
                inputMode="numeric"
                min={1800}
                max={Number(getMalaysiaToday().slice(0, 4))}
                placeholder="e.g. 2018"
                value={profile.yearEstablished}
                onChange={(value) => setValue("yearEstablished", value)}
                {...fieldState("yearEstablished")}
              />
              <ProfileTextField
                id="registration-number"
                label="Company registration number"
                maxLength={120}
                value={profile.registrationNumber}
                onChange={(value) => setValue("registrationNumber", value)}
                {...fieldState("registrationNumber")}
              />
              <ProfileTextField
                id="website"
                label="Website"
                type="url"
                inputMode="url"
                autoComplete="url"
                maxLength={240}
                placeholder="https://example.com"
                value={profile.website}
                onChange={(value) => setValue("website", value)}
                {...fieldState("website")}
              />
              <ProfileTextField
                id="address"
                label="Company address"
                autoComplete="street-address"
                maxLength={500}
                value={profile.address}
                onChange={(value) => setValue("address", value)}
                {...fieldState("address")}
              />
            </div>
            <ProfileRadioGroup
              label="Number of employees"
              options={profileOptionGroups.employeeRange}
              value={profile.employeeRange}
              onChange={(value) => setValue("employeeRange", value)}
            />
            <ProfileRadioGroup
              label="Annual revenue range (optional)"
              options={profileOptionGroups.annualRevenueRange}
              value={profile.annualRevenueRange}
              onChange={(value) => setValue("annualRevenueRange", value)}
            />
          </ProfileSection>

          <ProfileSection
            title="2. Contact person"
            collapsible
            progress={sectionCompletion.contact}
            open={openSections.has("contact")}
            onOpenChange={(open) => setSectionOpen("contact", open)}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <ProfileTextField
                id="contact-name"
                label="Name"
                autoComplete="name"
                maxLength={160}
                value={profile.contactName}
                onChange={(value) => setValue("contactName", value)}
                {...fieldState("contactName")}
              />
              <ProfileTextField
                id="contact-position"
                label="Position"
                autoComplete="organization-title"
                maxLength={160}
                value={profile.contactPosition}
                onChange={(value) => setValue("contactPosition", value)}
                {...fieldState("contactPosition")}
              />
              <ProfileTextField
                id="contact-email"
                label="Email"
                type="email"
                inputMode="email"
                autoComplete="email"
                maxLength={254}
                placeholder="name@company.com"
                value={profile.contactEmail}
                onChange={(value) => setValue("contactEmail", value)}
                {...fieldState("contactEmail")}
              />
              <InternationalPhoneField
                id="mobile-number"
                label="Mobile number"
                value={profile.mobileNumber}
                onChange={(value) => setValue("mobileNumber", value)}
                preferredRegion={profile.countryRegion}
                {...fieldState("mobileNumber")}
              />
              <ProfileTextField
                id="chat-id"
                label="WhatsApp / WeChat ID"
                maxLength={120}
                value={profile.chatId}
                onChange={(value) => setValue("chatId", value)}
                {...fieldState("chatId")}
              />
            </div>
            <ProfileCheckboxGroup
              label="Preferred language"
              options={profileOptionGroups.preferredLanguages}
              values={profile.preferredLanguages}
              onToggle={(value) => toggleList("preferredLanguages", value)}
            />
          </ProfileSection>

          <ProfileSection
            title="3. Industry / sector"
            collapsible
            progress={sectionCompletion.industry}
            open={openSections.has("industry")}
            onOpenChange={(open) => setSectionOpen("industry", open)}
          >
            <Field>
              <FieldLabel>Select all applicable</FieldLabel>
              <IndustrySectorMultiCombobox
                id="profile-industries"
                values={profile.industries}
                onToggle={(value) => toggleList("industries", value)}
              />
            </Field>
            <ProfileTextField
              id="industry-other"
              label="Other industry"
              maxLength={160}
              value={profile.industryOther}
              onChange={(value) => setValue("industryOther", value)}
              {...fieldState("industryOther")}
            />
          </ProfileSection>

          <ProfileSection
            title="4. Company profile"
            collapsible
            progress={sectionCompletion.profile}
            open={openSections.has("profile")}
            onOpenChange={(open) => setSectionOpen("profile", open)}
          >
            <ProfileTextareaField
              id="company-introduction"
              label="Brief company introduction (100-200 words)"
              maxLength={3000}
              description={`${introductionWords} words · target 100-200`}
              value={profile.introduction}
              onChange={(value) => setValue("introduction", value)}
              {...fieldState("introduction")}
            />
            <ProfileTextareaField
              id="products-services"
              label="Key products / services"
              maxLength={3000}
              value={profile.productsServices}
              onChange={(value) => setValue("productsServices", value)}
              {...fieldState("productsServices")}
            />
            <ProfileCheckboxGroup
              label="Certifications"
              options={profileOptionGroups.certifications}
              values={profile.certifications}
              onToggle={(value) => toggleList("certifications", value)}
            />
            <ProfileTextField
              id="certification-other"
              label="Other certification"
              maxLength={160}
              value={profile.certificationOther}
              onChange={(value) => setValue("certificationOther", value)}
              {...fieldState("certificationOther")}
            />
          </ProfileSection>

          <ProfileSection
            title="5. What does your company offer?"
            collapsible
            progress={sectionCompletion.offer}
            open={openSections.has("offer")}
            onOpenChange={(open) => setSectionOpen("offer", open)}
          >
            <ProfileCheckboxGroup
              label="Select all that apply"
              options={profileOptionGroups.offers}
              values={profile.offers}
              onToggle={(value) => toggleList("offers", value)}
            />
            <ProfileTextField
              id="offer-other"
              label="Other offer"
              maxLength={160}
              value={profile.offerOther}
              onChange={(value) => setValue("offerOther", value)}
              {...fieldState("offerOther")}
            />
          </ProfileSection>

          <ProfileSection
            title="6. What are you looking for?"
            collapsible
            progress={sectionCompletion["looking-for"]}
            open={openSections.has("looking-for")}
            onOpenChange={(open) => setSectionOpen("looking-for", open)}
          >
            <ProfileCheckboxGroup
              label="Select all that apply"
              options={profileOptionGroups.lookingFor}
              values={profile.lookingFor}
              onToggle={(value) => toggleList("lookingFor", value)}
            />
            <ProfileTextField
              id="looking-for-other"
              label="Other requirement"
              maxLength={160}
              value={profile.lookingForOther}
              onChange={(value) => setValue("lookingForOther", value)}
              {...fieldState("lookingForOther")}
            />
          </ProfileSection>

          <ProfileSection
            title="7. Matchmaking preferences"
            collapsible
            progress={sectionCompletion.preferences}
            open={openSections.has("preferences")}
            onOpenChange={(open) => setSectionOpen("preferences", open)}
          >
            <ProfileCheckboxGroup
              label="Preferred partner type"
              options={profileOptionGroups.preferredPartnerTypes}
              values={profile.preferredPartnerTypes}
              onToggle={(value) => toggleList("preferredPartnerTypes", value)}
            />
            <ProfileTextField
              id="preferred-partner-other"
              label="Other preferred partner type"
              maxLength={160}
              value={profile.preferredPartnerOther}
              onChange={(value) => setValue("preferredPartnerOther", value)}
              {...fieldState("preferredPartnerOther")}
            />
            <ProfileCheckboxGroup
              label="Expected outcome"
              options={profileOptionGroups.expectedOutcomes}
              values={profile.expectedOutcomes}
              onToggle={(value) => toggleList("expectedOutcomes", value)}
            />
          </ProfileSection>

          <ProfileSection
            title="8. Specific business needs"
            collapsible
            progress={sectionCompletion.needs}
            open={openSections.has("needs")}
            onOpenChange={(open) => setSectionOpen("needs", open)}
          >
            <ProfileTextareaField
              id="ideal-partner"
              label="Describe your ideal business partner"
              maxLength={2500}
              value={profile.idealPartner}
              onChange={(value) => setValue("idealPartner", value)}
              {...fieldState("idealPartner")}
            />
            <ProfileTextareaField
              id="opportunity"
              label="Describe the opportunity you wish to discuss"
              maxLength={2500}
              value={profile.opportunity}
              onChange={(value) => setValue("opportunity", value)}
              {...fieldState("opportunity")}
            />
          </ProfileSection>

          <ProfileSection
            title="9. Export / international experience"
            collapsible
            progress={sectionCompletion.export}
            open={openSections.has("export")}
            onOpenChange={(open) => setSectionOpen("export", open)}
          >
            <ProfileRadioGroup
              label="Do you currently export internationally?"
              options={profileOptionGroups.exportsInternationally}
              value={profile.exportsInternationally}
              onChange={(value) => setValue("exportsInternationally", value)}
            />
            <ProfileTextField
              id="export-markets"
              label="If yes, list markets"
              required={profile.exportsInternationally === "Yes"}
              maxLength={1000}
              value={profile.exportMarkets}
              onChange={(value) => setValue("exportMarkets", value)}
              {...fieldState("exportMarkets")}
            />
          </ProfileSection>

          <ProfileSection
            title="10. Meeting arrangement"
            collapsible
            progress={sectionCompletion.meeting}
            open={openSections.has("meeting")}
            onOpenChange={(open) => setSectionOpen("meeting", open)}
          >
            <ProfileRadioGroup
              label="Meeting format"
              options={profileOptionGroups.meetingFormat}
              value={profile.meetingFormat}
              onChange={(value) => setValue("meetingFormat", value)}
            />
            <ProfileTextareaField
              id="meeting-dates"
              label="Available meeting dates"
              maxLength={1000}
              value={profile.availableMeetingDates}
              onChange={(value) => setValue("availableMeetingDates", value)}
              {...fieldState("availableMeetingDates")}
            />
            <ProfileRadioGroup
              label="Maximum number of meetings requested"
              options={profileOptionGroups.maxMeetings}
              value={profile.maxMeetings}
              onChange={(value) => setValue("maxMeetings", value)}
            />
          </ProfileSection>

          <ProfileSection
            title="11. Supporting documents"
            collapsible
            progress={sectionCompletion.documents}
            open={openSections.has("documents")}
            onOpenChange={(open) => setSectionOpen("documents", open)}
          >
            <ProfileCheckboxGroup
              label="Please upload or prepare"
              options={profileOptionGroups.supportingDocuments}
              values={profile.supportingDocuments}
              onToggle={(value) => toggleList("supportingDocuments", value)}
            />
            <div
              className="rounded-lg border bg-muted/20 p-3 sm:p-4"
              data-testid="vendor-profile-document-library"
            >
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-medium">
                    Private document library
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PDF only · maximum 6 MB · visible to your company and
                    authorized tenant operators
                  </p>
                </div>
                <Badge variant="outline" className="mt-1 w-fit sm:mt-0">
                  {profileDocuments.length}{" "}
                  {profileDocuments.length === 1 ? "file" : "files"}
                </Badge>
              </div>

              <Input
                ref={documentInputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="sr-only"
                aria-label="Upload PDF document"
                onChange={(event) =>
                  void uploadProfileDocument(event.target.files?.[0])
                }
              />

              {documentsLoading ? (
                <div className="mt-4 flex items-center gap-2 rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                  <Icon icon={Loading03Icon} className="animate-spin" />
                  Loading private documents…
                </div>
              ) : profileDocuments.length ? (
                <div className="mt-4 grid gap-2">
                  {profileDocuments.map((document) => (
                    <div
                      key={document.id}
                      className="flex flex-col gap-3 rounded-md border bg-background p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-muted/35 text-muted-foreground">
                          <Icon icon={File01Icon} />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {document.fileName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDocumentSize(document.fileSize)} ·{" "}
                            {formatDocumentDate(document.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 sm:shrink-0">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <a
                            href={document.reviewUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Icon icon={ViewIcon} inline="inline-start" />
                            Review
                          </a>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={deletingDocumentId === document.id}
                              aria-label={`Delete ${document.fileName}`}
                            >
                              <Icon
                                icon={
                                  deletingDocumentId === document.id
                                    ? Loading03Icon
                                    : Delete02Icon
                                }
                                className={cn(
                                  deletingDocumentId === document.id &&
                                    "animate-spin"
                                )}
                              />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete this PDF?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {document.fileName} will be permanently removed
                                from your private document library.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Keep PDF</AlertDialogCancel>
                              <AlertDialogAction
                                variant="destructive"
                                onClick={() =>
                                  void deleteProfileDocument(document)
                                }
                              >
                                Delete PDF
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-md border border-dashed p-4">
                  <p className="text-sm font-medium">No PDFs uploaded yet</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Add a company profile, catalogue, license, certification, or
                    presentation when it is ready.
                  </p>
                </div>
              )}
            </div>
          </ProfileSection>

          <ProfileSection
            title="12. Consent"
            collapsible
            progress={sectionCompletion.consent}
            open={openSections.has("consent")}
            onOpenChange={(open) => setSectionOpen("consent", open)}
          >
            <Field orientation="horizontal" className="rounded-md border p-3">
              <Checkbox
                checked={profile.consent}
                onCheckedChange={(checked) =>
                  setValue("consent", checked === true)
                }
              />
              <FieldTitle>
                I agree that my company information may be shared with relevant
                participants and organizers for B2B matchmaking purposes.
              </FieldTitle>
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <ProfileTextField
                id="consent-name"
                label="Name"
                required={profile.consent}
                autoComplete="name"
                maxLength={160}
                value={profile.consentName}
                onChange={(value) => setValue("consentName", value)}
                {...fieldState("consentName")}
              />
              <ProfileTextField
                id="consent-date"
                label="Date"
                type="date"
                required={profile.consent}
                max={getMalaysiaToday()}
                value={profile.consentDate}
                onChange={(value) => setValue("consentDate", value)}
                {...fieldState("consentDate")}
              />
            </div>
          </ProfileSection>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2 border-t pt-5">
          <Button type="submit">
            <Icon icon={CheckmarkCircle02Icon} inline="inline-start" />
            Save registration profile
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={documentUploading}
            onClick={() => documentInputRef.current?.click()}
          >
            <Icon
              icon={documentUploading ? Loading03Icon : Upload01Icon}
              inline="inline-start"
              className={cn(documentUploading && "animate-spin")}
            />
            {documentUploading ? "Uploading PDF…" : "Upload PDF"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

function formatDocumentSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDocumentDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "Uploaded recently"
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

function ProfileSection({
  title,
  children,
  collapsible = false,
  open = true,
  onOpenChange,
  progress,
}: {
  title: string
  children: React.ReactNode
  collapsible?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  progress?: {
    completed: number
    total: number
  }
}) {
  const contentId = useId()

  if (!collapsible) {
    return (
      <section className="rounded-md border p-4">
        <h3 className="text-base font-semibold">{title}</h3>
        <div className="mt-4 grid gap-4">{children}</div>
      </section>
    )
  }

  return (
    <section className="overflow-hidden rounded-md border">
      <button
        type="button"
        className="flex min-h-12 w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/45 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => onOpenChange?.(!open)}
      >
        <span className="text-base font-semibold">{title}</span>
        <span className="flex shrink-0 items-center gap-2">
          {progress ? (
            <Badge
              variant="outline"
              className={cn(
                "min-w-10 justify-center rounded-full text-[0.6875rem] text-muted-foreground tabular-nums",
                progress.completed === progress.total &&
                  "border-primary/30 bg-primary/10 text-primary"
              )}
              aria-label={`${progress.completed} of ${progress.total} questions complete`}
            >
              {progress.completed}/{progress.total}
            </Badge>
          ) : null}
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180"
            )}
            strokeWidth={1.7}
          />
        </span>
      </button>
      {open ? (
        <div id={contentId} className="grid gap-4 border-t px-4 pt-4 pb-4">
          {children}
        </div>
      ) : null}
    </section>
  )
}

function InternationalPhoneField({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  preferredRegion,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  error?: string
  preferredRegion: string
}) {
  const preferredCountry = getCountryCodeForRegion(preferredRegion)
  const [countryPickerOpen, setCountryPickerOpen] = useState(false)
  const [selectedCountryOverride, setSelectedCountryOverride] =
    useState<CountryCode>()
  const errorId = `${id}-error`
  const descriptionId = `${id}-description`
  const resolvedPhone = splitInternationalPhoneNumber(value, preferredCountry)
  const selectedCountry = selectedCountryOverride ?? resolvedPhone.countryCode
  const selectedOption =
    countryCallingCodeOptions.find(
      (option) => option.countryCode === selectedCountry
    ) ??
    countryCallingCodeOptions.find((option) => option.countryCode === "MY")!
  const phoneParts = splitInternationalPhoneNumber(value, selectedCountry)

  function selectCountry(countryCode: CountryCode) {
    setSelectedCountryOverride(countryCode)
    onChange(
      composeInternationalPhoneNumber(countryCode, phoneParts.nationalNumber)
    )
    setCountryPickerOpen(false)
  }

  function updateNationalNumber(nextValue: string) {
    if (nextValue.trimStart().startsWith("+")) {
      const parsed = splitInternationalPhoneNumber(nextValue, selectedCountry)

      setSelectedCountryOverride(parsed.countryCode)
      onChange(
        composeInternationalPhoneNumber(
          parsed.countryCode,
          parsed.nationalNumber
        )
      )
      return
    }

    onChange(composeInternationalPhoneNumber(selectedCountry, nextValue))
  }

  return (
    <Field data-invalid={Boolean(error) || undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div
        className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-2"
        role="group"
        aria-label={label}
      >
        <Popover open={countryPickerOpen} onOpenChange={setCountryPickerOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="h-7 w-full justify-between bg-input/20 px-2 text-sm tabular-nums md:text-xs dark:bg-input/30"
              role="combobox"
              aria-label={`Country or region calling code: ${selectedOption.countryName} +${selectedOption.callingCode}`}
              aria-expanded={countryPickerOpen}
              aria-controls={`${id}-country-list`}
              data-testid="mobile-country-code"
              title={`${selectedOption.countryName} +${selectedOption.callingCode}`}
            >
              <span className="truncate">
                {selectedOption.countryCode} +{selectedOption.callingCode}
              </span>
              <HugeiconsIcon
                icon={ArrowDown01Icon}
                className="size-3.5 shrink-0 text-muted-foreground"
                strokeWidth={1.7}
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-[min(22rem,calc(100vw-2rem))] p-0"
          >
            <Command>
              <CommandInput
                placeholder="Search country, region, or code…"
                aria-label="Search country or region calling codes"
              />
              <CommandList id={`${id}-country-list`} className="max-h-80">
                <CommandEmpty>No calling code found.</CommandEmpty>
                <CommandGroup heading="All countries and regions">
                  {countryCallingCodeOptions.map((option) => (
                    <CommandItem
                      key={option.countryCode}
                      value={`${option.countryName} ${option.countryCode} +${option.callingCode}`}
                      data-checked={
                        option.countryCode === selectedCountry || undefined
                      }
                      aria-selected={option.countryCode === selectedCountry}
                      onSelect={() => selectCountry(option.countryCode)}
                    >
                      <span className="w-7 shrink-0 font-medium">
                        {option.countryCode}
                      </span>
                      <span className="min-w-0 flex-1 truncate">
                        {option.countryName}
                      </span>
                      <span className="shrink-0 text-muted-foreground tabular-nums">
                        +{option.callingCode}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <Input
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          maxLength={25}
          placeholder="12 345 6789"
          value={phoneParts.nationalNumber}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : descriptionId}
          onChange={(event) => updateNationalNumber(event.target.value)}
          onBlur={onBlur}
        />
      </div>
      {error ? (
        <FieldDescription
          id={errorId}
          className="text-destructive"
          role="alert"
        >
          {error}
        </FieldDescription>
      ) : (
        <FieldDescription id={descriptionId}>
          Choose any country or region code, then enter the local number.
        </FieldDescription>
      )}
    </Field>
  )
}

function ProfileTextField({
  id,
  label,
  type = "text",
  value,
  onChange,
  onBlur,
  error,
  required,
  inputMode,
  autoComplete,
  placeholder,
  min,
  max,
  maxLength,
}: {
  id: string
  label: string
  type?: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  error?: string
  required?: boolean
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]
  autoComplete?: string
  placeholder?: string
  min?: string | number
  max?: string | number
  maxLength?: number
}) {
  const errorId = `${id}-error`

  return (
    <Field data-invalid={Boolean(error) || undefined}>
      <FieldLabel htmlFor={id}>
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </FieldLabel>
      <Input
        id={id}
        type={type}
        required={required}
        inputMode={inputMode}
        autoComplete={autoComplete}
        placeholder={placeholder}
        min={min}
        max={max}
        maxLength={maxLength}
        value={value}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
      />
      {error ? (
        <FieldDescription
          id={errorId}
          className="text-destructive"
          role="alert"
        >
          {error}
        </FieldDescription>
      ) : null}
    </Field>
  )
}

function ProfileTextareaField({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  description,
  maxLength,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  error?: string
  description?: string
  maxLength?: number
}) {
  const descriptionId = `${id}-description`
  const errorId = `${id}-error`

  return (
    <Field data-invalid={Boolean(error) || undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Textarea
        id={id}
        maxLength={maxLength}
        value={value}
        aria-invalid={Boolean(error)}
        aria-describedby={
          error ? errorId : description ? descriptionId : undefined
        }
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
      />
      {error ? (
        <FieldDescription
          id={errorId}
          className="text-destructive"
          role="alert"
        >
          {error}
        </FieldDescription>
      ) : description ? (
        <FieldDescription id={descriptionId}>{description}</FieldDescription>
      ) : null}
    </Field>
  )
}

function ProfileRadioGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: string[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((option) => (
          <label
            key={option}
            className="flex min-h-10 items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors hover:bg-accent"
          >
            <input
              type="radio"
              className="size-4"
              checked={value === option}
              onChange={() => onChange(option)}
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </Field>
  )
}

function ProfileCheckboxGroup({
  label,
  options,
  values,
  onToggle,
}: {
  label: string
  options: string[]
  values: string[]
  onToggle: (value: string) => void
}) {
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((option) => (
          <label
            key={option}
            className="flex min-h-10 items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors hover:bg-accent"
          >
            <Checkbox
              checked={values.includes(option)}
              onCheckedChange={() => onToggle(option)}
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </Field>
  )
}

function UserMatches({
  db,
  matches,
  perspective,
  onStatus,
  onSchedule,
  locale,
}: {
  db: LocalDb
  matches: Match[]
  perspective: "delegation" | "partner"
  onStatus: (matchId: string, status: MatchStatus) => void
  onSchedule: (
    match: Match,
    requestedSlots?: string[],
    requestedInterpreterId?: string | null
  ) => void
  locale: Locale
}) {
  const availableInterpreters = db.interpreters.filter(
    (interpreter) => interpreter.available
  )
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <CardTitle>
              {textFor(locale, "Search for your match", "搜索您的配对")}
            </CardTitle>
            <CardDescription>
              {perspective === "delegation"
                ? textFor(
                    locale,
                    "Browse every Malaysian partner and request a match yourself.",
                    "浏览所有马来西亚伙伴，自行发起配对。"
                  )
                : textFor(
                    locale,
                    "Browse every delegation company and request a match yourself.",
                    "浏览所有代表团企业，自行发起配对。"
                  )}
            </CardDescription>
          </div>
          <Button asChild>
            <Link href={`/${locale}/vendor/discover`}>
              <Icon icon={UserGroupIcon} inline="inline-start" />
              {textFor(locale, "Find companies", "查找企业")}
            </Link>
          </Button>
        </CardHeader>
      </Card>

      {matches.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {textFor(
            locale,
            "No matches yet. Use search above to find and request a match.",
            "暂无配对。请使用上方搜索查找并发起配对。"
          )}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {matches.map((match) => {
          const ownCompanyId =
            perspective === "delegation" ? match.delegationId : match.partnerId
          const counterpartId =
            perspective === "delegation" ? match.partnerId : match.delegationId
          const ownCompanyName = getCompanyName(db, ownCompanyId)
          const rawCounterpartName = getCompanyName(db, counterpartId)
          const counterpartName =
            rawCounterpartName === "Unknown company"
              ? textFor(locale, "Company record pending", "企业记录待补充")
              : rawCounterpartName
          const counterpartSector = getCompanySector(db, counterpartId)
          const counterpartRole =
            perspective === "delegation"
              ? textFor(
                  locale,
                  "Malaysian Partner Vendor",
                  "马来西亚伙伴供应商"
                )
              : textFor(locale, "Delegation Vendor", "代表团供应商")
          const isAccepted = match.status === "Accepted"
          const isScheduled = match.status === "Session Scheduled"
          const ownAcceptedAt =
            perspective === "delegation"
              ? match.delegationAcceptedAt
              : match.partnerAcceptedAt
          const counterpartAcceptedAt =
            perspective === "delegation"
              ? match.partnerAcceptedAt
              : match.delegationAcceptedAt
          const meetingRequested = db.meetings.some(
            (meeting) => meeting.matchId === match.id
          )
          return (
            <Card key={match.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="mb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      {textFor(locale, "Matched with", "配对对象")}
                    </p>
                    <CardTitle className="truncate">
                      {counterpartName}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {counterpartRole}
                      {counterpartSector ? ` · ${counterpartSector}` : ""}
                    </CardDescription>
                  </div>
                  <Badge variant={statusVariant(match.status)}>
                    {statusLabel(match.status, locale)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="grid items-center gap-2 rounded-md border bg-muted/20 p-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">
                      {textFor(locale, "Your company", "您的企业")}
                    </p>
                    <p className="truncate text-sm font-medium">
                      {ownCompanyName}
                    </p>
                  </div>
                  <span
                    aria-hidden="true"
                    className="hidden text-muted-foreground sm:inline"
                  >
                    ↔
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">
                      {textFor(locale, "Linked Vendor", "已关联供应商")}
                    </p>
                    <p className="truncate text-sm font-medium">
                      {counterpartName}
                    </p>
                  </div>
                </div>
                <Progress value={match.score} />
                <p className="text-sm text-muted-foreground">
                  {textFor(locale, "Match confidence", "匹配信心")}:{" "}
                  {match.score}%
                </p>
                <p className="text-sm text-muted-foreground">
                  {ownAcceptedAt
                    ? textFor(locale, "You accepted", "您已接受")
                    : textFor(
                        locale,
                        "Your acceptance is pending",
                        "等待您接受"
                      )}
                  {" · "}
                  {counterpartAcceptedAt
                    ? textFor(locale, "The other party accepted", "对方已接受")
                    : textFor(
                        locale,
                        "Waiting for the other party",
                        "等待对方接受"
                      )}
                </p>
              </CardContent>
              <CardFooter className="flex flex-wrap gap-2">
                {isScheduled ? (
                  <Button asChild>
                    <Link href={`/${locale}/vendor?section=meetings`}>
                      <Icon icon={Calendar03Icon} inline="inline-start" />
                      {textFor(locale, "View meeting", "查看会议")}
                    </Link>
                  </Button>
                ) : isAccepted ? (
                  <MeetingSlotPickerDialog
                    match={match}
                    locale={locale}
                    isScheduled={meetingRequested}
                    interpreters={availableInterpreters}
                    onSubmit={onSchedule}
                  />
                ) : ownAcceptedAt ? (
                  <Button disabled>
                    {textFor(
                      locale,
                      "Waiting for the other party",
                      "等待对方接受"
                    )}
                  </Button>
                ) : (
                  <Button onClick={() => onStatus(match.id, "Accepted")}>
                    {textFor(locale, "Accept", "接受")}
                  </Button>
                )}
                {!isScheduled ? (
                  <Button
                    variant="outline"
                    onClick={() => onStatus(match.id, "Rejected")}
                  >
                    {textFor(locale, "Request change", "请求调整")}
                  </Button>
                ) : null}
                <MatchDetailsDialog
                  match={match}
                  locale={locale}
                  ownCompanyName={ownCompanyName}
                  counterpartName={counterpartName}
                  counterpartRole={counterpartRole}
                  counterpartSector={counterpartSector}
                  ownAccepted={Boolean(ownAcceptedAt)}
                  counterpartAccepted={Boolean(counterpartAcceptedAt)}
                />
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function MatchDetailsDialog({
  match,
  locale,
  ownCompanyName,
  counterpartName,
  counterpartRole,
  counterpartSector,
  ownAccepted,
  counterpartAccepted,
}: {
  match: Match
  locale: Locale
  ownCompanyName: string
  counterpartName: string
  counterpartRole: string
  counterpartSector: string
  ownAccepted: boolean
  counterpartAccepted: boolean
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Icon icon={ViewIcon} inline="inline-start" />
          {textFor(locale, "View details", "查看详情")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {textFor(locale, "Match details", "配对详情")}
          </DialogTitle>
          <DialogDescription>
            {textFor(
              locale,
              "Review the linked Vendor, match confidence, and both parties' decisions.",
              "查看已关联供应商、匹配信心及双方决定。"
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid items-center gap-3 rounded-md border bg-muted/20 p-4 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">
                {textFor(locale, "Your company", "您的企业")}
              </p>
              <p className="mt-1 font-semibold">{ownCompanyName}</p>
            </div>
            <span
              aria-hidden="true"
              className="hidden text-lg text-muted-foreground sm:inline"
            >
              ↔
            </span>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">
                {textFor(locale, "Linked Vendor", "已关联供应商")}
              </p>
              <p className="mt-1 font-semibold">{counterpartName}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {counterpartRole}
                {counterpartSector ? ` · ${counterpartSector}` : ""}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">
                {textFor(locale, "Status", "状态")}
              </p>
              <p className="mt-1 text-sm font-medium">
                {statusLabel(match.status, locale)}
              </p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">
                {textFor(locale, "Match confidence", "匹配信心")}
              </p>
              <p className="mt-1 text-sm font-medium">{match.score}%</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">
                {textFor(locale, "Decision progress", "决定进度")}
              </p>
              <p className="mt-1 text-sm font-medium">
                {[ownAccepted, counterpartAccepted].filter(Boolean).length}/2
              </p>
            </div>
          </div>

          <div className="rounded-md border p-4">
            <p className="text-sm font-medium">
              {textFor(locale, "Why this match", "配对说明")}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{match.note}</p>
          </div>

          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <span>{textFor(locale, "Your decision", "您的决定")}</span>
              <Badge variant={ownAccepted ? "default" : "outline"}>
                {ownAccepted
                  ? textFor(locale, "Accepted", "已接受")
                  : textFor(locale, "Pending", "待处理")}
              </Badge>
            </div>
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <span>{textFor(locale, "Linked Vendor", "已关联供应商")}</span>
              <Badge variant={counterpartAccepted ? "default" : "outline"}>
                {counterpartAccepted
                  ? textFor(locale, "Accepted", "已接受")
                  : textFor(locale, "Pending", "待处理")}
              </Badge>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function MeetingSlotPickerDialog({
  match,
  locale,
  isScheduled,
  interpreters,
  onSubmit,
}: {
  match: Match
  locale: Locale
  isScheduled: boolean
  interpreters: Interpreter[]
  onSubmit: (
    match: Match,
    requestedSlots: string[],
    requestedInterpreterId: string | null
  ) => void
}) {
  const [open, setOpen] = useState(false)
  const [selectedSlots, setSelectedSlots] = useState<string[]>([])
  const [interpreterId, setInterpreterId] = useState<string>("none")
  const slots = getMeetingSlotOptions()
  const canSubmit = selectedSlots.length >= 3

  function toggleSlot(slot: string) {
    setSelectedSlots((current) =>
      current.includes(slot)
        ? current.filter((item) => item !== slot)
        : [...current, slot].sort()
    )
  }

  function submitSlots() {
    if (!canSubmit) {
      toast.error(
        textFor(locale, "Select 3 slots to continue", "请选择 3 个时段后继续")
      )
      return
    }

    onSubmit(
      match,
      selectedSlots,
      interpreterId === "none" ? null : interpreterId
    )
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={isScheduled ? "outline" : "default"}>
          <Icon icon={Calendar03Icon} inline="inline-start" />
          {isScheduled
            ? textFor(locale, "Meeting requested", "已请求会议")
            : textFor(locale, "Request meeting", "请求会议")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {textFor(locale, "Choose preferred times", "选择首选时间")}
          </DialogTitle>
          <DialogDescription>
            {textFor(
              locale,
              "Pick at least 3 future working-day slots. Each slot is 1 hour.",
              "请选择至少 3 个未来工作日时段。每个时段为 1 小时。"
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
            {textFor(locale, "Working days only", "仅限工作日")} ·{" "}
            {selectedSlots.length} {textFor(locale, "selected", "已选择")}
          </div>
          <Field>
            <FieldLabel>
              {textFor(locale, "Available 1-hour slots", "可选 1 小时时段")}
            </FieldLabel>
            <div className="grid gap-2 sm:grid-cols-2">
              {slots.map((slot) => (
                <label
                  key={slot}
                  className={cn(
                    "flex min-h-12 cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors hover:bg-accent",
                    selectedSlots.includes(slot) &&
                      "border-primary bg-primary/10 text-primary"
                  )}
                >
                  <Checkbox
                    checked={selectedSlots.includes(slot)}
                    onCheckedChange={() => toggleSlot(slot)}
                  />
                  <span>{formatMeetingSlot(slot, locale)}</span>
                </label>
              ))}
            </div>
          </Field>
          <Field>
            <FieldLabel>
              {textFor(
                locale,
                "Preferred interpreter (optional)",
                "首选翻译（可选）"
              )}
            </FieldLabel>
            {interpreters.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {textFor(
                  locale,
                  "No interpreters are currently available. The organiser will assign one.",
                  "目前没有可用的翻译。主办方将为您安排。"
                )}
              </p>
            ) : (
              <>
                <Select value={interpreterId} onValueChange={setInterpreterId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      {textFor(locale, "No preference", "无偏好")}
                    </SelectItem>
                    {interpreters.map((interpreter) => (
                      <SelectItem key={interpreter.id} value={interpreter.id}>
                        {interpreter.name} · {interpreter.languages}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldDescription>
                  {textFor(
                    locale,
                    "Your choice is shared with the organiser, who confirms the final interpreter.",
                    "您的选择将提供给主办方，由其确认最终翻译。"
                  )}
                </FieldDescription>
              </>
            )}
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {textFor(locale, "Cancel", "取消")}
          </Button>
          <Button disabled={!canSubmit} onClick={submitSlots}>
            {canSubmit
              ? textFor(locale, "Save time preferences", "保存时间偏好")
              : textFor(
                  locale,
                  "Select 3 slots to continue",
                  "请选择 3 个时段后继续"
                )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function UserMeetings({ db, meetings }: { db: LocalDb; meetings: Meeting[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Meeting schedule</CardTitle>
        <CardDescription>
          Protected join links open only during the confirmed meeting window.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SessionList db={db} meetings={meetings} />
      </CardContent>
    </Card>
  )
}

function UserSigning({ db, matches }: { db: LocalDb; matches: Match[] }) {
  const deals = db.deals.filter((deal) =>
    matches.some((match) => match.id === deal.matchId)
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>MOU status</CardTitle>
        <CardDescription>
          Download signed copies or upload counter-signed document placeholders.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DealTable db={db} deals={deals} />
      </CardContent>
    </Card>
  )
}

function UserItinerary({
  db,
  compact = false,
}: {
  db: LocalDb
  compact?: boolean
}) {
  const slots = db.itinerary.filter((slot) => slot.published)
  const visibleResources = db.resources.filter(
    (resource) =>
      resource.visibleToDelegation &&
      ["all", "delegation"].includes(resource.audience)
  )
  return (
    <Card>
      <CardHeader>
        <CardTitle>Malaysia itinerary</CardTitle>
        <CardDescription>
          Read-only published schedule for the delegation visit.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {slots.slice(0, compact ? 2 : slots.length).map((slot) => (
          <div key={slot.id} className="rounded-md border p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium">
                  {slot.day} · {slot.time}
                </p>
                <p className="text-sm text-muted-foreground">{slot.activity}</p>
              </div>
              <Badge variant="outline">{slot.escort}</Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{slot.venue}</p>
          </div>
        ))}
        {!compact && visibleResources.length ? (
          <div className="mt-2 border-t pt-3">
            <p className="text-sm font-medium">Delegation resources</p>
            <div className="mt-3 grid gap-2">
              {visibleResources.map((resource) => (
                <div
                  key={resource.id}
                  className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium">{resource.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {resource.category} · {resource.fileName}
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <a href={resource.fileUrl} target="_blank" rel="noreferrer">
                      Open
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
      <CardFooter>
        <Button
          variant="outline"
          disabled={!slots.length}
          onClick={() => {
            downloadCsv("plexus-itinerary", slots, [
              { header: "Day", value: (slot) => slot.day },
              { header: "Time", value: (slot) => slot.time },
              { header: "Activity", value: (slot) => slot.activity },
              { header: "Venue", value: (slot) => slot.venue },
              { header: "Escort", value: (slot) => slot.escort },
            ])
            toast.success("Itinerary exported to CSV.")
          }}
        >
          <Icon icon={Download01Icon} inline="inline-start" />
          Download schedule
        </Button>
      </CardFooter>
    </Card>
  )
}

function AttendanceCard({
  company,
  onConfirm,
}: {
  company: PartnerCompany
  onConfirm: () => void
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Event attendance</CardTitle>
        <CardDescription>
          Confirm September attendance and use QR for check-in.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3 rounded-md border p-4">
          <div>
            <p className="text-sm font-medium">{company.attendance}</p>
            <p className="text-xs text-muted-foreground">
              Venue: MATRADE Hall B · September 2026
            </p>
          </div>
          <Badge variant={statusVariant(company.attendance)}>
            {company.attendance}
          </Badge>
        </div>
        <div className="grid place-items-center rounded-md border p-6">
          <div className="grid size-32 place-items-center rounded-md bg-muted text-muted-foreground">
            <Icon icon={QrCodeIcon} />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            QR-{company.id.toUpperCase()}-{company.attendance}
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={onConfirm}>
          <Icon icon={CheckmarkCircle02Icon} inline="inline-start" />
          Confirm attendance
        </Button>
      </CardFooter>
    </Card>
  )
}

function InfoTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  )
}

function CompanyTable({
  title,
  kind,
  companies,
  locale,
  onSave,
  onDelete,
}: {
  title: string
  kind: CompanyKind
  companies: ManagedCompany[]
  locale: Locale
  onSave: (company: ManagedCompany) => void
  onDelete: (company: ManagedCompany) => void
}) {
  function exportCompanies() {
    if (!companies.length) {
      toast(textFor(locale, "No records to export.", "没有可导出的记录。"))
      return
    }
    downloadCsv(`plexus-${kind}-companies`, companies, [
      { header: "Name (EN)", value: (company) => company.nameEn },
      { header: "Name (CN)", value: (company) => company.nameCn },
      { header: "Sector", value: (company) => company.sector },
      {
        header: kind === "delegation" ? "Origin" : "Type",
        value: (company) =>
          "origin" in company ? company.origin : company.type,
      },
      { header: "Size", value: (company) => company.size },
      { header: "Status", value: (company) => company.status },
      { header: "Profile %", value: (company) => company.profileComplete },
      { header: "Contact", value: (company) => company.contact },
      { header: "Contact detail", value: (company) => company.contactMeta },
    ])
    toast.success(
      textFor(
        locale,
        `Exported ${companies.length} ${kind} companies to CSV.`,
        `已导出 ${companies.length} 条企业记录为 CSV。`
      )
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            {textFor(
              locale,
              `${companies.length} records in Supabase.`,
              `Supabase 中共有 ${companies.length} 条记录。`
            )}
          </CardDescription>
        </div>
        <Button variant="outline" onClick={exportCompanies}>
          <Icon icon={Download01Icon} inline="inline-start" />
          {textFor(locale, "Export CSV", "导出 CSV")}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="hidden overflow-x-auto md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{textFor(locale, "Company", "企业")}</TableHead>
                <TableHead>{textFor(locale, "Sector", "行业")}</TableHead>
                <TableHead>{textFor(locale, "Status", "状态")}</TableHead>
                <TableHead>{textFor(locale, "Profile", "资料")}</TableHead>
                <TableHead>{textFor(locale, "Actions", "操作")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {getInitials(company.nameEn)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-44">
                        <p className="font-medium">{company.nameEn}</p>
                        <p className="text-xs text-muted-foreground">
                          {company.nameCn}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{company.sector}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(company.status)}>
                      {statusLabel(company.status, locale)}
                    </Badge>
                  </TableCell>
                  <TableCell>{company.profileComplete}%</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <CompanyDialog
                        kind={kind}
                        mode="view"
                        company={company}
                        locale={locale}
                      >
                        <Button variant="outline">
                          {textFor(locale, "View", "查看")}
                        </Button>
                      </CompanyDialog>
                      <CompanyDialog
                        kind={kind}
                        mode="edit"
                        company={company}
                        onSave={onSave}
                        locale={locale}
                      >
                        <Button>{textFor(locale, "Edit", "编辑")}</Button>
                      </CompanyDialog>
                      <DeleteCompanyDialog
                        company={company}
                        locale={locale}
                        onConfirm={() => onDelete(company)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="grid gap-3 md:hidden">
          {companies.map((company) => (
            <div key={company.id} className="rounded-md border p-3">
              <div className="flex items-start gap-3">
                <Avatar>
                  <AvatarFallback>{getInitials(company.nameEn)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {company.nameEn}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {company.nameCn || company.sector}
                  </p>
                </div>
                <Badge variant={statusVariant(company.status)}>
                  {statusLabel(company.status, locale)}
                </Badge>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <InfoTile
                  label={textFor(locale, "Sector", "行业")}
                  value={company.sector}
                />
                <InfoTile
                  label={textFor(locale, "Profile", "资料")}
                  value={`${company.profileComplete}%`}
                />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <CompanyDialog
                  kind={kind}
                  mode="view"
                  company={company}
                  locale={locale}
                >
                  <Button className="w-full" variant="outline">
                    {textFor(locale, "View", "查看")}
                  </Button>
                </CompanyDialog>
                <CompanyDialog
                  kind={kind}
                  mode="edit"
                  company={company}
                  onSave={onSave}
                  locale={locale}
                >
                  <Button className="w-full">
                    {textFor(locale, "Edit", "编辑")}
                  </Button>
                </CompanyDialog>
                <DeleteCompanyDialog
                  company={company}
                  locale={locale}
                  onConfirm={() => onDelete(company)}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function DeleteCompanyDialog({
  company,
  locale,
  onConfirm,
}: {
  company: ManagedCompany
  locale: Locale
  onConfirm: () => void
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">
          {textFor(locale, "Delete", "删除")}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {textFor(
              locale,
              `Delete ${company.nameEn}?`,
              `删除 ${company.nameEn}？`
            )}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {textFor(
              locale,
              "This will permanently remove the company from Supabase. Related matches, meetings, deals and site-visit references will also be cleaned up.",
              "这会从 Supabase 永久删除该企业，并清理相关配对、会议、协议与参访引用。"
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            {textFor(locale, "Cancel", "取消")}
          </AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            {textFor(locale, "Confirm delete", "确认删除")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function ProfileReadValue({
  label,
  value,
  multiline,
}: {
  label: string
  value: string
  multiline?: boolean
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className={cn("text-sm", multiline && "whitespace-pre-wrap")}>
        {value && value.trim() ? value : "—"}
      </span>
    </div>
  )
}

function ProfileReadList({
  label,
  values,
  other,
}: {
  label: string
  values: string[]
  other?: string
}) {
  const items = [
    ...(values ?? []),
    ...(other && other.trim() ? [other.trim()] : []),
  ]

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {items.length ? (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item) => (
            <Badge key={item} variant="secondary">
              {item}
            </Badge>
          ))}
        </div>
      ) : (
        <span className="text-sm">—</span>
      )}
    </div>
  )
}

function CompanyProfileDetails({
  company,
  locale,
}: {
  company: ManagedCompany
  locale: Locale
}) {
  const profile = getRegistrationProfile(company)

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-base font-semibold">
          {textFor(locale, "Full registration profile", "完整报名资料")}
        </h3>
        <p className="text-sm text-muted-foreground">
          {textFor(
            locale,
            "The complete B2B matchmaking profile submitted by the participant, identical to their portal view.",
            "参会方提交的完整 B2B 配对资料，与其门户视图一致。"
          )}
        </p>
      </div>

      <ProfileSection title="1. Company information">
        <div className="grid gap-4 md:grid-cols-2">
          <ProfileReadValue
            label="Company name (English)"
            value={profile.companyNameEn}
          />
          <ProfileReadValue
            label="Company name (Chinese)"
            value={profile.companyNameCn}
          />
        </div>
        <ProfileReadValue
          label="Country / Region"
          value={
            profile.countryRegion === "Other"
              ? profile.countryOther
              : profile.countryRegion
          }
        />
        <div className="grid gap-4 md:grid-cols-2">
          <ProfileReadValue
            label="Year established"
            value={profile.yearEstablished}
          />
          <ProfileReadValue
            label="Company registration number"
            value={profile.registrationNumber}
          />
          <ProfileReadValue label="Website" value={profile.website} />
          <ProfileReadValue label="Company address" value={profile.address} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <ProfileReadValue
            label="Number of employees"
            value={profile.employeeRange}
          />
          <ProfileReadValue
            label="Annual revenue range"
            value={profile.annualRevenueRange}
          />
        </div>
      </ProfileSection>

      <ProfileSection title="2. Contact person">
        <div className="grid gap-4 md:grid-cols-2">
          <ProfileReadValue label="Name" value={profile.contactName} />
          <ProfileReadValue label="Position" value={profile.contactPosition} />
          <ProfileReadValue label="Email" value={profile.contactEmail} />
          <ProfileReadValue
            label="Mobile number"
            value={profile.mobileNumber}
          />
          <ProfileReadValue
            label="WhatsApp / WeChat ID"
            value={profile.chatId}
          />
        </div>
        <ProfileReadList
          label="Preferred language"
          values={profile.preferredLanguages}
        />
      </ProfileSection>

      <ProfileSection title="3. Industry / sector">
        <ProfileReadList
          label="Industries"
          values={profile.industries}
          other={profile.industryOther}
        />
      </ProfileSection>

      <ProfileSection title="4. Company profile">
        <ProfileReadValue
          label="Brief company introduction"
          value={profile.introduction}
          multiline
        />
        <ProfileReadValue
          label="Key products / services"
          value={profile.productsServices}
          multiline
        />
        <ProfileReadList
          label="Certifications"
          values={profile.certifications}
          other={profile.certificationOther}
        />
      </ProfileSection>

      <ProfileSection title="5. What does the company offer?">
        <ProfileReadList
          label="Offers"
          values={profile.offers}
          other={profile.offerOther}
        />
      </ProfileSection>

      <ProfileSection title="6. What are they looking for?">
        <ProfileReadList
          label="Looking for"
          values={profile.lookingFor}
          other={profile.lookingForOther}
        />
      </ProfileSection>

      <ProfileSection title="7. Matchmaking preferences">
        <ProfileReadList
          label="Preferred partner type"
          values={profile.preferredPartnerTypes}
          other={profile.preferredPartnerOther}
        />
        <ProfileReadList
          label="Expected outcome"
          values={profile.expectedOutcomes}
        />
      </ProfileSection>

      <ProfileSection title="8. Specific business needs">
        <ProfileReadValue
          label="Ideal business partner"
          value={profile.idealPartner}
          multiline
        />
        <ProfileReadValue
          label="Opportunity to discuss"
          value={profile.opportunity}
          multiline
        />
      </ProfileSection>

      <ProfileSection title="9. Export / international experience">
        <ProfileReadValue
          label="Currently exports internationally?"
          value={profile.exportsInternationally}
        />
        <ProfileReadValue label="Markets" value={profile.exportMarkets} />
      </ProfileSection>

      <ProfileSection title="10. Meeting arrangement">
        <ProfileReadValue
          label="Meeting format"
          value={profile.meetingFormat}
        />
        <ProfileReadValue
          label="Available meeting dates"
          value={profile.availableMeetingDates}
          multiline
        />
        <ProfileReadValue
          label="Maximum number of meetings"
          value={profile.maxMeetings}
        />
      </ProfileSection>

      <ProfileSection title="11. Supporting documents">
        <ProfileReadList
          label="Documents"
          values={profile.supportingDocuments}
        />
      </ProfileSection>

      <ProfileSection title="12. Consent">
        <ProfileReadValue
          label="Consent to share information"
          value={
            profile.consent
              ? textFor(locale, "Agreed", "已同意")
              : textFor(locale, "Not agreed", "未同意")
          }
        />
        <div className="grid gap-4 md:grid-cols-2">
          <ProfileReadValue label="Name" value={profile.consentName} />
          <ProfileReadValue label="Date" value={profile.consentDate} />
        </div>
      </ProfileSection>
    </div>
  )
}

function CompanyDialog({
  kind,
  mode,
  company,
  onSave,
  children,
  locale = "en",
}: {
  kind: CompanyKind
  mode: "create" | "edit" | "view"
  company?: ManagedCompany
  onSave?: (company: ManagedCompany) => void
  children: React.ReactNode
  locale?: Locale
}) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<ManagedCompany>(
    () => company ?? makeBlankCompany(kind)
  )
  const readOnly = mode === "view"

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setForm(company ?? makeBlankCompany(kind))
    }
    setOpen(nextOpen)
  }

  function updateField<K extends keyof ManagedCompany>(
    field: K,
    value: ManagedCompany[K]
  ) {
    setForm((current) => ({ ...current, [field]: value }) as ManagedCompany)
  }

  function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!onSave) {
      return
    }

    if (!form.sector.trim()) {
      toast.error("Select an industry sector.")
      return
    }

    onSave({
      ...form,
      nameCn: form.nameCn || form.nameEn,
      contact: form.contact || "Pending contact",
      contactMeta: form.contactMeta || "Pending email",
    } as ManagedCompany)
    if (mode === "create") {
      setForm(makeBlankCompany(kind))
    }
    setOpen(false)
  }

  const detailText =
    kind === "delegation"
      ? (form as DelegationCompany).needs
      : (form as PartnerCompany).offerings
  const dialogTitle =
    mode === "create"
      ? `Add ${kind === "delegation" ? "delegation company" : "Malaysian partner"}`
      : mode === "edit"
        ? `Edit ${form.nameEn}`
        : form.nameEn

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create the account shell with company name and login email. The participant completes the B2B profile from their portal."
              : mode === "view"
                ? "Review the full company record."
                : "Manage bilingual profile, contact, status and operational flags."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submitForm} className="flex flex-col gap-4">
          {mode === "create" ? (
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor={`${form.id}-name-en`}>
                  Company name
                </FieldLabel>
                <Input
                  id={`${form.id}-name-en`}
                  value={form.nameEn}
                  onChange={(event) =>
                    updateField("nameEn", event.target.value)
                  }
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor={`${form.id}-sector`}>
                  Industry sector
                </FieldLabel>
                <IndustrySectorCombobox
                  id={`${form.id}-sector`}
                  name="sector"
                  value={form.sector}
                  onValueChange={(value) => updateField("sector", value)}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor={`${form.id}-contact-meta`}>
                  Login email
                </FieldLabel>
                <Input
                  id={`${form.id}-contact-meta`}
                  type="email"
                  value={form.contactMeta}
                  onChange={(event) =>
                    updateField("contactMeta", event.target.value)
                  }
                  required
                />
                <FieldDescription>
                  Use this email when creating the Supabase Auth user and
                  linking app_metadata to this company.
                </FieldDescription>
              </Field>
            </FieldGroup>
          ) : (
            <FieldGroup>
              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor={`${form.id}-name-en`}>
                    Company name (EN)
                  </FieldLabel>
                  <Input
                    id={`${form.id}-name-en`}
                    value={form.nameEn}
                    onChange={(event) =>
                      updateField("nameEn", event.target.value)
                    }
                    readOnly={readOnly}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor={`${form.id}-name-cn`}>
                    Company name (CN)
                  </FieldLabel>
                  <Input
                    id={`${form.id}-name-cn`}
                    value={form.nameCn}
                    onChange={(event) =>
                      updateField("nameCn", event.target.value)
                    }
                    readOnly={readOnly}
                  />
                </Field>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <Field>
                  <FieldLabel htmlFor={`${form.id}-sector`}>Sector</FieldLabel>
                  <IndustrySectorCombobox
                    id={`${form.id}-sector`}
                    name="sector"
                    value={form.sector}
                    onValueChange={(value) => updateField("sector", value)}
                    disabled={readOnly}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor={`${form.id}-size`}>Size</FieldLabel>
                  <Input
                    id={`${form.id}-size`}
                    value={form.size}
                    onChange={(event) =>
                      updateField("size", event.target.value)
                    }
                    readOnly={readOnly}
                  />
                </Field>
                {kind === "delegation" ? (
                  <Field>
                    <FieldLabel htmlFor={`${form.id}-origin`}>
                      Origin
                    </FieldLabel>
                    <Input
                      id={`${form.id}-origin`}
                      value={(form as DelegationCompany).origin}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...(current as DelegationCompany),
                          origin: event.target.value,
                        }))
                      }
                      readOnly={readOnly}
                    />
                  </Field>
                ) : (
                  <Field>
                    <FieldLabel>Partner type</FieldLabel>
                    <Select
                      value={(form as PartnerCompany).type}
                      onValueChange={(value) =>
                        setForm((current) => ({
                          ...(current as PartnerCompany),
                          type: value as PartnerCompany["type"],
                        }))
                      }
                      disabled={readOnly}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="Government">Government</SelectItem>
                          <SelectItem value="Association">
                            Association
                          </SelectItem>
                          <SelectItem value="Enterprise">Enterprise</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              </div>

              <Field>
                <FieldLabel htmlFor={`${form.id}-detail`}>
                  {kind === "delegation"
                    ? "Cooperation needs"
                    : "Key offerings"}
                </FieldLabel>
                <Textarea
                  id={`${form.id}-detail`}
                  value={detailText}
                  onChange={(event) =>
                    kind === "delegation"
                      ? setForm((current) => ({
                          ...(current as DelegationCompany),
                          needs: event.target.value,
                        }))
                      : setForm((current) => ({
                          ...(current as PartnerCompany),
                          offerings: event.target.value,
                        }))
                  }
                  readOnly={readOnly}
                />
              </Field>

              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor={`${form.id}-contact`}>
                    Contact person
                  </FieldLabel>
                  <Input
                    id={`${form.id}-contact`}
                    value={form.contact}
                    onChange={(event) =>
                      updateField("contact", event.target.value)
                    }
                    readOnly={readOnly}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor={`${form.id}-contact-meta`}>
                    Contact details
                  </FieldLabel>
                  <Input
                    id={`${form.id}-contact-meta`}
                    value={form.contactMeta}
                    onChange={(event) =>
                      updateField("contactMeta", event.target.value)
                    }
                    readOnly={readOnly}
                  />
                </Field>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <Field>
                  <FieldLabel>Status</FieldLabel>
                  {kind === "delegation" ? (
                    <Select
                      value={(form as DelegationCompany).status}
                      onValueChange={(value) =>
                        setForm((current) => ({
                          ...(current as DelegationCompany),
                          status: value as DelegationCompany["status"],
                        }))
                      }
                      disabled={readOnly}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="Onboarded">Onboarded</SelectItem>
                          <SelectItem value="Invited">Invited</SelectItem>
                          <SelectItem value="Incomplete">Incomplete</SelectItem>
                          <SelectItem value="Locked">Locked</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Select
                      value={(form as PartnerCompany).status}
                      onValueChange={(value) =>
                        setForm((current) => ({
                          ...(current as PartnerCompany),
                          status: value as PartnerCompany["status"],
                        }))
                      }
                      disabled={readOnly}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="Sourced">Sourced</SelectItem>
                          <SelectItem value="Invited">Invited</SelectItem>
                          <SelectItem value="Confirmed">Confirmed</SelectItem>
                          <SelectItem value="Declined">Declined</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                </Field>

                <Field>
                  <FieldLabel htmlFor={`${form.id}-profile`}>
                    Profile completeness
                  </FieldLabel>
                  <Input
                    id={`${form.id}-profile`}
                    type="number"
                    min={0}
                    max={100}
                    value={form.profileComplete}
                    onChange={(event) =>
                      updateField(
                        "profileComplete",
                        Number(
                          event.target.value
                        ) as ManagedCompany["profileComplete"]
                      )
                    }
                    readOnly={readOnly}
                  />
                </Field>

                {kind === "delegation" ? (
                  <Field>
                    <FieldLabel htmlFor={`${form.id}-coordinator`}>
                      AGA coordinator
                    </FieldLabel>
                    <Input
                      id={`${form.id}-coordinator`}
                      value={(form as DelegationCompany).coordinator}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...(current as DelegationCompany),
                          coordinator: event.target.value,
                        }))
                      }
                      readOnly={readOnly}
                    />
                  </Field>
                ) : (
                  <Field>
                    <FieldLabel>Background check</FieldLabel>
                    <Select
                      value={(form as PartnerCompany).verified}
                      onValueChange={(value) =>
                        setForm((current) => ({
                          ...(current as PartnerCompany),
                          verified: value as PartnerCompany["verified"],
                        }))
                      }
                      disabled={readOnly}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="Verified">Verified</SelectItem>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Flagged">Flagged</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              </div>

              {kind === "partner" ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <Field>
                    <FieldLabel>Attendance</FieldLabel>
                    <Select
                      value={(form as PartnerCompany).attendance}
                      onValueChange={(value) =>
                        setForm((current) => ({
                          ...(current as PartnerCompany),
                          attendance: value as PartnerCompany["attendance"],
                        }))
                      }
                      disabled={readOnly}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="Invited">Invited</SelectItem>
                          <SelectItem value="Confirmed">Confirmed</SelectItem>
                          <SelectItem value="Declined">Declined</SelectItem>
                          <SelectItem value="Arrived">Arrived</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field
                    orientation="horizontal"
                    className="self-end rounded-md border p-3"
                  >
                    <Checkbox
                      checked={(form as PartnerCompany).arrived}
                      onCheckedChange={(checked) =>
                        setForm((current) => ({
                          ...(current as PartnerCompany),
                          arrived: checked === true,
                        }))
                      }
                      disabled={readOnly}
                    />
                    <FieldTitle>Arrived at event</FieldTitle>
                  </Field>
                </div>
              ) : (
                <Field
                  orientation="horizontal"
                  className="rounded-md border p-3"
                >
                  <Checkbox
                    checked={(form as DelegationCompany).urgent}
                    onCheckedChange={(checked) =>
                      setForm((current) => ({
                        ...(current as DelegationCompany),
                        urgent: checked === true,
                      }))
                    }
                    disabled={readOnly}
                  />
                  <FieldTitle>Needs urgent attention</FieldTitle>
                </Field>
              )}
            </FieldGroup>
          )}

          {mode !== "create" && company ? (
            <>
              <Separator />
              <CompanyProfileDetails company={company} locale={locale} />
            </>
          ) : null}

          <DialogFooter showCloseButton={readOnly}>
            {!readOnly ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {mode === "create" ? "Create company" : "Save changes"}
                </Button>
              </>
            ) : null}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function makeBlankCompany(kind: CompanyKind): ManagedCompany {
  const id = `${kind === "delegation" ? "del" : "par"}-${Date.now()}`

  if (kind === "delegation") {
    return {
      id,
      role: "delegation",
      nameEn: "",
      nameCn: "",
      sector: "",
      origin: "Pending",
      size: "Pending",
      needs: "Pending profile",
      contact: "Pending contact",
      contactMeta: "",
      status: "Invited",
      profileComplete: 0,
      urgent: false,
      coordinator: "Sarah Lim",
    }
  }

  return {
    id,
    role: "partner",
    nameEn: "",
    nameCn: "",
    sector: "",
    type: "Enterprise",
    size: "Pending",
    offerings: "Pending profile",
    contact: "Pending contact",
    contactMeta: "",
    status: "Sourced",
    profileComplete: 0,
    verified: "Pending",
    attendance: "Invited",
    arrived: false,
  }
}

function MatchTable({
  db,
  matches,
  onCreateProvider,
  locale = "en",
}: {
  db: LocalDb
  matches: Match[]
  onCreateProvider: (match: Match, provider: "zoom" | "lark") => void
  locale?: Locale
}) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{textFor(locale, "Pair", "配对")}</TableHead>
            <TableHead>{textFor(locale, "Score", "评分")}</TableHead>
            <TableHead>{textFor(locale, "Status", "状态")}</TableHead>
            <TableHead>{textFor(locale, "Action", "操作")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {matches.map((match) => {
            const mutuallyAccepted = Boolean(
              match.delegationAcceptedAt && match.partnerAcceptedAt
            )
            const sessionScheduled = match.status === "Session Scheduled"

            return (
              <TableRow key={match.id}>
                <TableCell>
                  <p className="font-medium">
                    {getCompanyName(db, match.delegationId)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {getCompanyName(db, match.partnerId)}
                  </p>
                </TableCell>
                <TableCell>{match.score}%</TableCell>
                <TableCell>
                  <Badge variant={statusVariant(match.status)}>
                    {statusLabel(match.status, locale)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    {sessionScheduled ? (
                      <Button disabled>
                        {textFor(locale, "Meeting created", "会议已创建")}
                      </Button>
                    ) : mutuallyAccepted ? (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => onCreateProvider(match, "zoom")}
                        >
                          {textFor(locale, "Create Zoom", "创建 Zoom")}
                        </Button>
                        <Button onClick={() => onCreateProvider(match, "lark")}>
                          {textFor(locale, "Create Lark", "创建 Lark")}
                        </Button>
                      </>
                    ) : (
                      <Button disabled>
                        {textFor(
                          locale,
                          "Waiting for both Vendors",
                          "等待双方接受"
                        )}
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

type InterpreterFormValues = {
  name: string
  languages: string
  email: string
  notes: string
  available: boolean
}

const emptyInterpreterForm: InterpreterFormValues = {
  name: "",
  languages: "",
  email: "",
  notes: "",
  available: true,
}

function InterpreterManagement({
  db,
  locale,
  onCreate,
  onUpdate,
  onDelete,
}: {
  db: LocalDb
  locale: Locale
  onCreate: (values: InterpreterFormValues) => void
  onUpdate: (interpreterId: string, values: InterpreterFormValues) => void
  onDelete: (interpreterId: string) => void
}) {
  const interpreters = db.interpreters
  const availableCount = interpreters.filter((item) => item.available).length

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>
            {textFor(locale, "Interpreter roster", "翻译人员名单")}
          </CardTitle>
          <CardDescription>
            {textFor(
              locale,
              "Manage the interpreter listing. Delegation and partner companies can pick a preferred interpreter from this roster when requesting a meeting.",
              "管理翻译人员名单。代表团与伙伴企业在请求会议时，可从此名单中选择首选翻译。"
            )}
          </CardDescription>
        </div>
        <InterpreterFormDialog
          locale={locale}
          mode="create"
          onSubmit={onCreate}
        />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          <Badge variant="outline">
            {interpreters.length} {textFor(locale, "interpreters", "位翻译")}
          </Badge>
          <Badge variant="outline">
            {availableCount} {textFor(locale, "available", "可用")}
          </Badge>
        </div>
        {interpreters.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {textFor(
              locale,
              "No interpreters yet. Add one to start building the roster.",
              "尚无翻译人员。请新增以建立名单。"
            )}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{textFor(locale, "Name", "姓名")}</TableHead>
                <TableHead>{textFor(locale, "Languages", "语言")}</TableHead>
                <TableHead>{textFor(locale, "Contact", "联系方式")}</TableHead>
                <TableHead>{textFor(locale, "Status", "状态")}</TableHead>
                <TableHead className="text-right">
                  {textFor(locale, "Actions", "操作")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {interpreters.map((interpreter) => (
                <TableRow key={interpreter.id}>
                  <TableCell>
                    <p className="font-medium">{interpreter.name}</p>
                    {interpreter.notes ? (
                      <p className="text-xs text-muted-foreground">
                        {interpreter.notes}
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell>{interpreter.languages}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {interpreter.email || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={interpreter.available ? "default" : "secondary"}
                    >
                      {interpreter.available
                        ? textFor(locale, "Available", "可用")
                        : textFor(locale, "Unavailable", "不可用")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <InterpreterFormDialog
                        locale={locale}
                        mode="edit"
                        interpreter={interpreter}
                        onSubmit={(values) => onUpdate(interpreter.id, values)}
                      />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            {textFor(locale, "Remove", "移除")}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {textFor(
                                locale,
                                "Remove interpreter?",
                                "移除翻译人员？"
                              )}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {textFor(
                                locale,
                                `Remove ${interpreter.name} from the roster. Meetings that requested this interpreter will keep their preference cleared.`,
                                `将 ${interpreter.name} 从名单中移除。已请求该翻译的会议将清除其偏好设置。`
                              )}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>
                              {textFor(locale, "Cancel", "取消")}
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onDelete(interpreter.id)}
                            >
                              {textFor(locale, "Remove", "移除")}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

function InterpreterFormDialog({
  locale,
  mode,
  interpreter,
  onSubmit,
}: {
  locale: Locale
  mode: "create" | "edit"
  interpreter?: Interpreter
  onSubmit: (values: InterpreterFormValues) => void
}) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<InterpreterFormValues>(
    interpreter
      ? {
          name: interpreter.name,
          languages: interpreter.languages,
          email: interpreter.email,
          notes: interpreter.notes,
          available: interpreter.available,
        }
      : emptyInterpreterForm
  )

  function resetForm() {
    setForm(
      interpreter
        ? {
            name: interpreter.name,
            languages: interpreter.languages,
            email: interpreter.email,
            notes: interpreter.notes,
            available: interpreter.available,
          }
        : emptyInterpreterForm
    )
  }

  function submit() {
    if (form.name.trim().length < 2 || form.languages.trim().length < 2) {
      toast.error(
        textFor(
          locale,
          "Enter a name and the language pair.",
          "请输入姓名与语言对。"
        )
      )
      return
    }

    onSubmit({
      name: form.name.trim(),
      languages: form.languages.trim(),
      email: form.email.trim(),
      notes: form.notes.trim(),
      available: form.available,
    })
    setOpen(false)

    if (mode === "create") {
      setForm(emptyInterpreterForm)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) {
          resetForm()
        }
      }}
    >
      <DialogTrigger asChild>
        {mode === "create" ? (
          <Button>
            <Icon icon={UserGroupIcon} inline="inline-start" />
            {textFor(locale, "Add interpreter", "新增翻译")}
          </Button>
        ) : (
          <Button variant="outline" size="sm">
            {textFor(locale, "Edit", "编辑")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "create"
              ? textFor(locale, "Add interpreter", "新增翻译")
              : textFor(locale, "Edit interpreter", "编辑翻译")}
          </DialogTitle>
          <DialogDescription>
            {textFor(
              locale,
              "Interpreters listed here are selectable by delegation and partner companies when requesting meetings.",
              "此处列出的翻译人员可供代表团与伙伴企业在请求会议时选择。"
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <Field>
            <FieldLabel htmlFor="interpreter-name">
              {textFor(locale, "Name", "姓名")}
            </FieldLabel>
            <Input
              id="interpreter-name"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              placeholder={textFor(
                locale,
                "e.g. Grace Wong",
                "例如 Grace Wong"
              )}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="interpreter-languages">
              {textFor(locale, "Languages", "语言")}
            </FieldLabel>
            <Input
              id="interpreter-languages"
              value={form.languages}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  languages: event.target.value,
                }))
              }
              placeholder={textFor(locale, "e.g. EN ⇄ ZH", "例如 EN ⇄ ZH")}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="interpreter-email">
              {textFor(locale, "Contact email", "联系邮箱")}
            </FieldLabel>
            <Input
              id="interpreter-email"
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
              placeholder="name@example.com"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="interpreter-notes">
              {textFor(locale, "Notes", "备注")}
            </FieldLabel>
            <Textarea
              id="interpreter-notes"
              value={form.notes}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
              placeholder={textFor(
                locale,
                "Specialisations, availability windows, etc.",
                "专长、可用时间等。"
              )}
            />
          </Field>
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <p className="text-sm font-medium">
                {textFor(locale, "Available for assignment", "可供分配")}
              </p>
              <p className="text-xs text-muted-foreground">
                {textFor(
                  locale,
                  "Unavailable interpreters are hidden from requesters.",
                  "不可用的翻译不会显示给请求方。"
                )}
              </p>
            </div>
            <Switch
              checked={form.available}
              onCheckedChange={(checked) =>
                setForm((current) => ({ ...current, available: checked }))
              }
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {textFor(locale, "Cancel", "取消")}
          </Button>
          <Button onClick={submit}>
            {mode === "create"
              ? textFor(locale, "Add interpreter", "新增翻译")
              : textFor(locale, "Save changes", "保存更改")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function getDefaultMeetingDateTime() {
  const value = new Date(Date.now() + 24 * 60 * 60 * 1000)
  value.setSeconds(0, 0)
  value.setMinutes(Math.ceil(value.getMinutes() / 30) * 30)

  return new Date(value.getTime() - value.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16)
}

function toLocalMeetingDateTime(value: string) {
  const date = new Date(value)

  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16)
}

function ManualMeetingDialog({
  db,
  locale = "en",
  onCreate,
}: {
  db: LocalDb
  locale?: Locale
  onCreate: (values: ManualMeetingInput) => Promise<boolean>
}) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [delegationId, setDelegationId] = useState("")
  const [partnerId, setPartnerId] = useState("")
  const [platform, setPlatform] =
    useState<ManualMeetingInput["platform"]>("zoom")
  const [startsAt, setStartsAt] = useState("")
  const [durationMinutes, setDurationMinutes] = useState("60")
  const [requestedInterpreterId, setRequestedInterpreterId] = useState("none")
  const [agenda, setAgenda] = useState("")
  const hasVendorPair =
    db.delegationCompanies.length > 0 && db.partnerCompanies.length > 0
  const selectedDelegation = db.delegationCompanies.find(
    (company) => company.id === delegationId
  )
  const selectedPartner = db.partnerCompanies.find(
    (company) => company.id === partnerId
  )

  function reset() {
    setDelegationId("")
    setPartnerId("")
    setPlatform("zoom")
    setStartsAt("")
    setDurationMinutes("60")
    setRequestedInterpreterId("none")
    setAgenda("")
  }

  async function submit() {
    const selectedDate = new Date(startsAt)

    if (
      !delegationId ||
      !partnerId ||
      !Number.isFinite(selectedDate.getTime()) ||
      selectedDate.getTime() <= Date.now() ||
      agenda.trim().length < 3
    ) {
      toast.error(
        textFor(
          locale,
          "Select both Vendors, a future time, and a short agenda.",
          "请选择双方供应商、未来时间并填写简短议程。"
        )
      )
      return
    }

    setSubmitting(true)
    const created = await onCreate({
      delegationId,
      partnerId,
      platform,
      startsAt: selectedDate.toISOString(),
      durationMinutes: Number(durationMinutes),
      requestedInterpreterId:
        requestedInterpreterId === "none" ? null : requestedInterpreterId,
      agenda: agenda.trim(),
    })
    setSubmitting(false)

    if (created) {
      setOpen(false)
      reset()
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!submitting) {
          setOpen(nextOpen)
          if (nextOpen && !startsAt) {
            setStartsAt(getDefaultMeetingDateTime())
          }
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Icon icon={AddIcon} inline="inline-start" />
          {textFor(locale, "Create meeting", "手动创建会议")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {textFor(locale, "Create a meeting", "手动创建会议")}
          </DialogTitle>
          <DialogDescription>
            {textFor(
              locale,
              "Select one delegation Vendor and one Malaysian partner. Plexus creates or reuses their match and adds the confirmed time to both Vendor calendars.",
              "选择一家代表团供应商和一家马来西亚合作伙伴。Plexus 将建立或沿用双方配对，并把确认时间加入双方日历。"
            )}
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <Icon icon={SecurityCheckIcon} />
          <AlertTitle>
            {textFor(locale, "Provider-link protection", "会议链接保护")}
          </AlertTitle>
          <AlertDescription>
            {textFor(
              locale,
              "This schedules the calendar record immediately. A protected Zoom or Lark link is created only after both Vendors accept the match.",
              "系统会立即建立日历记录；只有双方供应商接受配对后，才会建立受保护的 Zoom 或 Lark 链接。"
            )}
          </AlertDescription>
        </Alert>

        {!hasVendorPair ? (
          <Alert>
            <Icon icon={Alert02Icon} />
            <AlertTitle>
              {textFor(locale, "Vendor pair required", "需要双方供应商")}
            </AlertTitle>
            <AlertDescription>
              {textFor(
                locale,
                "Create at least one delegation Vendor and one Malaysian partner before scheduling a meeting.",
                "安排会议前，请先建立至少一家代表团供应商和一家马来西亚合作伙伴。"
              )}
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid min-w-0 gap-2 sm:col-span-2">
            <FieldLabel htmlFor="manualMeetingPlatform">
              {textFor(locale, "Meeting platform", "會議平台")}
            </FieldLabel>
            <Select
              value={platform}
              onValueChange={(value) =>
                setPlatform(value as ManualMeetingInput["platform"])
              }
            >
              <SelectTrigger
                id="manualMeetingPlatform"
                className="w-full"
                aria-label={textFor(locale, "Meeting platform", "會議平台")}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="zoom">Zoom</SelectItem>
                <SelectItem value="lark">Lark</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {textFor(
                locale,
                "Choose the preferred provider now. The protected join link is created after both Vendors accept the match.",
                "現在選擇首選平台；雙方供應商接受配對後，系統才會建立受保護的加入連結。"
              )}
            </p>
          </div>

          <div className="grid min-w-0 gap-2">
            <FieldLabel htmlFor="manualMeetingDelegation">
              {textFor(locale, "Delegation Vendor", "代表团供应商")}
            </FieldLabel>
            <Select value={delegationId} onValueChange={setDelegationId}>
              <SelectTrigger
                id="manualMeetingDelegation"
                className="w-full min-w-0 overflow-hidden"
                aria-label={textFor(
                  locale,
                  "Delegation Vendor",
                  "代表团供应商"
                )}
              >
                <SelectValue
                  className="min-w-0 flex-1 truncate text-left"
                  placeholder={textFor(
                    locale,
                    "Select a delegation Vendor",
                    "选择代表团供应商"
                  )}
                >
                  {selectedDelegation?.nameEn}
                </SelectValue>
              </SelectTrigger>
              <SelectContent
                position="popper"
                className="max-w-[min(32rem,calc(100vw-2rem))]"
              >
                {db.delegationCompanies.map((company) => (
                  <SelectItem
                    key={company.id}
                    value={company.id}
                    textValue={`${company.nameEn} ${company.sector}`}
                    className="py-2 pr-8"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">
                        {company.nameEn}
                      </span>
                      <span className="block truncate text-muted-foreground">
                        {company.sector}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid min-w-0 gap-2">
            <FieldLabel htmlFor="manualMeetingPartner">
              {textFor(locale, "Malaysian partner", "马来西亚合作伙伴")}
            </FieldLabel>
            <Select value={partnerId} onValueChange={setPartnerId}>
              <SelectTrigger
                id="manualMeetingPartner"
                className="w-full min-w-0 overflow-hidden"
                aria-label={textFor(
                  locale,
                  "Malaysian partner",
                  "马来西亚合作伙伴"
                )}
              >
                <SelectValue
                  className="min-w-0 flex-1 truncate text-left"
                  placeholder={textFor(
                    locale,
                    "Select a Malaysian partner",
                    "选择马来西亚合作伙伴"
                  )}
                >
                  {selectedPartner?.nameEn}
                </SelectValue>
              </SelectTrigger>
              <SelectContent
                position="popper"
                className="max-w-[min(32rem,calc(100vw-2rem))]"
              >
                {db.partnerCompanies.map((company) => (
                  <SelectItem
                    key={company.id}
                    value={company.id}
                    textValue={`${company.nameEn} ${company.sector}`}
                    className="py-2 pr-8"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">
                        {company.nameEn}
                      </span>
                      <span className="block truncate text-muted-foreground">
                        {company.sector}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <FieldLabel htmlFor="manualMeetingStartsAt">
              {textFor(locale, "Date and time", "日期与时间")}
            </FieldLabel>
            <Input
              id="manualMeetingStartsAt"
              type="datetime-local"
              value={startsAt}
              onChange={(event) => setStartsAt(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {textFor(
                locale,
                "Entered in your local timezone; calendars display Malaysia time.",
                "按您的本地时区输入；日历将显示马来西亚时间。"
              )}
            </p>
          </div>

          <div className="grid gap-2">
            <FieldLabel htmlFor="manualMeetingDuration">
              {textFor(locale, "Duration", "会议时长")}
            </FieldLabel>
            <Select value={durationMinutes} onValueChange={setDurationMinutes}>
              <SelectTrigger
                id="manualMeetingDuration"
                className="w-full"
                aria-label={textFor(locale, "Duration", "会议时长")}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[30, 45, 60, 90, 120].map((minutes) => (
                  <SelectItem key={minutes} value={String(minutes)}>
                    {minutes} {textFor(locale, "minutes", "分钟")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2 sm:col-span-2">
            <FieldLabel htmlFor="manualMeetingInterpreter">
              {textFor(locale, "Interpreter", "翻译")}
            </FieldLabel>
            <Select
              value={requestedInterpreterId}
              onValueChange={setRequestedInterpreterId}
            >
              <SelectTrigger
                id="manualMeetingInterpreter"
                className="w-full"
                aria-label={textFor(locale, "Interpreter", "翻译")}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  {textFor(locale, "Assign later", "稍后分配")}
                </SelectItem>
                {db.interpreters
                  .filter((interpreter) => interpreter.available)
                  .map((interpreter) => (
                    <SelectItem key={interpreter.id} value={interpreter.id}>
                      {interpreter.name} · {interpreter.languages}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2 sm:col-span-2">
            <FieldLabel htmlFor="manualMeetingAgenda">
              {textFor(locale, "Meeting agenda", "会议议程")}
            </FieldLabel>
            <Textarea
              id="manualMeetingAgenda"
              value={agenda}
              onChange={(event) => setAgenda(event.target.value)}
              maxLength={1000}
              rows={4}
              placeholder={textFor(
                locale,
                "Example: Product introduction, distribution requirements, and next steps.",
                "例如：产品介绍、分销需求及后续步骤。"
              )}
            />
            <p className="text-xs text-muted-foreground">
              {agenda.trim().length} / 1000
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            disabled={submitting}
            onClick={() => setOpen(false)}
          >
            {textFor(locale, "Cancel", "取消")}
          </Button>
          <Button
            disabled={
              submitting ||
              !delegationId ||
              !partnerId ||
              !startsAt ||
              agenda.trim().length < 3 ||
              !hasVendorPair
            }
            onClick={submit}
          >
            {submitting ? (
              <Icon icon={Loading03Icon} inline="inline-start" />
            ) : (
              <Icon icon={Calendar03Icon} inline="inline-start" />
            )}
            {submitting
              ? textFor(locale, "Creating meeting…", "正在创建会议…")
              : textFor(locale, "Create meeting", "创建会议")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function MeetingDetailsDialog({
  db,
  meeting,
  locale = "en",
  onUpdate,
  trigger,
}: {
  db: LocalDb
  meeting: Meeting
  locale?: Locale
  onUpdate: (values: MeetingAmendmentInput) => Promise<boolean>
  trigger: ReactNode
}) {
  const match = db.matches.find((item) => item.id === meeting.matchId)
  const deal = db.deals.find((item) => item.matchId === meeting.matchId)
  const assignedInterpreter = db.interpreters.find(
    (item) => `${item.name} · ${item.languages}` === meeting.interpreter
  )
  const companyPair = match
    ? `${getCompanyName(db, match.delegationId)} ↔ ${getCompanyName(db, match.partnerId)}`
    : textFor(locale, "Meeting participants", "会议参与方")
  const isProtected = Boolean(meeting.link)
  const isReadOnly = ["Completed", "Cancelled"].includes(meeting.status)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [platform, setPlatform] = useState<MeetingAmendmentInput["platform"]>(
    meeting.platform === "Lark" ? "lark" : "zoom"
  )
  const [startsAt, setStartsAt] = useState(
    toLocalMeetingDateTime(meeting.startsAt)
  )
  const [durationMinutes, setDurationMinutes] = useState(
    String(meeting.duration)
  )
  const [requestedInterpreterId, setRequestedInterpreterId] = useState(
    meeting.requestedInterpreterId ?? assignedInterpreter?.id ?? "none"
  )
  const [agenda, setAgenda] = useState(
    extractMeetingAgenda(meeting.summary) || meeting.summary
  )

  function resetDraft() {
    setEditing(false)
    setPlatform(meeting.platform === "Lark" ? "lark" : "zoom")
    setStartsAt(toLocalMeetingDateTime(meeting.startsAt))
    setDurationMinutes(String(meeting.duration))
    setRequestedInterpreterId(
      meeting.requestedInterpreterId ?? assignedInterpreter?.id ?? "none"
    )
    setAgenda(extractMeetingAgenda(meeting.summary) || meeting.summary)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const selectedDate = new Date(startsAt)

    if (
      Number.isNaN(selectedDate.getTime()) ||
      agenda.trim().length < 3 ||
      !Number.isFinite(Number(durationMinutes))
    ) {
      toast.error(
        textFor(
          locale,
          "Check the meeting schedule and agenda.",
          "请检查会议时间与议程。"
        )
      )
      return
    }

    setSubmitting(true)
    const updated = await onUpdate({
      meetingId: meeting.id,
      platform,
      startsAt: selectedDate.toISOString(),
      durationMinutes: Number(durationMinutes),
      requestedInterpreterId:
        requestedInterpreterId === "none" ? null : requestedInterpreterId,
      agenda: agenda.trim(),
    })
    setSubmitting(false)

    if (updated) {
      setOpen(false)
      setEditing(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (submitting) {
          return
        }

        setOpen(nextOpen)
        if (nextOpen) {
          resetDraft()
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editing
              ? textFor(locale, "Edit meeting", "编辑会议")
              : textFor(locale, "Meeting details", "会议详情")}
          </DialogTitle>
          <DialogDescription>
            {companyPair} · {formatDateTime(meeting.startsAt, locale)}
          </DialogDescription>
        </DialogHeader>

        {editing ? (
          <form className="grid gap-5" onSubmit={submit}>
            {isProtected ? (
              <Alert>
                <Icon icon={SecurityCheckIcon} />
                <AlertTitle>
                  {textFor(
                    locale,
                    "Protected link retained",
                    "保留受保护会议链接"
                  )}
                </AlertTitle>
                <AlertDescription>
                  {textFor(
                    locale,
                    "This meeting already has a protected provider link. Its platform, date, and duration are locked here; the agenda and interpreter can still be amended.",
                    "此会议已有受保护的平台链接。平台、日期和时长会在此锁定，但仍可修改议程与翻译。"
                  )}
                </AlertDescription>
              </Alert>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <FieldLabel htmlFor={`meetingPlatform-${meeting.id}`}>
                  {textFor(locale, "Meeting platform", "会议平台")}
                </FieldLabel>
                <Select
                  value={platform}
                  disabled={isProtected}
                  onValueChange={(value) =>
                    setPlatform(value as MeetingAmendmentInput["platform"])
                  }
                >
                  <SelectTrigger
                    id={`meetingPlatform-${meeting.id}`}
                    className="w-full"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zoom">Zoom</SelectItem>
                    <SelectItem value="lark">Lark</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <FieldLabel htmlFor={`meetingDuration-${meeting.id}`}>
                  {textFor(locale, "Duration", "会议时长")}
                </FieldLabel>
                <Select
                  value={durationMinutes}
                  disabled={isProtected}
                  onValueChange={setDurationMinutes}
                >
                  <SelectTrigger
                    id={`meetingDuration-${meeting.id}`}
                    className="w-full"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[30, 45, 60, 90, 120].map((minutes) => (
                      <SelectItem key={minutes} value={String(minutes)}>
                        {minutes} {textFor(locale, "minutes", "分钟")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2 sm:col-span-2">
                <FieldLabel htmlFor={`meetingStartsAt-${meeting.id}`}>
                  {textFor(locale, "Date and time", "日期与时间")}
                </FieldLabel>
                <Input
                  id={`meetingStartsAt-${meeting.id}`}
                  type="datetime-local"
                  value={startsAt}
                  disabled={isProtected}
                  onChange={(event) => setStartsAt(event.target.value)}
                />
              </div>

              <div className="grid gap-2 sm:col-span-2">
                <FieldLabel htmlFor={`meetingInterpreter-${meeting.id}`}>
                  {textFor(locale, "Interpreter", "翻译")}
                </FieldLabel>
                <Select
                  value={requestedInterpreterId}
                  onValueChange={setRequestedInterpreterId}
                >
                  <SelectTrigger
                    id={`meetingInterpreter-${meeting.id}`}
                    className="w-full"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      {textFor(locale, "Assign later", "稍后分配")}
                    </SelectItem>
                    {db.interpreters
                      .filter(
                        (interpreter) =>
                          interpreter.available ||
                          interpreter.id === requestedInterpreterId
                      )
                      .map((interpreter) => (
                        <SelectItem key={interpreter.id} value={interpreter.id}>
                          {interpreter.name} · {interpreter.languages}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2 sm:col-span-2">
                <FieldLabel htmlFor={`meetingAgenda-${meeting.id}`}>
                  {textFor(locale, "Meeting agenda", "会议议程")}
                </FieldLabel>
                <Textarea
                  id={`meetingAgenda-${meeting.id}`}
                  value={agenda}
                  maxLength={1000}
                  rows={5}
                  onChange={(event) => setAgenda(event.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {agenda.trim().length} / 1000
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={resetDraft}
              >
                {textFor(locale, "Cancel editing", "取消编辑")}
              </Button>
              <Button
                type="submit"
                disabled={submitting || agenda.trim().length < 3}
              >
                <Icon
                  icon={submitting ? Loading03Icon : SaveIcon}
                  inline="inline-start"
                />
                {submitting
                  ? textFor(locale, "Saving…", "正在保存…")
                  : textFor(locale, "Save changes", "保存更改")}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={statusVariant(meeting.status)}>
                {statusLabel(meeting.status, locale)}
              </Badge>
              <Badge variant="outline">{meeting.platform}</Badge>
              <Badge variant={meeting.link ? "default" : "outline"}>
                {meeting.link
                  ? textFor(locale, "Protected link ready", "受保护链接已就绪")
                  : textFor(locale, "Awaiting secure link", "等待安全会议链接")}
              </Badge>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <InfoTile
                label={textFor(locale, "Schedule", "会议时间")}
                value={formatDateTime(meeting.startsAt, locale)}
              />
              <InfoTile
                label={textFor(locale, "Duration", "会议时长")}
                value={`${meeting.duration} ${textFor(locale, "min", "分钟")}`}
              />
              <InfoTile
                label={textFor(locale, "Host", "主持人")}
                value={meeting.host}
              />
              <InfoTile
                label={textFor(locale, "Interpreter", "翻译")}
                value={meeting.interpreter}
              />
              <InfoTile
                label={textFor(locale, "Agreement", "协议")}
                value={
                  deal?.status
                    ? statusLabel(deal.status, locale)
                    : textFor(locale, "No deal yet", "暂无协议")
                }
              />
              <InfoTile
                label={textFor(locale, "Vendor pair", "供应商配对")}
                value={companyPair}
              />
            </div>

            <div className="rounded-md border bg-muted/20 p-4">
              <p className="text-sm font-medium">
                {textFor(locale, "Agenda and notes", "议程与备注")}
              </p>
              <p className="mt-2 text-sm whitespace-pre-wrap text-muted-foreground">
                {meeting.summary}
              </p>
            </div>

            <Alert>
              <Icon icon={SecurityCheckIcon} />
              <AlertTitle>
                {textFor(locale, "Protected meeting access", "受保护会议访问")}
              </AlertTitle>
              <AlertDescription>
                {meeting.link
                  ? textFor(
                      locale,
                      "The provider join URL stays hidden. Use Join to open the protected Plexus route.",
                      "平台加入网址保持隐藏；请使用“加入”打开受保护的 Plexus 路由。"
                    )
                  : textFor(
                      locale,
                      "The protected Zoom or Lark route becomes available after both Vendors accept the match.",
                      "双方供应商接受配对后，受保护的 Zoom 或 Lark 路由才会开放。"
                    )}
              </AlertDescription>
            </Alert>

            <DialogFooter>
              {meeting.link ? (
                <>
                  <CopyMeetingLinkButton link={meeting.link} locale={locale} />
                  <Button asChild variant="outline">
                    <a href={meeting.link} target="_blank" rel="noreferrer">
                      <Icon icon={CameraVideoIcon} inline="inline-start" />
                      {textFor(locale, "Join meeting", "加入会议")}
                    </a>
                  </Button>
                </>
              ) : null}
              {!isReadOnly ? (
                <Button onClick={() => setEditing(true)}>
                  <Icon icon={SaveIcon} inline="inline-start" />
                  {textFor(locale, "Edit meeting", "编辑会议")}
                </Button>
              ) : null}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function CopyMeetingLinkButton({
  link,
  locale = "en",
}: {
  link?: string
  locale?: Locale
}) {
  async function copyLink() {
    if (!link) {
      return
    }

    try {
      const shareUrl = new URL(link, window.location.origin)

      if (!/^\/m\/[^/]+$/.test(shareUrl.pathname)) {
        throw new Error("Only protected meeting links can be copied.")
      }

      await navigator.clipboard.writeText(shareUrl.toString())
      toast.success(
        textFor(
          locale,
          "Protected join link copied.",
          "受保护的加入链接已复制。"
        )
      )
    } catch {
      toast.error(
        textFor(
          locale,
          "Unable to copy the join link. Open the meeting details and try again.",
          "无法复制加入链接，请打开会议详情后重试。"
        )
      )
    }
  }

  return (
    <Button type="button" variant="outline" disabled={!link} onClick={copyLink}>
      <Icon icon={Copy01Icon} inline="inline-start" />
      {textFor(locale, "Copy join link", "复制加入链接")}
    </Button>
  )
}

function SessionList({
  db,
  meetings,
  onComplete,
  onAssignInterpreter,
  onUpdateMeeting,
  locale = "en",
}: {
  db: LocalDb
  meetings: Meeting[]
  onComplete?: (meetingId: string) => void
  onAssignInterpreter?: (
    meetingId: string,
    interpreterId: string | null
  ) => void
  onUpdateMeeting?: (values: MeetingAmendmentInput) => Promise<boolean>
  locale?: Locale
}) {
  if (!meetings.length) {
    return (
      <p className="text-sm text-muted-foreground">
        {textFor(locale, "No sessions scheduled yet.", "尚未安排会议。")}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {meetings.map((meeting) => {
        const match = db.matches.find((item) => item.id === meeting.matchId)
        const requestedInterpreter = meeting.requestedInterpreterId
          ? db.interpreters.find(
              (item) => item.id === meeting.requestedInterpreterId
            )
          : undefined
        const assignedInterpreter = db.interpreters.find(
          (item) => `${item.name} · ${item.languages}` === meeting.interpreter
        )
        return (
          <div key={meeting.id} className="rounded-md border p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={statusVariant(meeting.status)}>
                    {statusLabel(meeting.status, locale)}
                  </Badge>
                  <Badge variant="outline">{meeting.platform}</Badge>
                </div>
                <p className="mt-2 font-medium">
                  {match
                    ? `${getCompanyName(db, match.delegationId)} ↔ ${getCompanyName(db, match.partnerId)}`
                    : meeting.id}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatDateTime(meeting.startsAt, locale)} ·{" "}
                  {meeting.duration} {textFor(locale, "min", "分钟")} ·{" "}
                  {textFor(locale, "Interpreter", "翻译")}:{" "}
                  {meeting.interpreter}
                </p>
                {requestedInterpreter ? (
                  <p className="text-sm text-muted-foreground">
                    {textFor(locale, "Requester preference", "请求方偏好")}:{" "}
                    {requestedInterpreter.name} ·{" "}
                    {requestedInterpreter.languages}
                    {assignedInterpreter?.id === requestedInterpreter.id
                      ? ` (${textFor(locale, "confirmed", "已确认")})`
                      : ""}
                  </p>
                ) : null}
                <p className="mt-2 text-sm text-muted-foreground">
                  {meeting.summary}
                </p>
                {onAssignInterpreter ? (
                  <div className="mt-3 max-w-xs">
                    <FieldLabel className="text-xs">
                      {textFor(
                        locale,
                        "Assign / confirm interpreter",
                        "分配 / 确认翻译"
                      )}
                    </FieldLabel>
                    <Select
                      value={assignedInterpreter?.id ?? "none"}
                      onValueChange={(value) =>
                        onAssignInterpreter(
                          meeting.id,
                          value === "none" ? null : value
                        )
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          {textFor(locale, "Unassigned", "未分配")}
                        </SelectItem>
                        {db.interpreters.map((interpreter) => (
                          <SelectItem
                            key={interpreter.id}
                            value={interpreter.id}
                            disabled={
                              !interpreter.available &&
                              interpreter.id !== assignedInterpreter?.id
                            }
                          >
                            {interpreter.name} · {interpreter.languages}
                            {interpreter.available
                              ? ""
                              : ` (${textFor(locale, "unavailable", "不可用")})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {onUpdateMeeting ? (
                  <MeetingDetailsDialog
                    db={db}
                    meeting={meeting}
                    locale={locale}
                    onUpdate={onUpdateMeeting}
                    trigger={
                      <Button variant="outline">
                        <Icon icon={ViewIcon} inline="inline-start" />
                        {textFor(locale, "View / edit", "查看 / 编辑")}
                      </Button>
                    }
                  />
                ) : null}
                {meeting.link ? (
                  <Button asChild>
                    <a href={meeting.link} target="_blank" rel="noreferrer">
                      <Icon icon={CameraVideoIcon} inline="inline-start" />
                      {textFor(locale, "Join", "加入")}
                    </a>
                  </Button>
                ) : (
                  <Button disabled>
                    <Icon icon={CameraVideoIcon} inline="inline-start" />
                    {textFor(
                      locale,
                      "Awaiting secure link",
                      "等待安全会议链接"
                    )}
                  </Button>
                )}
                <CopyMeetingLinkButton link={meeting.link} locale={locale} />
                {onComplete ? (
                  <Button
                    variant="outline"
                    onClick={() => onComplete(meeting.id)}
                  >
                    {textFor(locale, "Complete", "完成")}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => {
                      downloadIcs(
                        `plexus-session-${meeting.id}`,
                        [
                          {
                            uid: meeting.id,
                            title: match
                              ? `${getCompanyName(db, match.delegationId)} ↔ ${getCompanyName(db, match.partnerId)}`
                              : `Plexus session ${meeting.id}`,
                            start: new Date(meeting.startsAt),
                            durationMinutes: meeting.duration,
                            location: `${meeting.platform} · ${meeting.link}`,
                            description: `Interpreter: ${meeting.interpreter}. Host: ${meeting.host}. ${meeting.summary}`,
                          },
                        ],
                        "Plexus Connect session"
                      )
                      toast.success(
                        textFor(
                          locale,
                          "Calendar invite (.ics) downloaded.",
                          "日历邀请（.ics）已下载。"
                        )
                      )
                    }}
                  >
                    <Icon icon={Calendar03Icon} inline="inline-start" />
                    {textFor(locale, "Calendar", "日历")}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function meetingProviderStateLabel(
  state: MeetingProviderState,
  locale: Locale
) {
  if (state === "online") {
    return textFor(locale, "Online", "在线")
  }
  if (state === "authorization_required") {
    return textFor(locale, "Authorization required", "需要授权")
  }
  return textFor(locale, "Setup required", "需要设置")
}

function MeetingProviderStatus({
  name,
  state,
  detail,
  locale,
}: {
  name: "Zoom" | "Lark"
  state: MeetingProviderState
  detail: string
  locale: Locale
}) {
  const online = state === "online"

  return (
    <div className="rounded-md border bg-muted/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-md border",
              online
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                : "bg-background text-muted-foreground"
            )}
          >
            <Icon icon={name === "Zoom" ? CameraVideoIcon : Calendar03Icon} />
          </span>
          <div className="min-w-0">
            <p className="font-medium">{name}</p>
            <p className="text-xs text-muted-foreground">
              {textFor(locale, "Online meeting provider", "在线会议平台")}
            </p>
          </div>
        </div>
        <Badge
          variant={online ? "default" : "outline"}
          className={cn(
            "shrink-0",
            online &&
              "border-emerald-500/30 bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/15"
          )}
        >
          <span
            className={cn(
              "mr-1.5 size-1.5 rounded-full",
              online ? "bg-emerald-500" : "bg-amber-500"
            )}
          />
          {meetingProviderStateLabel(state, locale)}
        </Badge>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{detail}</p>
    </div>
  )
}

function MeetingProviderStatusStrip({
  readiness,
  locale,
}: {
  readiness: MeetingProviderReadiness
  locale: Locale
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <MeetingProviderStatus
        name="Zoom"
        state={readiness.zoom.state}
        locale={locale}
        detail={
          readiness.zoom.state === "online"
            ? textFor(
                locale,
                "Ready to create protected Zoom meetings.",
                "已可创建受保护的 Zoom 会议。"
              )
            : textFor(
                locale,
                "Platform configuration must be completed before Zoom meetings can be created.",
                "创建 Zoom 会议前需要先完成平台配置。"
              )
        }
      />
      <MeetingProviderStatus
        name="Lark"
        state={readiness.lark.state}
        locale={locale}
        detail={
          readiness.lark.state === "online"
            ? textFor(
                locale,
                "Configured and authorized for protected Lark meetings.",
                "已完成配置与授权，可创建受保护的 Lark 会议。"
              )
            : readiness.lark.state === "authorization_required"
              ? textFor(
                  locale,
                  "Platform configuration is complete; Plexus authorization is still required.",
                  "平台配置已完成，仍需 Plexus 完成授权。"
                )
              : textFor(
                  locale,
                  "Platform configuration must be completed before Lark meetings can be created.",
                  "创建 Lark 会议前需要先完成平台配置。"
                )
        }
      />
    </div>
  )
}

function MeetingSettings({
  readiness,
  locale,
  onBack,
}: {
  readiness: MeetingProviderReadiness
  locale: Locale
  onBack: () => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="gap-3 sm:flex sm:flex-row sm:items-start sm:justify-between">
          <div className="grid gap-1.5">
            <CardTitle>
              {textFor(locale, "Meeting settings", "会议设置")}
            </CardTitle>
            <CardDescription>
              {textFor(
                locale,
                "Review Zoom, Lark and protected-link readiness for this environment.",
                "查看当前环境的 Zoom、Lark 与受保护链接就绪状态。"
              )}
            </CardDescription>
          </div>
          <Button className="sm:shrink-0" variant="outline" onClick={onBack}>
            <Icon icon={Calendar03Icon} inline="inline-start" />
            {textFor(locale, "Back to meetings", "返回会议")}
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <MeetingProviderStatusStrip readiness={readiness} locale={locale} />

          <div className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-md border p-4">
              <div className="flex items-center gap-2">
                <Icon icon={SecurityCheckIcon} />
                <h3 className="font-medium">
                  {textFor(
                    locale,
                    "Protected meeting links",
                    "受保护的会议链接"
                  )}
                </h3>
                <Badge
                  variant={
                    readiness.protectedLinksConfigured ? "default" : "outline"
                  }
                  className={cn(
                    "ml-auto",
                    readiness.protectedLinksConfigured &&
                      "border-emerald-500/30 bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/15"
                  )}
                >
                  {readiness.protectedLinksConfigured
                    ? textFor(locale, "Ready", "已就绪")
                    : textFor(locale, "Setup required", "需要设置")}
                </Badge>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                {textFor(
                  locale,
                  "Participants receive an expiring Plexus link. Raw provider links and credentials stay server-side.",
                  "参与者会收到有时效的 Plexus 链接；平台原始链接与凭证只保留在服务器端。"
                )}
              </p>
            </div>

            <div className="rounded-md border p-4">
              <div className="flex items-center gap-2">
                <Icon icon={ShieldUserIcon} />
                <h3 className="font-medium">
                  {textFor(locale, "Configuration access", "配置权限")}
                </h3>
                <Badge variant="outline" className="ml-auto">
                  {textFor(locale, "Platform managed", "平台管理")}
                </Badge>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                {textFor(
                  locale,
                  "Tenant Admins can review readiness here. Plexus Superadmin manages provider credentials and Lark authorization.",
                  "租户管理员可在此查看就绪状态；平台凭证与 Lark 授权由 Plexus 超级管理员管理。"
                )}
              </p>
            </div>
          </div>

          <Alert>
            <Icon icon={SecurityCheckIcon} />
            <AlertTitle>
              {textFor(locale, "Readiness check", "就绪检查")}
            </AlertTitle>
            <AlertDescription>
              {textFor(
                locale,
                "Online means the required server configuration, protected-link origin and—where required—provider authorization are present. The provider API is validated again when a meeting is created.",
                "“在线”表示所需服务器配置、受保护链接来源及相关平台授权均已就绪；创建会议时系统会再次验证平台 API。"
              )}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}

function MeetingCalendarView({
  db,
  meetings,
  onUpdateMeeting,
  locale = "en",
}: {
  db: LocalDb
  meetings: Meeting[]
  onUpdateMeeting?: (values: MeetingAmendmentInput) => Promise<boolean>
  locale?: Locale
}) {
  const sortedMeetings = [...meetings].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
  )
  const meetingsByDay = sortedMeetings.reduce<
    Array<{ day: string; meetings: Meeting[] }>
  >((groups, meeting) => {
    const day = formatMeetingDay(meeting.startsAt, locale)
    const existing = groups.find((group) => group.day === day)

    if (existing) {
      existing.meetings.push(meeting)
    } else {
      groups.push({ day, meetings: [meeting] })
    }

    return groups
  }, [])
  const activeMeetings = meetings.filter((meeting) =>
    ["Scheduled", "Live"].includes(meeting.status)
  ).length
  const completedMeetings = meetings.filter(
    (meeting) => meeting.status === "Completed"
  ).length
  const totalMinutes = meetings.reduce(
    (total, meeting) => total + meeting.duration,
    0
  )

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <InfoTile
          label={textFor(locale, "Total meetings", "会议总数")}
          value={meetings.length}
        />
        <InfoTile
          label={textFor(locale, "Scheduled / live", "已排期 / 进行中")}
          value={activeMeetings}
        />
        <InfoTile
          label={textFor(locale, "Completed", "已完成")}
          value={completedMeetings}
        />
        <InfoTile
          label={textFor(locale, "Booked time", "已预订时长")}
          value={`${totalMinutes} ${textFor(locale, "min", "分钟")}`}
        />
      </div>

      {meetings.length ? (
        <div className="rounded-md border bg-muted/20 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-base font-semibold">
                {textFor(locale, "Calendar view", "日历视图")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {textFor(
                  locale,
                  "Track each meeting slot with agreement status, host and interpreter coverage.",
                  "按会议时段追踪协议状态、主持人与翻译覆盖。"
                )}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                downloadIcs(
                  "plexus-meeting-calendar",
                  sortedMeetings.map((meeting) => {
                    const match = db.matches.find(
                      (item) => item.id === meeting.matchId
                    )
                    const title = match
                      ? `${getCompanyName(db, match.delegationId)} ↔ ${getCompanyName(db, match.partnerId)}`
                      : `Plexus session ${meeting.id}`

                    return {
                      uid: meeting.id,
                      title,
                      start: new Date(meeting.startsAt),
                      durationMinutes: meeting.duration,
                      location: `${meeting.platform} · ${meeting.link}`,
                      description: `Interpreter: ${meeting.interpreter}. Host: ${meeting.host}. ${meeting.summary}`,
                    }
                  }),
                  "Plexus Connect meeting calendar"
                )
                toast.success(
                  textFor(
                    locale,
                    "Meeting calendar (.ics) downloaded.",
                    "会议日历（.ics）已下载。"
                  )
                )
              }}
            >
              <Icon icon={Download01Icon} inline="inline-start" />
              {textFor(locale, "Export calendar", "导出日历")}
            </Button>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
            {meetingsByDay.map((group) => (
              <div
                key={group.day}
                className="rounded-md border bg-background p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{group.day}</p>
                    <p className="text-xs text-muted-foreground">
                      {textFor(
                        locale,
                        `${group.meetings.length} meeting${group.meetings.length === 1 ? "" : "s"}`,
                        `${group.meetings.length} 场会议`
                      )}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {formatMeetingMonth(group.meetings[0].startsAt, locale)}
                  </Badge>
                </div>

                <div className="mt-3 flex flex-col gap-3">
                  {group.meetings.map((meeting) => {
                    const match = db.matches.find(
                      (item) => item.id === meeting.matchId
                    )
                    const deal = db.deals.find(
                      (item) => item.matchId === meeting.matchId
                    )

                    const companyPair = match
                      ? `${getCompanyName(db, match.delegationId)} ↔ ${getCompanyName(db, match.partnerId)}`
                      : meeting.id
                    const calendarEntry = (
                      <Button
                        variant="ghost"
                        className="h-auto w-full min-w-0 justify-start rounded-md border-l-2 border-primary/70 px-3 py-2 text-left whitespace-normal hover:bg-muted focus-visible:ring-2"
                        aria-label={textFor(
                          locale,
                          `View or edit meeting with ${companyPair}`,
                          `查看或编辑会议：${companyPair}`
                        )}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <Badge variant={statusVariant(meeting.status)}>
                              {meeting.status}
                            </Badge>
                            <Badge variant="outline">
                              {formatMeetingTime(meeting.startsAt, locale)} ·{" "}
                              {meeting.duration}{" "}
                              {textFor(locale, "min", "分钟")}
                            </Badge>
                          </span>
                          <span className="mt-2 block text-sm font-medium">
                            {companyPair}
                          </span>
                          <span className="mt-2 grid gap-1 text-xs text-muted-foreground">
                            <span>
                              {meeting.platform} ·{" "}
                              {textFor(locale, "Host", "主持人")}:{" "}
                              {meeting.host}
                            </span>
                            <span>
                              {textFor(locale, "Interpreter", "翻译")}:{" "}
                              {meeting.interpreter}
                            </span>
                            <span>
                              {textFor(locale, "Agreement", "协议")}:{" "}
                              <span className="font-medium text-foreground">
                                {deal?.status
                                  ? statusLabel(deal.status, locale)
                                  : textFor(locale, "No deal yet", "暂无协议")}
                              </span>
                            </span>
                          </span>
                        </span>
                        <Icon
                          icon={ViewIcon}
                          className="ml-2 shrink-0 self-start"
                        />
                      </Button>
                    )

                    return onUpdateMeeting ? (
                      <MeetingDetailsDialog
                        key={meeting.id}
                        db={db}
                        meeting={meeting}
                        locale={locale}
                        onUpdate={onUpdateMeeting}
                        trigger={calendarEntry}
                      />
                    ) : (
                      <div key={meeting.id}>{calendarEntry}</div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-md border border-dashed bg-muted/10 p-6 text-center">
          <Icon icon={Calendar03Icon} />
          <h3 className="mt-3 font-medium">
            {textFor(locale, "No meetings scheduled", "尚未安排会议")}
          </h3>
          <p className="mx-auto mt-1 max-w-xl text-sm text-muted-foreground">
            {textFor(
              locale,
              "After both Vendors accept a match, create a Zoom or Lark meeting from Matching. It will appear here automatically.",
              "双方供应商接受配对后，可从配对页面创建 Zoom 或 Lark 会议，并自动显示在这里。"
            )}
          </p>
        </div>
      )}
    </div>
  )
}

function formatMeetingDay(value: string, locale: Locale = "en") {
  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-MY", {
    weekday: "short",
    day: "numeric",
    timeZone: "Asia/Kuala_Lumpur",
  }).format(new Date(value))
}

function formatMeetingMonth(value: string, locale: Locale = "en") {
  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-MY", {
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kuala_Lumpur",
  }).format(new Date(value))
}

function formatMeetingTime(value: string, locale: Locale = "en") {
  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-MY", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kuala_Lumpur",
  }).format(new Date(value))
}

function DealTable({
  db,
  deals,
  onCreateDeal,
  onDeal,
  onRefresh,
  locale = "en",
}: {
  db: LocalDb
  deals: Deal[]
  onCreateDeal?: (matchId: string) => Promise<boolean>
  onDeal?: (dealId: string, status: Deal["status"]) => void
  onRefresh?: (successMessage: string) => Promise<boolean>
  locale?: Locale
}) {
  const availableMatches = db.matches.filter(
    (match) => !deals.some((deal) => deal.matchId === match.id)
  )
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [selectedMatchId, setSelectedMatchId] = useState(
    availableMatches[0]?.id ?? ""
  )

  async function createMou() {
    if (!selectedMatchId || !onCreateDeal) {
      return
    }

    setCreating(true)
    const created = await onCreateDeal(selectedMatchId)
    setCreating(false)

    if (created) {
      setCreateOpen(false)
      setSelectedMatchId("")
    }
  }

  return (
    <div className="grid gap-4">
      {onCreateDeal ? (
        <div className="flex flex-col gap-3 rounded-md border bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">
              {textFor(locale, "MOU agreements", "MOU 协议")}
            </p>
            <p className="text-xs text-muted-foreground">
              {textFor(
                locale,
                "Create one agreement for a Vendor match, then attach its draft or signed PDF.",
                "为供应商配对建立协议，再上传草稿或已签署 PDF。"
              )}
            </p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button disabled={!availableMatches.length}>
                <Icon icon={AddIcon} inline="inline-start" />
                {textFor(locale, "Create MOU", "新建 MOU")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {textFor(locale, "Create an MOU record", "建立 MOU 记录")}
                </DialogTitle>
                <DialogDescription>
                  {textFor(
                    locale,
                    "Choose the two matched Vendors. The agreement starts under discussion and can receive one private PDF.",
                    "选择已配对的两家供应商。协议会从洽谈中开始，并可附上一份私密 PDF。"
                  )}
                </DialogDescription>
              </DialogHeader>
              <Field>
                <FieldLabel>
                  {textFor(locale, "Vendor match", "供应商配对")}
                </FieldLabel>
                <Select
                  value={selectedMatchId}
                  onValueChange={setSelectedMatchId}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={textFor(
                        locale,
                        "Select a Vendor match",
                        "选择供应商配对"
                      )}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMatches.map((match) => (
                      <SelectItem key={match.id} value={match.id}>
                        {getCompanyName(db, match.delegationId)} ↔{" "}
                        {getCompanyName(db, match.partnerId)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!availableMatches.length ? (
                  <FieldDescription>
                    {textFor(
                      locale,
                      "Every current match already has an MOU record.",
                      "目前每个配对都已有 MOU 记录。"
                    )}
                  </FieldDescription>
                ) : null}
              </Field>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateOpen(false)}
                >
                  {textFor(locale, "Cancel", "取消")}
                </Button>
                <Button
                  type="button"
                  disabled={!selectedMatchId || creating}
                  onClick={() => void createMou()}
                >
                  <Icon
                    icon={creating ? Loading03Icon : AddIcon}
                    inline="inline-start"
                    className={cn(creating && "animate-spin")}
                  />
                  {creating
                    ? textFor(locale, "Creating…", "建立中…")
                    : textFor(locale, "Create MOU", "建立 MOU")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{textFor(locale, "Deal", "协议")}</TableHead>
              <TableHead>{textFor(locale, "Status", "状态")}</TableHead>
              <TableHead>{textFor(locale, "Document", "文件")}</TableHead>
              <TableHead>{textFor(locale, "Action", "操作")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deals.length ? (
              deals.map((deal) => {
                const match = db.matches.find(
                  (item) => item.id === deal.matchId
                )
                const documentHref = getDealDocumentHref(deal)
                return (
                  <TableRow key={deal.id}>
                    <TableCell>
                      <p className="font-medium">
                        {match
                          ? `${getCompanyName(db, match.delegationId)} ↔ ${getCompanyName(db, match.partnerId)}`
                          : deal.id}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {textFor(locale, "Signatory check", "签署人核验")}:{" "}
                        {statusLabel(deal.signatoryCheck, locale)}
                      </p>
                    </TableCell>
                    <TableCell>
                      {onDeal ? (
                        <Select
                          value={deal.status}
                          onValueChange={(value) =>
                            onDeal(deal.id, value as Deal["status"])
                          }
                        >
                          <SelectTrigger className="min-w-44">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(
                              [
                                "Under Discussion",
                                "Agreement Reached",
                                "Signed",
                                "Failed",
                              ] as Deal["status"][]
                            ).map((status) => (
                              <SelectItem key={status} value={status}>
                                {statusLabel(status, locale)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant={statusVariant(deal.status)}>
                          {statusLabel(deal.status, locale)}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <p className="max-w-64 truncate text-sm font-medium">
                        {documentHref
                          ? deal.document
                          : textFor(locale, "Pending upload", "等待上传")}
                      </p>
                      {deal.documentFileSize && deal.documentUploadedAt ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDocumentSize(deal.documentFileSize)} ·{" "}
                          {formatDocumentDate(deal.documentUploadedAt)}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {documentHref ? (
                          <DocumentViewerDialog
                            deal={deal}
                            documentHref={documentHref}
                            locale={locale}
                          />
                        ) : null}
                        {onRefresh ? (
                          <MouDocumentControls
                            deal={deal}
                            onRefresh={onRefresh}
                            locale={locale}
                          />
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center">
                  <p className="font-medium">
                    {textFor(locale, "No MOU records yet", "尚无 MOU 记录")}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {onCreateDeal
                      ? textFor(
                          locale,
                          "Create an MOU from an existing Vendor match to begin signing.",
                          "从现有供应商配对建立 MOU，即可开始签约流程。"
                        )
                      : textFor(
                          locale,
                          "Your Admin has not published an MOU for this workspace yet.",
                          "管理員尚未在此工作台发布 MOU。"
                        )}
                  </p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function getDealDocumentHref(deal: Deal) {
  if (deal.documentId) {
    return `/api/mou-documents/${deal.documentId}/file`
  }

  if (!deal.document.toLowerCase().endsWith(".pdf")) {
    return null
  }

  return `/documents/${encodeURIComponent(deal.document)}`
}

function MouDocumentControls({
  deal,
  onRefresh,
  locale,
}: {
  deal: Deal
  onRefresh: (successMessage: string) => Promise<boolean>
  locale: Locale
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function uploadDocument(file?: File) {
    if (!file) {
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.set("file", file)
      const response = await fetch(`/api/admin/deals/${deal.id}/document`, {
        method: "POST",
        body: formData,
      })
      const payload = (await response.json().catch(() => null)) as {
        document?: { fileName: string }
        error?: string
      } | null

      if (!response.ok || !payload?.document) {
        throw new Error(payload?.error ?? "The MOU PDF could not be uploaded.")
      }

      await onRefresh(
        deal.documentId
          ? `${payload.document.fileName} replaced the previous MOU PDF.`
          : `${payload.document.fileName} uploaded to private MOU storage.`
      )
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "The MOU PDF could not be uploaded."
      )
    } finally {
      setUploading(false)

      if (inputRef.current) {
        inputRef.current.value = ""
      }
    }
  }

  async function deleteDocument() {
    setDeleting(true)

    try {
      const response = await fetch(`/api/admin/deals/${deal.id}/document`, {
        method: "DELETE",
      })
      const payload = (await response.json().catch(() => null)) as {
        error?: string
      } | null

      if (!response.ok) {
        throw new Error(payload?.error ?? "The MOU PDF could not be deleted.")
      }

      await onRefresh("MOU PDF deleted from private storage.")
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "The MOU PDF could not be deleted."
      )
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <Input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        aria-label={`Upload MOU PDF for ${deal.document}`}
        onChange={(event) => void uploadDocument(event.target.files?.[0])}
      />
      <Button
        type="button"
        variant={deal.documentId ? "outline" : "default"}
        disabled={uploading || deleting}
        onClick={() => inputRef.current?.click()}
      >
        <Icon
          icon={uploading ? Loading03Icon : Upload01Icon}
          inline="inline-start"
          className={cn(uploading && "animate-spin")}
        />
        {uploading
          ? textFor(locale, "Uploading…", "上传中…")
          : deal.documentId
            ? textFor(locale, "Replace PDF", "替换 PDF")
            : textFor(locale, "Upload PDF", "上传 PDF")}
      </Button>
      {deal.documentId ? (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              disabled={uploading || deleting}
            >
              <Icon
                icon={deleting ? Loading03Icon : Delete02Icon}
                inline="inline-start"
                className={cn(deleting && "animate-spin")}
              />
              {textFor(locale, "Delete", "删除")}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {textFor(locale, "Delete this MOU PDF?", "删除此 MOU PDF？")}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {textFor(
                  locale,
                  `${deal.document} will be permanently removed from private storage. The MOU record will remain.`,
                  `${deal.document} 将从私密存储中永久删除，但 MOU 记录会保留。`
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>
                {textFor(locale, "Keep PDF", "保留 PDF")}
              </AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={() => void deleteDocument()}
              >
                {textFor(locale, "Delete PDF", "删除 PDF")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </>
  )
}

function DocumentViewerDialog({
  deal,
  documentHref,
  locale,
}: {
  deal: Deal
  documentHref: string | null
  locale: Locale
}) {
  const hasDocument = Boolean(documentHref)

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Icon icon={File01Icon} inline="inline-start" />
          {textFor(locale, "Open", "打开")}
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[92svh] flex-col overflow-hidden sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>
            {hasDocument
              ? deal.document
              : textFor(locale, "Document not uploaded", "文件尚未上传")}
          </DialogTitle>
          <DialogDescription>
            {hasDocument
              ? textFor(
                  locale,
                  "Preview the MOU PDF without leaving the signing tracker.",
                  "无需离开签约追踪即可预览 MOU PDF。"
                )
              : textFor(
                  locale,
                  "This deal is still pending an uploaded MOU document.",
                  "该协议仍在等待上传 MOU 文件。"
                )}
          </DialogDescription>
        </DialogHeader>
        {documentHref ? (
          <div className="min-h-0 flex-1 overflow-hidden rounded-md border bg-muted/20">
            <iframe
              title={`PDF preview for ${deal.document}`}
              src={`${documentHref}#toolbar=1&navpanes=0`}
              className="h-[70svh] w-full"
            />
          </div>
        ) : (
          <div className="rounded-md border border-dashed p-8 text-center">
            <span className="mx-auto flex size-8 items-center justify-center text-muted-foreground">
              <Icon icon={File01Icon} />
            </span>
            <p className="mt-3 text-sm font-medium">
              {textFor(locale, "Pending upload", "等待上传")}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {textFor(
                locale,
                "Upload the signed or draft MOU PDF before previewing it here.",
                "请先上传已签署或草稿版 MOU PDF，再在此预览。"
              )}
            </p>
          </div>
        )}
        {documentHref ? (
          <DialogFooter className="gap-2">
            <Button asChild variant="outline">
              <a href={documentHref} target="_blank" rel="noreferrer">
                {textFor(locale, "Open in new tab", "在新标签打开")}
              </a>
            </Button>
            <Button asChild>
              <a href={documentHref} download={deal.document}>
                <Icon icon={Download01Icon} inline="inline-start" />
                {textFor(locale, "Download PDF", "下载 PDF")}
              </a>
            </Button>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function CommunicationsPanel({
  db,
  onSendAnnouncement,
  locale,
}: {
  db: LocalDb
  onSendAnnouncement: (values: {
    title: string
    message: string
    target: AnnouncementTarget
    channel: AnnouncementChannel
    status?: Announcement["status"]
  }) => void
  locale: Locale
}) {
  const [title, setTitle] = useState("Event logistics update")
  const [message, setMessage] = useState(
    "Please review the latest agenda and confirm your assigned meeting slots before arrival."
  )
  const [target, setTarget] = useState<AnnouncementTarget>("all")
  const [channel, setChannel] = useState<AnnouncementChannel>("both")

  function submit(status: Announcement["status"]) {
    onSendAnnouncement({ title, message, target, channel, status })
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_1.1fr]">
      <Card>
        <CardHeader>
          <CardTitle>{textFor(locale, "Communications", "通讯")}</CardTitle>
          <CardDescription>
            {textFor(
              locale,
              "Send announcements to all participants or a role group. Email blasts are queued for provider integration; in-app notifications are written immediately.",
              "向全部参与者或指定角色群组发送公告。邮件群发会进入供应商整合队列；站内通知会立即写入。"
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel>
                {textFor(locale, "Audience group", "受众群组")}
              </FieldLabel>
              <Select
                value={target}
                onValueChange={(value) =>
                  setTarget(value as AnnouncementTarget)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">
                      {textFor(locale, "All participants", "全部参与者")}
                    </SelectItem>
                    <SelectItem value="delegation">
                      {textFor(locale, "Delegation", "代表团")}
                    </SelectItem>
                    <SelectItem value="partner">
                      {textFor(locale, "Malaysian partners", "马方伙伴")}
                    </SelectItem>
                    <SelectItem value="admin">
                      {textFor(locale, "Admin team", "管理团队")}
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>
                {textFor(locale, "Delivery channel", "发送渠道")}
              </FieldLabel>
              <Select
                value={channel}
                onValueChange={(value) =>
                  setChannel(value as AnnouncementChannel)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="both">
                      {textFor(locale, "Email + notification", "邮件 + 通知")}
                    </SelectItem>
                    <SelectItem value="email">
                      {textFor(locale, "Email blast", "邮件群发")}
                    </SelectItem>
                    <SelectItem value="notification">
                      {textFor(locale, "In-app notification", "站内通知")}
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>{textFor(locale, "Subject", "主题")}</FieldLabel>
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel>
                {textFor(locale, "Announcement", "公告内容")}
              </FieldLabel>
              <Textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={5}
              />
              <FieldDescription>
                {textFor(
                  locale,
                  "API: POST /api/admin/communications with title, message, target and channel.",
                  "API：POST /api/admin/communications，包含 title、message、target 与 channel。"
                )}
              </FieldDescription>
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          <Button onClick={() => submit("Queued")}>
            <Icon icon={Upload01Icon} inline="inline-start" />
            {textFor(locale, "Queue blast", "加入发送队列")}
          </Button>
          <Button variant="outline" onClick={() => submit("Sent")}>
            {textFor(locale, "Mark sent", "标记已发送")}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {textFor(locale, "Announcement log", "公告记录")}
          </CardTitle>
          <CardDescription>
            {textFor(
              locale,
              "System-generated invite emails and participant notifications are tracked here.",
              "系统生成的邀请邮件与参与者通知会在此追踪。"
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {db.announcements.map((announcement) => (
            <div key={announcement.id} className="rounded-md border p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{announcement.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {announcement.message}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">
                    {audienceLabel(announcement.target, locale)}
                  </Badge>
                  <Badge variant="outline">
                    {channelLabel(announcement.channel, locale)}
                  </Badge>
                  <Badge variant={statusVariant(announcement.status)}>
                    {statusLabel(announcement.status, locale)}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function ResourcesPanel({
  db,
  onCreateResource,
  onUploadResource,
  onToggleVisibility,
  locale,
}: {
  db: LocalDb
  onCreateResource: (values: {
    title: string
    category: ResourceCategory
    fileName: string
    fileUrl: string
    audience: ResourceAudience
    visibleToDelegation: boolean
    notes: string
  }) => void
  onUploadResource: (formData: FormData) => Promise<void>
  onToggleVisibility: (resourceId: string, visibleToDelegation: boolean) => void
  locale: Locale
}) {
  const router = useRouter()
  const [title, setTitle] = useState("September event agenda")
  const [category, setCategory] = useState<ResourceCategory>("Agenda")
  const [fileName, setFileName] = useState("september-event-agenda.pdf")
  const [fileUrl, setFileUrl] = useState(
    "/documents/AgriCloud-JohorHub-MOU-draft.pdf"
  )
  const [audience, setAudience] = useState<ResourceAudience>("delegation")
  const [visibleToDelegation, setVisibleToDelegation] = useState(true)
  const [notes, setNotes] = useState(
    "Visible to delegation after admin review."
  )
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  async function submitResource() {
    if (!selectedFile) {
      onCreateResource({
        title,
        category,
        fileName,
        fileUrl,
        audience,
        visibleToDelegation,
        notes,
      })
      return
    }

    const formData = new FormData()
    formData.set("title", title)
    formData.set("category", category)
    formData.set("audience", audience)
    formData.set("visibleToDelegation", String(visibleToDelegation))
    formData.set("notes", notes)
    formData.set("file", selectedFile)

    setIsUploading(true)
    await onUploadResource(formData)
    setIsUploading(false)
    setSelectedFile(null)
    setFileName(selectedFile.name)
    router.refresh()
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_1.1fr]">
      <Card>
        <CardHeader>
          <CardTitle>
            {textFor(locale, "Documents & Resources", "文件与资源")}
          </CardTitle>
          <CardDescription>
            {textFor(
              locale,
              "Upload event materials such as agendas, maps and briefing documents, then control what is visible to the delegation.",
              "上传议程、地图、简报等活动资料，并管理代表团可见内容。"
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel>
                {textFor(locale, "Material title", "资料标题")}
              </FieldLabel>
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>{textFor(locale, "Category", "类别")}</FieldLabel>
                <Select
                  value={category}
                  onValueChange={(value) =>
                    setCategory(value as ResourceCategory)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {["Agenda", "Map", "Briefing", "Logistics", "Other"].map(
                        (item) => (
                          <SelectItem key={item} value={item}>
                            {categoryLabel(item as ResourceCategory, locale)}
                          </SelectItem>
                        )
                      )}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>
                  {textFor(locale, "Visible to", "可见对象")}
                </FieldLabel>
                <Select
                  value={audience}
                  onValueChange={(value) =>
                    setAudience(value as ResourceAudience)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="all">
                        {textFor(locale, "All participants", "全部参与者")}
                      </SelectItem>
                      <SelectItem value="delegation">
                        {textFor(locale, "Delegation", "代表团")}
                      </SelectItem>
                      <SelectItem value="partner">
                        {textFor(locale, "Malaysian partners", "马方伙伴")}
                      </SelectItem>
                      <SelectItem value="admin">
                        {textFor(locale, "Admin only", "仅管理员")}
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field>
              <FieldLabel>
                {textFor(locale, "Upload file", "上传文件")}
              </FieldLabel>
              <Input
                type="file"
                accept=".pdf,.docx,.pptx,image/png,image/jpeg,image/webp"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null
                  setSelectedFile(file)
                  if (file) {
                    setFileName(file.name)
                    setFileUrl("")
                  }
                }}
              />
              <FieldDescription>
                {textFor(
                  locale,
                  "PDF, briefing decks, Word documents and venue maps up to 15 MB.",
                  "支持 PDF、简报、Word 文件与场地地图，最大 15 MB。"
                )}
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel>
                {textFor(locale, "File name", "文件名称")}
              </FieldLabel>
              <Input
                value={fileName}
                onChange={(event) => setFileName(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel>{textFor(locale, "File URL", "文件 URL")}</FieldLabel>
              <Input
                value={fileUrl}
                onChange={(event) => setFileUrl(event.target.value)}
              />
              <FieldDescription>
                {textFor(
                  locale,
                  "Use this for an existing URL. New uploads use POST /api/admin/resources/upload and open through an authenticated signed-file route.",
                  "现有链接可填在这里。新上传会使用 POST /api/admin/resources/upload，并通过已认证的签名文件路由打开。"
                )}
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel>{textFor(locale, "Notes", "备注")}</FieldLabel>
              <Textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </Field>
            <Field orientation="horizontal" className="rounded-md border p-3">
              <Checkbox
                checked={visibleToDelegation}
                onCheckedChange={(checked) =>
                  setVisibleToDelegation(checked === true)
                }
              />
              <FieldTitle>
                {textFor(
                  locale,
                  "Visible to delegation portal",
                  "代表团门户可见"
                )}
              </FieldTitle>
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter>
          <Button onClick={() => void submitResource()} disabled={isUploading}>
            <Icon icon={Upload01Icon} inline="inline-start" />
            {selectedFile
              ? textFor(locale, "Upload material", "上传资料")
              : textFor(locale, "Add material", "新增资料")}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {textFor(locale, "Delegation-visible library", "代表团可见资料库")}
          </CardTitle>
          <CardDescription>
            {textFor(
              locale,
              "Manage which event materials are available to delegation users.",
              "管理哪些活动资料可供代表团用户查看。"
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {db.resources.map((resource) => (
            <div key={resource.id} className="rounded-md border p-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{resource.title}</p>
                    <Badge variant="outline">
                      {categoryLabel(resource.category, locale)}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {resource.fileName} ·{" "}
                    {audienceLabel(resource.audience, locale)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {resource.notes}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline">
                    <a href={resource.fileUrl} target="_blank" rel="noreferrer">
                      {textFor(locale, "Open", "打开")}
                    </a>
                  </Button>
                  <Button
                    variant={
                      resource.visibleToDelegation ? "default" : "outline"
                    }
                    onClick={() =>
                      onToggleVisibility(
                        resource.id,
                        !resource.visibleToDelegation
                      )
                    }
                  >
                    {resource.visibleToDelegation
                      ? textFor(locale, "Visible", "可见")
                      : textFor(locale, "Hidden", "隐藏")}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function CheckInBoard({
  db,
  onCheckIn,
  locale,
}: {
  db: LocalDb
  onCheckIn: (partnerId: string) => void
  locale: Locale
}) {
  const invited = db.partnerCompanies.filter((partner) =>
    ["Invited", "Confirmed", "Arrived"].includes(partner.attendance)
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>{textFor(locale, "Guest check-in", "嘉宾签到")}</CardTitle>
        <CardDescription>
          {textFor(
            locale,
            "QR scan and manual check-in simulation for event day.",
            "活动当天二维码扫描与人工签到模拟。"
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <InfoTile
            label={textFor(locale, "Arrived", "已抵达")}
            value={
              db.partnerCompanies.filter((partner) => partner.arrived).length
            }
          />
          <InfoTile
            label={textFor(locale, "Invited", "已邀请")}
            value={invited.length}
          />
        </div>
        {invited.map((partner) => (
          <div
            key={partner.id}
            className="flex items-center justify-between gap-3 rounded-md border p-3"
          >
            <div>
              <p className="text-sm font-medium">{partner.nameEn}</p>
              <p className="text-xs text-muted-foreground">{partner.contact}</p>
            </div>
            <Button
              variant={partner.arrived ? "outline" : "default"}
              onClick={() => onCheckIn(partner.id)}
            >
              <Icon icon={QrCodeIcon} inline="inline-start" />
              {partner.arrived
                ? textFor(locale, "Arrived", "已抵达")
                : textFor(locale, "Check in", "签到")}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function ItineraryBoard({
  db,
  onPublish,
  locale,
}: {
  db: LocalDb
  onPublish: (slotId: string) => void
  locale: Locale
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {textFor(locale, "Itinerary manager", "行程管理")}
        </CardTitle>
        <CardDescription>
          {textFor(
            locale,
            "Publish read-only schedule updates to delegation portal.",
            "将只读行程更新发布到代表团门户。"
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {db.itinerary.map((slot) => (
          <div key={slot.id} className="rounded-md border p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium">
                  {slot.day} · {slot.time}
                </p>
                <p className="text-sm text-muted-foreground">{slot.activity}</p>
                <p className="text-xs text-muted-foreground">
                  {slot.venue} · {slot.escort}
                </p>
              </div>
              <Field orientation="horizontal" className="w-auto">
                <Checkbox
                  checked={slot.published}
                  onCheckedChange={() => onPublish(slot.id)}
                />
                <FieldTitle>
                  {textFor(locale, "Published", "已发布")}
                </FieldTitle>
              </Field>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function SiteVisitBoard({ db, locale }: { db: LocalDb; locale: Locale }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{textFor(locale, "Site visits", "现场参访")}</CardTitle>
        <CardDescription>
          {textFor(
            locale,
            "Driver, escort and confirmation tracking.",
            "司机、陪同人员与确认状态追踪。"
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {db.siteVisits.map((visit) => (
          <div key={visit.id} className="rounded-md border p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{visit.venue}</p>
                <p className="text-sm text-muted-foreground">
                  {visit.date} · {visit.time} · {visit.escort}
                </p>
                <p className="text-xs text-muted-foreground">{visit.notes}</p>
              </div>
              <Badge variant={statusVariant(visit.status)}>
                {statusLabel(visit.status, locale)}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function LiaisonBoard({ db, locale }: { db: LocalDb; locale: Locale }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{textFor(locale, "Official liaison", "官方联络")}</CardTitle>
        <CardDescription>
          {textFor(
            locale,
            "Government contact directory and protocol notes.",
            "政府联系人目录与礼宾备注。"
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {db.liaison.map((contact) => (
          <div key={contact.id} className="rounded-md border p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{contact.name}</p>
                <p className="text-sm text-muted-foreground">
                  {contact.title} · {contact.organisation}
                </p>
                <p className="text-xs text-muted-foreground">
                  {contact.protocol}
                </p>
              </div>
              <Badge variant={statusVariant(contact.status)}>
                {statusLabel(contact.status, locale)}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function exportPreVisitReport(db: LocalDb, locale: Locale = "en") {
  downloadCsv("plexus-pre-visit-report", db.matches, [
    {
      header: "Delegation",
      value: (match) => getCompanyName(db, match.delegationId),
    },
    {
      header: "Malaysian partner",
      value: (match) => getCompanyName(db, match.partnerId),
    },
    { header: "Fit score %", value: (match) => match.score },
    { header: "Match status", value: (match) => match.status },
    {
      header: "Session",
      value: (match) => {
        const meeting = db.meetings.find((item) => item.matchId === match.id)
        return meeting
          ? `${meeting.status} (${meeting.platform})`
          : "Not scheduled"
      },
    },
    { header: "Notes", value: (match) => match.note },
  ])
  toast.success(
    textFor(
      locale,
      "Pre-visit report exported to CSV.",
      "访前报告已导出为 CSV。"
    )
  )
}

function exportPostEventReport(db: LocalDb, locale: Locale = "en") {
  downloadCsv("plexus-post-event-report", db.partnerCompanies, [
    { header: "Partner", value: (partner) => partner.nameEn },
    { header: "Sector", value: (partner) => partner.sector },
    { header: "Attendance", value: (partner) => partner.attendance },
    { header: "Arrived", value: (partner) => (partner.arrived ? "Yes" : "No") },
    { header: "Verified", value: (partner) => partner.verified },
    {
      header: "Matches",
      value: (partner) =>
        db.matches.filter((match) => match.partnerId === partner.id).length,
    },
  ])
  toast.success(
    textFor(
      locale,
      "Post-event report exported to CSV.",
      "活动后报告已导出为 CSV。"
    )
  )
}

function ReportsPanel({
  db,
  metrics,
  locale,
}: {
  db: LocalDb
  metrics: ReturnType<typeof getMetrics>
  locale: Locale
}) {
  const reports = [
    {
      title: textFor(locale, "Pre-visit report", "访前报告"),
      desc: textFor(
        locale,
        "Match summary, sessions held and signing conversion rate.",
        "配对摘要、已举行会议与签约转化率。"
      ),
      items: [
        textFor(
          locale,
          `${db.matches.length} match records`,
          `${db.matches.length} 条配对记录`
        ),
        textFor(
          locale,
          `${metrics.sessionsCompleted} sessions completed`,
          `${metrics.sessionsCompleted} 场会议已完成`
        ),
        textFor(
          locale,
          `${metrics.conversion}% signing conversion`,
          `${metrics.conversion}% 签约转化`
        ),
      ],
      onExport: () => exportPreVisitReport(db, locale),
    },
    {
      title: textFor(locale, "Post-event report", "活动后报告"),
      desc: textFor(
        locale,
        "Attendance, face-to-face outcomes and 30 / 60 / 90-day follow-up.",
        "出席情况、面对面成果与 30 / 60 / 90 天跟进。"
      ),
      items: [
        textFor(
          locale,
          `${metrics.arrived} guests arrived`,
          `${metrics.arrived} 位嘉宾已抵达`
        ),
        textFor(
          locale,
          `${db.siteVisits.length} site visits`,
          `${db.siteVisits.length} 场现场参访`
        ),
        textFor(
          locale,
          `${db.deals.length} follow-up deals`,
          `${db.deals.length} 项后续协议`
        ),
      ],
      onExport: () => exportPostEventReport(db, locale),
    },
  ]

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {reports.map((report) => (
        <Card key={report.title}>
          <CardHeader>
            <CardTitle>{report.title}</CardTitle>
            <CardDescription>{report.desc}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {report.items.map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm">
                <Icon icon={CheckmarkCircle02Icon} />
                <span>{item}</span>
              </div>
            ))}
            <Separator />
            <p className="text-xs text-muted-foreground">
              {textFor(
                locale,
                "Exports a UTF-8 CSV (Excel-ready, includes Chinese names) of the live Supabase data.",
                "导出实时 Supabase 数据为 UTF-8 CSV（Excel 可读，包含中文名称）。"
              )}
            </p>
          </CardContent>
          <CardFooter className="flex flex-wrap gap-2">
            <Button onClick={report.onExport}>
              <Icon icon={Download01Icon} inline="inline-start" />
              {textFor(locale, "Export CSV", "导出 CSV")}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

function matchCompanyQuery(
  company: DelegationCompany | PartnerCompany,
  query: string
) {
  if (!query.trim()) {
    return true
  }

  const haystack = [
    company.nameEn,
    company.nameCn,
    company.sector,
    company.status,
    "origin" in company ? company.origin : company.type,
  ]
    .join(" ")
    .toLowerCase()

  return haystack.includes(query.toLowerCase())
}
