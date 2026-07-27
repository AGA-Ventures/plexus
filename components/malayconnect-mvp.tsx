"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  AddIcon,
  Alert02Icon,
  AnalyticsUpIcon,
  ArrowDown01Icon,
  Building01Icon,
  Calendar03Icon,
  CameraVideoIcon,
  CheckmarkCircle02Icon,
  Download01Icon,
  File01Icon,
  Menu01Icon,
  QrCodeIcon,
  ShieldUserIcon,
  TranslationIcon,
  Upload01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons"
import { toast } from "sonner"

import { logoutAction } from "@/app/actions/auth"
import {
  addMatchAction,
  assignMeetingInterpreterAction,
  checkInPartnerAction,
  completeMeetingAction,
  confirmAttendanceAction,
  createCompanyAction,
  createInterpreterAction,
  createResourceAction,
  deleteCompanyAction,
  deleteInterpreterAction,
  publishItineraryAction,
  scheduleMeetingAction,
  sendAnnouncementAction,
  toggleResourceVisibilityAction,
  updateCompanyAction,
  updateCompanyProfileAction,
  updateDealAction,
  updateInterpreterAction,
  updateMatchStatusAction,
} from "@/app/actions/plexus"
import { downloadCsv, downloadIcs } from "@/lib/export"
import {
  isChineseLocale,
  localeLabels,
  localeNames,
  locales,
  type Locale,
} from "@/lib/i18n"
import { supportedMarketNames } from "@/lib/markets"
import {
  type Announcement,
  type AnnouncementChannel,
  type AnnouncementTarget,
  type CompanyRegistrationProfile,
  getCompanyName,
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
import { scoreMatch } from "@/lib/matching"
import type { PortalSession } from "@/lib/plexus-data"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AdminVendorProvision } from "@/components/admin-vendor-provision"
import { TenantProfileDialog } from "@/components/tenant-profile-dialog"
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
      "Supabase Auth account, portal access and session controls.",
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
    userProfileDescription: "Supabase Auth 账号、门户访问与会话控制。",
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
    userProfileDescription: "Supabase Auth 帳號、門戶存取與工作階段控制。",
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
    userProfileDescription:
      "บัญชี Supabase Auth การเข้าถึงพอร์ทัล และการควบคุมเซสชัน",
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
  "Zoom and VooV links are pre-generated and stored in Supabase for launch tracking.":
    "ลิงก์ Zoom และ VooV ถูกสร้างไว้ล่วงหน้าและจัดเก็บใน Supabase เพื่อติดตามช่วงเปิดตัว",
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
    ["配对", "配對"],
    ["企业", "企業"],
    ["会议", "會議"],
    ["请求", "請求"],
    ["请", "請"],
    ["调整", "調整"],
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
  industries: [
    "Food & Beverage",
    "Halal Products",
    "Tourism & Hospitality",
    "Hotels & Resorts",
    "Gaming & Entertainment",
    "Retail & E-commerce",
    "Healthcare & Medical",
    "Pharmaceuticals",
    "Beauty & Wellness",
    "Education & Training",
    "Financial Services & FinTech",
    "Information Technology & Digital Solutions",
    "AI & Emerging Technologies",
    "Smart City Solutions",
    "Manufacturing",
    "Electronics & Electrical",
    "Construction & Property",
    "Green Technology & Sustainability",
    "Logistics & Supply Chain",
    "Professional Services",
    "Franchise Opportunities",
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
    { value: "meetings", label: t.meetings, icon: CameraVideoIcon },
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
}: {
  icon: Parameters<typeof HugeiconsIcon>[0]["icon"]
  inline?: "inline-start" | "inline-end"
}) {
  return <HugeiconsIcon icon={icon} data-icon={inline} strokeWidth={1.7} />
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
}: {
  role: PortalRole
  locale?: Locale
  initialDb: LocalDb
  session: PortalSession
}) {
  const router = useRouter()
  const [db, setDb] = useState<LocalDb>(initialDb)
  const [, setIsSaving] = useState(false)
  const [query, setQuery] = useState("")
  const [selectedDelegation, setSelectedDelegation] = useState(
    initialDb.delegationCompanies[0]?.id ?? ""
  )
  const [selectedPartner, setSelectedPartner] = useState(
    initialDb.partnerCompanies[0]?.id ?? ""
  )

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

  async function applyServerResult(
    action: Promise<{ ok: true; db: LocalDb } | { ok: false; error: string }>,
    successMessage: string
  ) {
    setIsSaving(true)
    try {
      const result = await action

      if (!result.ok) {
        toast.error(result.error)
        return
      }

      setDb(result.db)
      toast.success(successMessage)
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Supabase action failed."
      )
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
      "Meeting requested with a pre-generated join link."
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
            updateMatchStatus={updateMatchStatus}
            scheduleMeeting={scheduleMeeting}
            completeMeeting={completeMeeting}
            assignMeetingInterpreter={assignMeetingInterpreter}
            createInterpreter={createInterpreter}
            updateInterpreter={updateInterpreter}
            deleteInterpreter={deleteInterpreter}
            updateDeal={updateDeal}
            checkInPartner={checkInPartner}
            publishItinerary={publishItinerary}
            sendAnnouncement={sendAnnouncement}
            createResource={createResource}
            uploadResource={uploadResource}
            toggleResourceVisibility={toggleResourceVisibility}
          />
        ) : role === "delegation" ? (
          <DelegationPortal
            company={selectedDelegationCompany}
            dashboardHeader={
              <DashboardHeader copy={copy} metrics={metrics} locale={locale} />
            }
            role={role}
            locale={locale}
            session={session}
            logout={logout}
            companies={db.delegationCompanies}
            setCompany={setSelectedDelegation}
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
              <DashboardHeader copy={copy} metrics={metrics} locale={locale} />
            }
            role={role}
            locale={locale}
            session={session}
            logout={logout}
            companies={db.partnerCompanies}
            setCompany={setSelectedPartner}
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

function OperationalAlert({
  message,
  locale,
}: {
  message: string
  locale: Locale
}) {
  const t = getUiCopy(locale)

  return (
    <Alert>
      <Icon icon={Alert02Icon} />
      <AlertTitle>{t.operationalAlerts}</AlertTitle>
      <AlertDescription>
        {message} {t.persistedNotice}
      </AlertDescription>
    </Alert>
  )
}

function AdminPortal(props: {
  db: LocalDb
  role: PortalRole
  locale: Locale
  copy: Record<string, string>
  session: PortalSession
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
  updateMatchStatus: (matchId: string, status: MatchStatus) => void
  scheduleMeeting: (
    match: Match,
    requestedSlots?: string[],
    requestedInterpreterId?: string | null
  ) => void
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
  updateDeal: (dealId: string, status: Deal["status"]) => void
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
}) {
  const {
    db,
    role,
    locale,
    copy,
    session,
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
    updateMatchStatus,
    scheduleMeeting,
    completeMeeting,
    assignMeetingInterpreter,
    createInterpreter,
    updateInterpreter,
    deleteInterpreter,
    updateDeal,
    checkInPartner,
    publishItinerary,
    sendAnnouncement,
    createResource,
    uploadResource,
    toggleResourceVisibility,
  } = props
  const [activeTab, setActiveTab] = useState("dashboard")
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
        items={adminTabItems(locale)}
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
          <Alert>
            <Icon icon={ShieldUserIcon} />
            <AlertTitle>
              {textFor(locale, "Tenant-scoped Admin view", "租户范围管理员视图")}
            </AlertTitle>
            <AlertDescription>
              {textFor(
                locale,
                "Every table below is restricted to Vendors and operations assigned to your Admin tenant. Other Admin tenants are blocked by row-level security.",
                "下方每个表格仅显示分配给您管理员租户的供应商与运营数据；其他管理员租户由行级安全策略隔离。"
              )}
            </AlertDescription>
          </Alert>
          <OperationalAlert message={db.notifications[0]} locale={locale} />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button asChild variant="outline">
              <Link href={`/${locale}/admin/vendors`}>
                Manage Vendor accounts
              </Link>
            </Button>
            {session.adminId ? (
              <>
                <AdminVendorProvision
                  locale={locale}
                  adminId={session.adminId}
                />
                <TenantProfileDialog
                  locale={locale}
                  tenantId={session.adminId}
                  initialName={session.tenantName}
                  initialSupportEmail={session.tenantSupportEmail}
                  initialPrimaryColor={session.tenantPrimaryColor}
                  initialLogoUrl={session.tenantLogoUrl}
                  triggerLabel="Tenant settings"
                />
              </>
            ) : null}
            <Button asChild variant="outline">
              <Link href={`/${locale}/compliance`}>
                Compliance integrations
              </Link>
            </Button>
          </div>
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
                onStatus={updateMatchStatus}
                onSchedule={scheduleMeeting}
                locale={locale}
              />
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="meetings" className="min-w-0">
        <Card>
          <CardHeader>
            <CardTitle>
              {textFor(locale, "Online meeting scheduler", "线上会议排程")}
            </CardTitle>
            <CardDescription>
              {textFor(
                locale,
                "Zoom and VooV links are pre-generated and stored in Supabase for launch tracking. Assign or confirm interpreters per session below.",
                "Zoom 与 VooV 链接已预先生成，并存入 Supabase 以便上线追踪。可在下方为每场会议分配或确认翻译。"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <MeetingCalendarView
              db={db}
              meetings={db.meetings}
              locale={locale}
            />
            <Separator />
            <SessionList
              db={db}
              meetings={db.meetings}
              onComplete={completeMeeting}
              onAssignInterpreter={assignMeetingInterpreter}
              locale={locale}
            />
          </CardContent>
        </Card>
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
              onDeal={updateDeal}
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
  companies: DelegationCompany[]
  setCompany: (value: string) => void
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
    companies,
    setCompany,
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
      dashboard={
        <div className="flex flex-col gap-4">
          {dashboardHeader}
          <OperationalAlert message={db.notifications[0]} locale={locale} />
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
          selectedId={company.id}
          companies={companies}
          onSelect={setCompany}
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
  companies: PartnerCompany[]
  setCompany: (value: string) => void
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
    companies,
    setCompany,
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
      dashboard={
        <div className="flex flex-col gap-4">
          {dashboardHeader}
          <OperationalAlert message={db.notifications[0]} locale={locale} />
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
          selectedId={company.id}
          companies={companies}
          onSelect={setCompany}
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
}) {
  const items = portalTabItems(locale, profileLabel)
  const [activeTab, setActiveTab] = useState("dashboard")

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

function ResponsiveTabsNav({
  items,
  activeValue,
  onValueChange,
  role,
  locale,
  session,
  logout,
}: {
  items: NavItem[]
  activeValue?: string
  onValueChange?: (value: string) => void
  role: PortalRole
  locale: Locale
  session: PortalSession
  logout: () => void
}) {
  const t = getUiCopy(locale)
  const navTriggerClass =
    "h-10 w-full justify-start gap-2 rounded-md px-3 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-sidebar-ring/45 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=active]:hover:bg-primary"
  const childTriggerClass =
    "h-8 w-full justify-start gap-2 rounded-md px-3 pl-8 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[state=active]:bg-sidebar-accent data-[state=active]:text-sidebar-accent-foreground data-[state=active]:shadow-none"
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const activeLabel =
    items
      .flatMap((item) => [
        { value: item.value, label: item.label },
        ...(item.children ?? []),
      ])
      .find((item) => item.value === activeValue)?.label ??
    items[0]?.label ??
    t.navigation

  function isGroupOpen(item: NavItem) {
    const isActive =
      item.children?.some((child) => child.value === activeValue) ?? false
    return openGroups[item.value] ?? isActive
  }

  function renderNavItems(onNavigate?: () => void) {
    return items.map((item) => {
      if (!item.children) {
        return (
          <TabsTrigger
            key={item.value}
            value={item.value}
            className={navTriggerClass}
            onClick={onNavigate}
          >
            <HugeiconsIcon
              icon={item.icon}
              strokeWidth={1.7}
              className="size-4"
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
              "relative inline-flex flex-1 items-center border border-transparent py-0.5 text-xs font-medium whitespace-nowrap transition-all outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
              navTriggerClass
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
              className="size-4"
            />
            <span className="min-w-0 flex-1 text-left">{item.label}</span>
            <HugeiconsIcon
              icon={ArrowDown01Icon}
              strokeWidth={1.7}
              className={cn(
                "size-3.5 transition-transform",
                groupOpen ? "rotate-180" : ""
              )}
            />
          </button>
          {groupOpen ? (
            <div className="flex flex-col gap-1">
              {item.children.map((child) => (
                <TabsTrigger
                  key={child.value}
                  value={child.value}
                  className={childTriggerClass}
                  onClick={() => {
                    onValueChange?.(child.value)
                    onNavigate?.()
                  }}
                >
                  <HugeiconsIcon
                    icon={child.icon}
                    strokeWidth={1.7}
                    className="size-3.5"
                  />
                  {child.label}
                </TabsTrigger>
              ))}
            </div>
          ) : null}
        </div>
      )
    })
  }

  return (
    <>
      <aside className="hidden self-stretch lg:block">
        <div className="sticky top-4 flex min-h-[calc(100svh-12rem)] flex-col rounded-lg border border-sidebar-border bg-sidebar p-3 text-sidebar-foreground shadow-sm">
          <div className="mb-3 rounded-md border border-sidebar-border bg-background/70 px-3 py-2">
            <p className="text-xs font-semibold text-sidebar-foreground">
              Plexus Connect
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t.workspaceSubtitle}
            </p>
          </div>
          <TabsList className="h-auto w-full flex-col items-stretch gap-1 bg-transparent p-0">
            {renderNavItems()}
          </TabsList>
          <SidebarUserAccount
            role={role}
            locale={locale}
            session={session}
            logout={logout}
          />
        </div>
      </aside>
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <div className="sticky top-3 z-30 flex items-center gap-3 rounded-lg border border-sidebar-border bg-sidebar/95 p-2.5 text-sidebar-foreground shadow-sm backdrop-blur-sm lg:hidden">
          <div className="min-w-0 flex-1 px-1.5">
            <p className="truncate text-xs font-semibold text-sidebar-foreground">
              Plexus Connect
            </p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {activeLabel}
            </p>
          </div>
          <SheetTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-10 shrink-0 gap-2 border-sidebar-border bg-background/80 px-3 text-sidebar-foreground"
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
          className="w-[min(86vw,20rem)] border-sidebar-border bg-sidebar p-0 text-sidebar-foreground"
        >
          <SheetHeader className="border-b border-sidebar-border px-5 py-4">
            <SheetTitle className="text-sidebar-foreground">
              Plexus Connect
            </SheetTitle>
            <SheetDescription>{t.workspaceSubtitle}</SheetDescription>
          </SheetHeader>
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
              <p className="mb-2 px-3 text-[0.6875rem] font-medium tracking-wide text-muted-foreground uppercase">
                {t.navigation}
              </p>
              <TabsList className="h-auto w-full flex-col items-stretch gap-1 bg-transparent p-0">
                {renderNavItems(() => setMobileNavOpen(false))}
              </TabsList>
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
  const currentRoleLink = roleLinks.find((item) => item.role === role)
  const workspaceRoute = session.role
  const roleLabel = currentRoleLink
    ? localizedLabel(currentRoleLink.label, locale)
    : session.role
  const emailName = session.email.split("@")[0] ?? session.email

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="mt-3 flex w-full items-center gap-3 rounded-md border border-sidebar-border bg-background/80 px-3 py-2.5 text-left shadow-xs transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring/45 focus-visible:outline-none lg:mt-auto"
        >
          <Avatar className="size-8">
            <AvatarFallback className="text-xs">
              {getInitials(emailName)}
            </AvatarFallback>
          </Avatar>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-semibold text-sidebar-foreground">
              {session.email}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t.userProfile}</DialogTitle>
          <DialogDescription>{t.userProfileDescription}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 rounded-md border bg-muted/30 p-3">
            <Avatar className="size-10">
              <AvatarFallback>{getInitials(emailName)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{session.email}</p>
              <p className="text-xs text-muted-foreground">
                {roleLabel} {t.account} · Supabase Auth
              </p>
            </div>
          </div>
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <InfoTile label={t.launchRole} value={session.role} />
            <InfoTile label={t.locale} value={localeNames[locale]} />
          </div>
          <InfoTile label={t.userId} value={session.userId} />
          <Separator />
          <div className="grid gap-2">
            <p className="text-xs font-medium text-muted-foreground">
              {t.language}
            </p>
            <ToggleGroup
              type="single"
              value={locale}
              variant="outline"
              size="sm"
              className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4"
            >
              {locales.map((item) => (
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
          {session.adminId ? (
            <InfoTile label="Tenant ID" value={session.adminId} />
          ) : null}
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="outline" onClick={logout}>
            {t.logout}
          </Button>
          <Button asChild>
            <Link href={`/${locale}/${workspaceRoute}`}>
              {t.openRolePage.replace("{role}", roleLabel)}
            </Link>
          </Button>
        </DialogFooter>
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
              <Button className="mt-3" asChild>
                <a href={nextMeeting.link} target="_blank" rel="noreferrer">
                  <Icon icon={CameraVideoIcon} inline="inline-start" />
                  Join meeting
                </a>
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
      {attendance ?? <UserItinerary db={db} compact />}
    </div>
  )
}

function ProfileForm({
  selectedId,
  companies,
  onSelect,
  onSave,
}: {
  selectedId: string
  companies: Array<DelegationCompany | PartnerCompany>
  onSelect: (value: string) => void
  onSave: (profile: CompanyRegistrationProfile) => void
}) {
  const company =
    companies.find((item) => item.id === selectedId) ?? companies[0]
  const [profile, setProfile] = useState(() => getRegistrationProfile(company))

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Macau-Malaysia B2B registration profile</CardTitle>
        <CardDescription>
          Admin creates the company shell with name and email. Participants
          complete the detailed matchmaking profile here.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <FieldGroup>
          <Field>
            <FieldLabel>Production account</FieldLabel>
            <Select value={selectedId} onValueChange={onSelect}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {companies.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.nameEn}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>

        <ProfileSection title="1. Company information">
          <div className="grid gap-4 md:grid-cols-2">
            <ProfileTextField
              id="company-name-en"
              label="Company name (English)"
              value={profile.companyNameEn}
              onChange={(value) => setValue("companyNameEn", value)}
            />
            <ProfileTextField
              id="company-name-cn"
              label="Company name (Chinese, if applicable)"
              value={profile.companyNameCn}
              onChange={(value) => setValue("companyNameCn", value)}
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
              value={profile.countryOther}
              onChange={(value) => setValue("countryOther", value)}
            />
          ) : null}
          <div className="grid gap-4 md:grid-cols-2">
            <ProfileTextField
              id="year-established"
              label="Year established"
              value={profile.yearEstablished}
              onChange={(value) => setValue("yearEstablished", value)}
            />
            <ProfileTextField
              id="registration-number"
              label="Company registration number"
              value={profile.registrationNumber}
              onChange={(value) => setValue("registrationNumber", value)}
            />
            <ProfileTextField
              id="website"
              label="Website"
              value={profile.website}
              onChange={(value) => setValue("website", value)}
            />
            <ProfileTextField
              id="address"
              label="Company address"
              value={profile.address}
              onChange={(value) => setValue("address", value)}
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

        <ProfileSection title="2. Contact person">
          <div className="grid gap-4 md:grid-cols-2">
            <ProfileTextField
              id="contact-name"
              label="Name"
              value={profile.contactName}
              onChange={(value) => setValue("contactName", value)}
            />
            <ProfileTextField
              id="contact-position"
              label="Position"
              value={profile.contactPosition}
              onChange={(value) => setValue("contactPosition", value)}
            />
            <ProfileTextField
              id="contact-email"
              label="Email"
              type="email"
              value={profile.contactEmail}
              onChange={(value) => setValue("contactEmail", value)}
            />
            <ProfileTextField
              id="mobile-number"
              label="Mobile number"
              value={profile.mobileNumber}
              onChange={(value) => setValue("mobileNumber", value)}
            />
            <ProfileTextField
              id="chat-id"
              label="WhatsApp / WeChat ID"
              value={profile.chatId}
              onChange={(value) => setValue("chatId", value)}
            />
          </div>
          <ProfileCheckboxGroup
            label="Preferred language"
            options={profileOptionGroups.preferredLanguages}
            values={profile.preferredLanguages}
            onToggle={(value) => toggleList("preferredLanguages", value)}
          />
        </ProfileSection>

        <ProfileSection title="3. Industry / sector">
          <ProfileCheckboxGroup
            label="Select all applicable"
            options={profileOptionGroups.industries}
            values={profile.industries}
            onToggle={(value) => toggleList("industries", value)}
          />
          <ProfileTextField
            id="industry-other"
            label="Other industry"
            value={profile.industryOther}
            onChange={(value) => setValue("industryOther", value)}
          />
        </ProfileSection>

        <ProfileSection title="4. Company profile">
          <ProfileTextareaField
            id="company-introduction"
            label="Brief company introduction (100-200 words)"
            value={profile.introduction}
            onChange={(value) => setValue("introduction", value)}
          />
          <ProfileTextareaField
            id="products-services"
            label="Key products / services"
            value={profile.productsServices}
            onChange={(value) => setValue("productsServices", value)}
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
            value={profile.certificationOther}
            onChange={(value) => setValue("certificationOther", value)}
          />
        </ProfileSection>

        <ProfileSection title="5. What does your company offer?">
          <ProfileCheckboxGroup
            label="Select all that apply"
            options={profileOptionGroups.offers}
            values={profile.offers}
            onToggle={(value) => toggleList("offers", value)}
          />
          <ProfileTextField
            id="offer-other"
            label="Other offer"
            value={profile.offerOther}
            onChange={(value) => setValue("offerOther", value)}
          />
        </ProfileSection>

        <ProfileSection title="6. What are you looking for?">
          <ProfileCheckboxGroup
            label="Select all that apply"
            options={profileOptionGroups.lookingFor}
            values={profile.lookingFor}
            onToggle={(value) => toggleList("lookingFor", value)}
          />
          <ProfileTextField
            id="looking-for-other"
            label="Other requirement"
            value={profile.lookingForOther}
            onChange={(value) => setValue("lookingForOther", value)}
          />
        </ProfileSection>

        <ProfileSection title="7. Matchmaking preferences">
          <ProfileCheckboxGroup
            label="Preferred partner type"
            options={profileOptionGroups.preferredPartnerTypes}
            values={profile.preferredPartnerTypes}
            onToggle={(value) => toggleList("preferredPartnerTypes", value)}
          />
          <ProfileTextField
            id="preferred-partner-other"
            label="Other preferred partner type"
            value={profile.preferredPartnerOther}
            onChange={(value) => setValue("preferredPartnerOther", value)}
          />
          <ProfileCheckboxGroup
            label="Expected outcome"
            options={profileOptionGroups.expectedOutcomes}
            values={profile.expectedOutcomes}
            onToggle={(value) => toggleList("expectedOutcomes", value)}
          />
        </ProfileSection>

        <ProfileSection title="8. Specific business needs">
          <ProfileTextareaField
            id="ideal-partner"
            label="Describe your ideal business partner"
            value={profile.idealPartner}
            onChange={(value) => setValue("idealPartner", value)}
          />
          <ProfileTextareaField
            id="opportunity"
            label="Describe the opportunity you wish to discuss"
            value={profile.opportunity}
            onChange={(value) => setValue("opportunity", value)}
          />
        </ProfileSection>

        <ProfileSection title="9. Export / international experience">
          <ProfileRadioGroup
            label="Do you currently export internationally?"
            options={profileOptionGroups.exportsInternationally}
            value={profile.exportsInternationally}
            onChange={(value) => setValue("exportsInternationally", value)}
          />
          <ProfileTextField
            id="export-markets"
            label="If yes, list markets"
            value={profile.exportMarkets}
            onChange={(value) => setValue("exportMarkets", value)}
          />
        </ProfileSection>

        <ProfileSection title="10. Meeting arrangement">
          <ProfileRadioGroup
            label="Meeting format"
            options={profileOptionGroups.meetingFormat}
            value={profile.meetingFormat}
            onChange={(value) => setValue("meetingFormat", value)}
          />
          <ProfileTextareaField
            id="meeting-dates"
            label="Available meeting dates"
            value={profile.availableMeetingDates}
            onChange={(value) => setValue("availableMeetingDates", value)}
          />
          <ProfileRadioGroup
            label="Maximum number of meetings requested"
            options={profileOptionGroups.maxMeetings}
            value={profile.maxMeetings}
            onChange={(value) => setValue("maxMeetings", value)}
          />
        </ProfileSection>

        <ProfileSection title="11. Supporting documents">
          <ProfileCheckboxGroup
            label="Please upload or prepare"
            options={profileOptionGroups.supportingDocuments}
            values={profile.supportingDocuments}
            onToggle={(value) => toggleList("supportingDocuments", value)}
          />
          <FieldDescription>
            Upload storage can be connected to the existing Documents &
            Resources module when files are ready.
          </FieldDescription>
        </ProfileSection>

        <ProfileSection title="12. Consent">
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
              value={profile.consentName}
              onChange={(value) => setValue("consentName", value)}
            />
            <ProfileTextField
              id="consent-date"
              label="Date"
              type="date"
              value={profile.consentDate}
              onChange={(value) => setValue("consentDate", value)}
            />
          </div>
        </ProfileSection>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <Button onClick={() => onSave(profile)}>
          <Icon icon={CheckmarkCircle02Icon} inline="inline-start" />
          Save registration profile
        </Button>
        <Button
          variant="outline"
          onClick={() => toast.success("Document upload placeholder saved.")}
        >
          <Icon icon={Upload01Icon} inline="inline-start" />
          Upload PDF
        </Button>
      </CardFooter>
    </Card>
  )
}

function ProfileSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-md border p-4">
      <h3 className="text-base font-semibold">{title}</h3>
      <div className="mt-4 grid gap-4">{children}</div>
    </section>
  )
}

function ProfileTextField({
  id,
  label,
  type = "text",
  value,
  onChange,
}: {
  id: string
  label: string
  type?: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  )
}

function ProfileTextareaField({
  id,
  label,
  value,
  onChange,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
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
            <Link href={`/${locale}/${perspective}/discover`}>
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
          const counterpartId =
            perspective === "delegation" ? match.partnerId : match.delegationId
          const counterpartName = getCompanyName(db, counterpartId)
          const isAccepted = match.status === "Accepted"
          const isScheduled = match.status === "Session Scheduled"
          return (
            <Card key={match.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>
                      {counterpartName === "Unknown company"
                        ? textFor(
                            locale,
                            "Company record pending",
                            "企业记录待补充"
                          )
                        : counterpartName}
                    </CardTitle>
                    <CardDescription>{match.note}</CardDescription>
                  </div>
                  <Badge variant={statusVariant(match.status)}>
                    {statusLabel(match.status, locale)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <Progress value={match.score} />
                <p className="text-sm text-muted-foreground">
                  {textFor(locale, "Match confidence", "匹配信心")}:{" "}
                  {match.score}%
                </p>
              </CardContent>
              <CardFooter className="flex flex-wrap gap-2">
                {isScheduled || isAccepted ? (
                  <MeetingSlotPickerDialog
                    match={match}
                    locale={locale}
                    isScheduled={isScheduled}
                    interpreters={availableInterpreters}
                    onSubmit={onSchedule}
                  />
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
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
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
          One-tap join links are pre-generated; no live API call happens on
          join.
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
                  <p className="truncate text-sm font-medium">{company.nameEn}</p>
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
                  <Input
                    id={`${form.id}-sector`}
                    value={form.sector}
                    onChange={(event) =>
                      updateField("sector", event.target.value)
                    }
                    readOnly={readOnly}
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
      sector: "Pending profile",
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
    sector: "Pending profile",
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
  onStatus,
  onSchedule,
  locale = "en",
}: {
  db: LocalDb
  matches: Match[]
  onStatus: (matchId: string, status: MatchStatus) => void
  onSchedule: (match: Match) => void
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
          {matches.map((match) => (
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
                  <Button
                    variant="outline"
                    onClick={() => onStatus(match.id, "Accepted")}
                  >
                    {textFor(locale, "Accept", "接受")}
                  </Button>
                  <Button onClick={() => onSchedule(match)}>
                    {textFor(locale, "Schedule", "安排")}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
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

function SessionList({
  db,
  meetings,
  onComplete,
  onAssignInterpreter,
  locale = "en",
}: {
  db: LocalDb
  meetings: Meeting[]
  onComplete?: (meetingId: string) => void
  onAssignInterpreter?: (
    meetingId: string,
    interpreterId: string | null
  ) => void
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
                <Button asChild>
                  <a href={meeting.link} target="_blank" rel="noreferrer">
                    <Icon icon={CameraVideoIcon} inline="inline-start" />
                    {textFor(locale, "Join", "加入")}
                  </a>
                </Button>
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

function MeetingCalendarView({
  db,
  meetings,
  locale = "en",
}: {
  db: LocalDb
  meetings: Meeting[]
  locale?: Locale
}) {
  if (!meetings.length) {
    return null
  }

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
  const meetingMatchIds = new Set(meetings.map((meeting) => meeting.matchId))
  const agreementsReached = db.deals.filter(
    (deal) =>
      meetingMatchIds.has(deal.matchId) &&
      ["Agreement Reached", "Signed"].includes(deal.status)
  ).length
  const totalMinutes = meetings.reduce(
    (total, meeting) => total + meeting.duration,
    0
  )

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <InfoTile
          label={textFor(locale, "Calendar days", "日历天数")}
          value={meetingsByDay.length}
        />
        <InfoTile
          label={textFor(locale, "Meetings tracked", "已追踪会议")}
          value={meetings.length}
        />
        <InfoTile
          label={textFor(locale, "Agreement reached", "已达成协议")}
          value={`${agreementsReached} / ${meetings.length}`}
        />
        <InfoTile
          label={textFor(locale, "Booked time", "已预订时长")}
          value={`${totalMinutes} ${textFor(locale, "min", "分钟")}`}
        />
      </div>

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

                  return (
                    <div
                      key={meeting.id}
                      className="border-l-2 border-primary/70 pl-3"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={statusVariant(meeting.status)}>
                          {meeting.status}
                        </Badge>
                        <Badge variant="outline">
                          {formatMeetingTime(meeting.startsAt, locale)} ·{" "}
                          {meeting.duration} {textFor(locale, "min", "分钟")}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm font-medium">
                        {match
                          ? `${getCompanyName(db, match.delegationId)} ↔ ${getCompanyName(db, match.partnerId)}`
                          : meeting.id}
                      </p>
                      <div className="mt-2 grid gap-1 text-xs text-muted-foreground">
                        <p>
                          {meeting.platform} ·{" "}
                          {textFor(locale, "Host", "主持人")}: {meeting.host}
                        </p>
                        <p>
                          {textFor(locale, "Interpreter", "翻译")}:{" "}
                          {meeting.interpreter}
                        </p>
                        <p>
                          {textFor(locale, "Agreement", "协议")}:{" "}
                          <span className="font-medium text-foreground">
                            {deal?.status
                              ? statusLabel(deal.status, locale)
                              : textFor(locale, "No deal yet", "暂无协议")}
                          </span>
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
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
  onDeal,
  locale = "en",
}: {
  db: LocalDb
  deals: Deal[]
  onDeal?: (dealId: string, status: Deal["status"]) => void
  locale?: Locale
}) {
  return (
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
          {deals.map((deal) => {
            const match = db.matches.find((item) => item.id === deal.matchId)
            const documentHref = getDealDocumentHref(deal.document)
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
                  <Badge variant={statusVariant(deal.status)}>
                    {statusLabel(deal.status, locale)}
                  </Badge>
                </TableCell>
                <TableCell>{deal.document}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    {onDeal ? (
                      <Button onClick={() => onDeal(deal.id, "Signed")}>
                        {textFor(locale, "Mark signed", "标记已签署")}
                      </Button>
                    ) : null}
                    <DocumentViewerDialog
                      deal={deal}
                      documentHref={documentHref}
                      locale={locale}
                    />
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

function getDealDocumentHref(documentName: string) {
  if (!documentName.toLowerCase().endsWith(".pdf")) {
    return null
  }

  return `/documents/${encodeURIComponent(documentName)}`
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
