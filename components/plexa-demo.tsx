"use client"

import { type FormEvent, useMemo, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  AiBrain01Icon,
  ArrowUp02Icon,
  CheckmarkCircle02Icon,
  Link01Icon,
  MagicWand01Icon,
  Message01Icon,
  ShieldUserIcon,
  SparklesIcon,
  Task01Icon,
} from "@hugeicons/core-free-icons"
import { toast } from "sonner"

import { updatePlexaRoleAccessAction } from "@/app/actions/management"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import type { AppRole } from "@/lib/auth"
import type { Locale } from "@/lib/i18n"
import type { PlexaRoleAccess } from "@/lib/plexa"

export type PlexaWorkspaceContext = {
  workspaceName: string
  metrics: Array<{ label: string; value: string | number }>
  signals: string[]
}

type PlexaIntent =
  | "brief"
  | "profile"
  | "match"
  | "meeting"
  | "followup"
  | "communication"
  | "report"
  | "governance"

type PlexaMessage = {
  id: number
  author: "user" | "plexa"
  title?: string
  body: string
  evidence?: string[]
  action?: string
  actionState?: "ready" | "approved" | "dismissed"
}

function localeText(
  locale: Locale,
  copy: { en: string; zh: string; zhHant: string; th: string }
) {
  if (locale === "zh") return copy.zh
  if (locale === "zh-Hant") return copy.zhHant
  if (locale === "th") return copy.th
  return copy.en
}

function roleName(role: AppRole, locale: Locale) {
  const names: Record<
    AppRole,
    { en: string; zh: string; zhHant: string; th: string }
  > = {
    superadmin: {
      en: "Superadmin",
      zh: "超级管理员",
      zhHant: "超級管理員",
      th: "ผู้ดูแลระบบสูงสุด",
    },
    admin: {
      en: "Organizer",
      zh: "主办方",
      zhHant: "主辦方",
      th: "ผู้จัดงาน",
    },
    vendor: {
      en: "Business Participant",
      zh: "企业参与者",
      zhHant: "企業參與者",
      th: "ผู้เข้าร่วมธุรกิจ",
    },
  }

  return localeText(locale, names[role])
}

function taskCatalog(role: AppRole, locale: Locale) {
  const shared = {
    brief: localeText(locale, {
      en: "Prepare my briefing",
      zh: "准备我的简报",
      zhHant: "準備我的簡報",
      th: "เตรียมสรุปงานของฉัน",
    }),
    meeting: localeText(locale, {
      en: "Prepare a meeting",
      zh: "准备会议",
      zhHant: "準備會議",
      th: "เตรียมการประชุม",
    }),
    followup: localeText(locale, {
      en: "Structure follow-up",
      zh: "整理后续行动",
      zhHant: "整理後續行動",
      th: "จัดโครงสร้างการติดตามผล",
    }),
  }

  if (role === "superadmin") {
    return [
      ["brief", shared.brief],
      [
        "governance",
        localeText(locale, {
          en: "Review platform governance",
          zh: "审查平台治理",
          zhHant: "審查平台治理",
          th: "ตรวจสอบการกำกับดูแลแพลตฟอร์ม",
        }),
      ],
      [
        "report",
        localeText(locale, {
          en: "Summarize tenant activity",
          zh: "汇总租户活动",
          zhHant: "彙總租戶活動",
          th: "สรุปกิจกรรมของเทนเนนต์",
        }),
      ],
      [
        "communication",
        localeText(locale, {
          en: "Draft an operations notice",
          zh: "起草运营通知",
          zhHant: "起草營運通知",
          th: "ร่างประกาศการดำเนินงาน",
        }),
      ],
    ] as Array<[PlexaIntent, string]>
  }

  if (role === "admin") {
    return [
      ["brief", shared.brief],
      [
        "match",
        localeText(locale, {
          en: "Review matching readiness",
          zh: "审查配对准备情况",
          zhHant: "審查配對準備情況",
          th: "ตรวจสอบความพร้อมในการจับคู่",
        }),
      ],
      ["meeting", shared.meeting],
      [
        "communication",
        localeText(locale, {
          en: "Draft participant reminder",
          zh: "起草参与者提醒",
          zhHant: "起草參與者提醒",
          th: "ร่างข้อความเตือนผู้เข้าร่วม",
        }),
      ],
    ] as Array<[PlexaIntent, string]>
  }

  return [
    [
      "profile",
      localeText(locale, {
        en: "Improve my company profile",
        zh: "完善我的公司资料",
        zhHant: "完善我的公司資料",
        th: "ปรับปรุงโปรไฟล์บริษัทของฉัน",
      }),
    ],
    [
      "match",
      localeText(locale, {
        en: "Explain my match readiness",
        zh: "说明我的配对准备情况",
        zhHant: "說明我的配對準備情況",
        th: "อธิบายความพร้อมในการจับคู่ของฉัน",
      }),
    ],
    ["meeting", shared.meeting],
    ["followup", shared.followup],
  ] as Array<[PlexaIntent, string]>
}

function responseFor(
  intent: PlexaIntent,
  role: AppRole,
  locale: Locale,
  context: PlexaWorkspaceContext
): Omit<PlexaMessage, "id" | "author"> {
  const metricSummary = context.metrics
    .slice(0, 3)
    .map((metric) => `${metric.label}: ${metric.value}`)
    .join(" · ")
  const signalSummary = context.signals.slice(0, 3)
  const sourceLine = localeText(locale, {
    en: `Based on the current ${context.workspaceName} workspace snapshot: ${metricSummary}.`,
    zh: `根据当前 ${context.workspaceName} 工作区快照：${metricSummary}。`,
    zhHant: `根據目前 ${context.workspaceName} 工作區快照：${metricSummary}。`,
    th: `อ้างอิงภาพรวมปัจจุบันของพื้นที่ทำงาน ${context.workspaceName}: ${metricSummary}`,
  })

  const replies: Record<PlexaIntent, Omit<PlexaMessage, "id" | "author">> = {
    brief: {
      title: localeText(locale, {
        en: "Today’s operating brief",
        zh: "今日运营简报",
        zhHant: "今日營運簡報",
        th: "สรุปการดำเนินงานวันนี้",
      }),
      body: sourceLine,
      evidence: signalSummary,
    },
    profile: {
      title: localeText(locale, {
        en: "Profile improvement plan",
        zh: "资料完善计划",
        zhHant: "資料完善計劃",
        th: "แผนปรับปรุงโปรไฟล์",
      }),
      body: localeText(locale, {
        en: "Strengthen the business objective, ideal counterparty, and expected meeting outcome. PLEXA would present each suggestion as an editable draft and never invent company facts.",
        zh: "建议完善业务目标、理想合作方和预期会议成果。PLEXA 会将每项建议作为可编辑草稿呈现，不会虚构公司事实。",
        zhHant:
          "建議完善業務目標、理想合作方和預期會議成果。PLEXA 會將每項建議作為可編輯草稿呈現，不會虛構公司事實。",
        th: "ควรเพิ่มรายละเอียดเป้าหมายทางธุรกิจ คู่ค้าที่เหมาะสม และผลลัพธ์ที่คาดหวังจากการประชุม โดย PLEXA จะแสดงเป็นร่างที่แก้ไขได้และไม่สร้างข้อมูลบริษัทขึ้นเอง",
      }),
      evidence: signalSummary,
      action: localeText(locale, {
        en: "Stage three profile suggestions for review",
        zh: "暂存三项资料建议供审阅",
        zhHant: "暫存三項資料建議供審閱",
        th: "จัดเตรียมข้อเสนอแนะโปรไฟล์สามรายการเพื่อตรวจสอบ",
      }),
      actionState: "ready",
    },
    match: {
      title: localeText(locale, {
        en: "Matching readiness review",
        zh: "配对准备审查",
        zhHant: "配對準備審查",
        th: "การตรวจสอบความพร้อมในการจับคู่",
      }),
      body: localeText(locale, {
        en: "PLEXA can compare approved objectives, sectors, offerings, and meeting expectations. It can explain fit and missing evidence, but mutual acceptance remains with the two businesses and the Organizer.",
        zh: "PLEXA 可比较已批准的目标、行业、产品服务与会议期望，并说明契合点及缺失证据。最终配对仍由双方企业和主办方决定。",
        zhHant:
          "PLEXA 可比較已批准的目標、行業、產品服務與會議期望，並說明契合點及缺失證據。最終配對仍由雙方企業和主辦方決定。",
        th: "PLEXA สามารถเปรียบเทียบเป้าหมาย อุตสาหกรรม ข้อเสนอ และความคาดหวังที่ได้รับอนุมัติ พร้อมอธิบายความเหมาะสมและข้อมูลที่ขาด แต่การยอมรับการจับคู่ยังอยู่กับทั้งสองบริษัทและผู้จัดงาน",
      }),
      evidence: signalSummary,
    },
    meeting: {
      title: localeText(locale, {
        en: "Meeting preparation brief",
        zh: "会议准备简报",
        zhHant: "會議準備簡報",
        th: "สรุปการเตรียมประชุม",
      }),
      body: localeText(locale, {
        en: "The brief would combine the approved counterparty context, objectives, unresolved questions, language needs, timing, and document readiness into one reviewable agenda.",
        zh: "简报会将已批准的合作方背景、目标、待解决问题、语言需求、时间与文件准备情况整合为一份可审阅议程。",
        zhHant:
          "簡報會將已批准的合作方背景、目標、待解決問題、語言需求、時間與文件準備情況整合為一份可審閱議程。",
        th: "สรุปจะรวบรวมบริบทของคู่ค้า เป้าหมาย ประเด็นที่ยังไม่ชัดเจน ความต้องการด้านภาษา เวลา และความพร้อมของเอกสารไว้ในวาระเดียวที่ตรวจสอบได้",
      }),
      evidence: signalSummary,
      action: localeText(locale, {
        en: "Prepare a reviewable meeting brief",
        zh: "准备可审阅的会议简报",
        zhHant: "準備可審閱的會議簡報",
        th: "เตรียมสรุปการประชุมเพื่อตรวจสอบ",
      }),
      actionState: "ready",
    },
    followup: {
      title: localeText(locale, {
        en: "Accountable follow-up",
        zh: "可追责的后续行动",
        zhHant: "可追責的後續行動",
        th: "การติดตามผลที่มีผู้รับผิดชอบ",
      }),
      body: localeText(locale, {
        en: "PLEXA would turn approved notes into decisions, open questions, named owners, proposed dates, and MOU readiness. Nothing is written to the operating record until a user confirms it.",
        zh: "PLEXA 会将已批准的笔记整理为决策、待解决问题、负责人、建议日期和 MOU 准备情况。用户确认前不会写入运营记录。",
        zhHant:
          "PLEXA 會將已批准的筆記整理為決策、待解決問題、負責人、建議日期和 MOU 準備情況。用戶確認前不會寫入營運記錄。",
        th: "PLEXA จะจัดบันทึกที่อนุมัติแล้วเป็นการตัดสินใจ คำถาม ผู้รับผิดชอบ วันที่เสนอ และความพร้อมของ MOU โดยจะไม่บันทึกลงระบบจนกว่าผู้ใช้จะยืนยัน",
      }),
      evidence: signalSummary,
      action: localeText(locale, {
        en: "Stage an Action Brief for review",
        zh: "暂存行动简报供审阅",
        zhHant: "暫存行動簡報供審閱",
        th: "จัดเตรียม Action Brief เพื่อตรวจสอบ",
      }),
      actionState: "ready",
    },
    communication: {
      title: localeText(locale, {
        en: "Communication draft",
        zh: "沟通草稿",
        zhHant: "溝通草稿",
        th: "ร่างการสื่อสาร",
      }),
      body: localeText(locale, {
        en: `Subject: Action required in ${context.workspaceName}\n\nPlease review the outstanding program item shown in your Plexus workspace. Confirm the requested information so the Organizer can prepare the responsible next step.`,
        zh: `主题：${context.workspaceName} 中需要处理的事项\n\n请审阅 Plexus 工作区中显示的待办事项，并确认所需信息，以便主办方准备下一步行动。`,
        zhHant: `主旨：${context.workspaceName} 中需要處理的事項\n\n請審閱 Plexus 工作區中顯示的待辦事項，並確認所需資訊，以便主辦方準備下一步行動。`,
        th: `หัวข้อ: รายการที่ต้องดำเนินการใน ${context.workspaceName}\n\nโปรดตรวจสอบรายการค้างในพื้นที่ทำงาน Plexus และยืนยันข้อมูลที่ร้องขอ เพื่อให้ผู้จัดงานเตรียมขั้นตอนถัดไปได้`,
      }),
      evidence: signalSummary,
      action: localeText(locale, {
        en: "Approve demo draft",
        zh: "批准演示草稿",
        zhHant: "批准示範草稿",
        th: "อนุมัติร่างสาธิต",
      }),
      actionState: "ready",
    },
    report: {
      title: localeText(locale, {
        en: "Workspace report summary",
        zh: "工作区报告摘要",
        zhHant: "工作區報告摘要",
        th: "สรุปรายงานพื้นที่ทำงาน",
      }),
      body: sourceLine,
      evidence: signalSummary,
      action: localeText(locale, {
        en: "Stage a demo report export",
        zh: "暂存演示报告导出",
        zhHant: "暫存示範報告匯出",
        th: "จัดเตรียมการส่งออกรายงานสาธิต",
      }),
      actionState: "ready",
    },
    governance: {
      title: localeText(locale, {
        en: "Governance review",
        zh: "治理审查",
        zhHant: "治理審查",
        th: "การตรวจสอบการกำกับดูแล",
      }),
      body:
        role === "superadmin"
          ? localeText(locale, {
              en: "The simulated review checks tenant activity, account posture, unresolved incidents, audit coverage, and PLEXA distribution. It does not change tenant or account state.",
              zh: "模拟审查会检查租户活动、账户状态、未解决事故、审计覆盖范围和 PLEXA 分发情况，但不会更改租户或账户状态。",
              zhHant:
                "模擬審查會檢查租戶活動、帳戶狀態、未解決事故、審計覆蓋範圍和 PLEXA 分發情況，但不會更改租戶或帳戶狀態。",
              th: "การตรวจสอบจำลองจะดูความเคลื่อนไหวของเทนเนนต์ สถานะบัญชี เหตุขัดข้อง การตรวจสอบย้อนหลัง และการเปิดใช้ PLEXA โดยไม่เปลี่ยนสถานะใด ๆ",
            })
          : sourceLine,
      evidence: signalSummary,
    },
  }

  return replies[intent]
}

function inferIntent(question: string, role: AppRole): PlexaIntent {
  const normalized = question.toLowerCase()

  if (/profile|company|资料|資料|โปรไฟล์/.test(normalized)) return "profile"
  if (/match|partner|配对|配對|จับคู่/.test(normalized)) return "match"
  if (/meeting|session|会议|會議|ประชุม/.test(normalized)) return "meeting"
  if (/mou|follow|action|后续|後續|ติดตาม/.test(normalized)) return "followup"
  if (/message|email|notice|remind|通知|提醒|ข้อความ/.test(normalized)) {
    return "communication"
  }
  if (/report|metric|summary|报告|報告|รายงาน/.test(normalized)) return "report"
  if (/audit|tenant|account|govern|审计|審計|ตรวจสอบ/.test(normalized)) {
    return role === "superadmin" ? "governance" : "brief"
  }
  return "brief"
}

export function PlexaDemo({
  role,
  locale,
  context,
}: {
  role: AppRole
  locale: Locale
  context: PlexaWorkspaceContext
}) {
  const nextId = useRef(2)
  const [question, setQuestion] = useState("")
  const [busy, setBusy] = useState(false)
  const [activity, setActivity] = useState<string[]>([])
  const tasks = useMemo(() => taskCatalog(role, locale), [locale, role])
  const [messages, setMessages] = useState<PlexaMessage[]>([
    {
      id: 1,
      author: "plexa",
      title: localeText(locale, {
        en: `Ready for the ${roleName(role, locale)} workspace`,
        zh: `已准备好服务${roleName(role, locale)}工作区`,
        zhHant: `已準備好服務${roleName(role, locale)}工作區`,
        th: `พร้อมสำหรับพื้นที่ทำงาน${roleName(role, locale)}`,
      }),
      body: localeText(locale, {
        en: "Ask about the current operating picture or choose a prepared task. This demo uses the workspace snapshot shown at right and performs no production actions.",
        zh: "可询问当前运营情况或选择预设任务。本演示仅使用右侧显示的工作区快照，不执行任何生产操作。",
        zhHant:
          "可詢問目前營運情況或選擇預設任務。本示範僅使用右側顯示的工作區快照，不執行任何正式環境操作。",
        th: "สอบถามภาพรวมการดำเนินงานหรือเลือกงานที่เตรียมไว้ การสาธิตนี้ใช้ข้อมูลภาพรวมทางขวาและจะไม่ดำเนินการจริง",
      }),
    },
  ])

  function runIntent(intent: PlexaIntent, userLabel?: string) {
    if (busy) return

    const userMessage = userLabel
      ? {
          id: nextId.current++,
          author: "user" as const,
          body: userLabel,
        }
      : undefined

    if (userMessage) {
      setMessages((current) => [...current, userMessage])
    }

    setBusy(true)
    window.setTimeout(() => {
      setMessages((current) => [
        ...current,
        {
          id: nextId.current++,
          author: "plexa",
          ...responseFor(intent, role, locale, context),
        },
      ])
      setBusy(false)
    }, 460)
  }

  function submitQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = question.trim()
    if (!value || busy) return
    setQuestion("")
    runIntent(inferIntent(value, role), value)
  }

  function resolveAction(messageId: number, approved: boolean) {
    const message = messages.find((item) => item.id === messageId)
    if (!message?.action) return

    setMessages((current) =>
      current.map((item) =>
        item.id === messageId
          ? {
              ...item,
              actionState: approved ? "approved" : "dismissed",
            }
          : item
      )
    )

    if (approved) {
      setActivity((current) => [message.action!, ...current].slice(0, 4))
      toast.success(
        localeText(locale, {
          en: "Demo action completed. No production record was changed.",
          zh: "演示操作已完成，未更改任何生产记录。",
          zhHant: "示範操作已完成，未更改任何正式環境記錄。",
          th: "การดำเนินการสาธิตเสร็จแล้ว ไม่มีการเปลี่ยนแปลงข้อมูลจริง",
        })
      )
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-[0_18px_48px_rgba(7,19,38,0.08)]">
      <header className="relative overflow-hidden bg-[#071326] px-5 py-6 text-white sm:px-7">
        <div
          aria-hidden="true"
          className="absolute inset-y-0 right-0 w-2/5 bg-[radial-gradient(circle_at_70%_40%,rgba(37,208,255,0.22),transparent_58%)]"
        />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="grid size-10 place-items-center rounded-xl bg-[#0a84ff] text-[#071326]">
                <HugeiconsIcon icon={AiBrain01Icon} strokeWidth={1.8} />
              </span>
              <Badge className="bg-[#d9f8ee] text-[#08664d] hover:bg-[#d9f8ee]">
                {localeText(locale, {
                  en: "Interactive demo",
                  zh: "互动演示",
                  zhHant: "互動示範",
                  th: "การสาธิตแบบโต้ตอบ",
                })}
              </Badge>
              <Badge
                variant="outline"
                className="border-white/18 text-[#d7e5f1]"
              >
                {roleName(role, locale)}
              </Badge>
            </div>
            <h2 className="mt-5 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
              PLEXA
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#b8cadc] sm:text-base">
              {localeText(locale, {
                en: "A permission-aware operating companion for briefing, preparation, and human-approved action across the Plexus journey.",
                zh: "贯穿 Plexus 全流程的权限感知运营助手，用于简报、准备和人工批准的行动。",
                zhHant:
                  "貫穿 Plexus 全流程的權限感知營運助手，用於簡報、準備和人工批准的行動。",
                th: "ผู้ช่วยดำเนินงานที่ตระหนักถึงสิทธิ์ สำหรับการสรุป เตรียมงาน และการดำเนินการที่มนุษย์อนุมัติตลอดเส้นทาง Plexus",
              })}
            </p>
          </div>
          <div className="max-w-sm rounded-xl bg-white/7 px-4 py-3 text-xs leading-5 text-[#d7e5f1]">
            <span className="font-semibold text-[#80e8ff]">
              {localeText(locale, {
                en: "Simulation boundary",
                zh: "模拟边界",
                zhHant: "模擬邊界",
                th: "ขอบเขตการจำลอง",
              })}
            </span>
            <p className="mt-1">
              {localeText(locale, {
                en: "No AI provider, message delivery, database mutation, or external provider action runs from this surface.",
                zh: "此界面不会调用 AI 提供商、发送消息、修改数据库或执行外部服务操作。",
                zhHant:
                  "此介面不會呼叫 AI 供應商、發送訊息、修改資料庫或執行外部服務操作。",
                th: "หน้าจอนี้ไม่เรียกผู้ให้บริการ AI ไม่ส่งข้อความ ไม่แก้ไขฐานข้อมูล และไม่ดำเนินการกับผู้ให้บริการภายนอก",
              })}
            </p>
          </div>
        </div>
      </header>

      <div className="grid min-h-[650px] xl:grid-cols-[230px_minmax(0,1fr)_270px]">
        <aside className="border-b border-[#dbe6ee] bg-[#f7f7f2] p-5 xl:border-r xl:border-b-0">
          <h3 className="text-sm font-semibold text-[#111826]">
            {localeText(locale, {
              en: "Prepared tasks",
              zh: "预设任务",
              zhHant: "預設任務",
              th: "งานที่เตรียมไว้",
            })}
          </h3>
          <p className="mt-1 text-xs leading-5 text-[#53667c]">
            {localeText(locale, {
              en: "Each task is scoped to this role and workspace.",
              zh: "每项任务仅限当前角色和工作区。",
              zhHant: "每項任務僅限目前角色和工作區。",
              th: "แต่ละงานจำกัดตามบทบาทและพื้นที่ทำงานนี้",
            })}
          </p>
          <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            {tasks.map(([intent, label]) => (
              <Button
                key={intent}
                variant="ghost"
                className="h-auto min-h-11 justify-start rounded-xl px-3 py-3 text-left text-sm whitespace-normal"
                disabled={busy}
                onClick={() => runIntent(intent, label)}
              >
                <HugeiconsIcon
                  icon={
                    intent === "communication" ? Message01Icon : MagicWand01Icon
                  }
                  data-icon="inline-start"
                  strokeWidth={1.7}
                />
                {label}
              </Button>
            ))}
          </div>

          <div className="mt-6 border-t border-[#d5e0e8] pt-5">
            <p className="flex items-center gap-2 text-xs font-semibold text-[#111826]">
              <HugeiconsIcon icon={ShieldUserIcon} className="size-4" />
              {localeText(locale, {
                en: "Human-governed",
                zh: "人工治理",
                zhHant: "人工治理",
                th: "มนุษย์เป็นผู้กำกับ",
              })}
            </p>
            <p className="mt-2 text-xs leading-5 text-[#53667c]">
              {localeText(locale, {
                en: "PLEXA may prepare and propose. The responsible user keeps the decision and approval.",
                zh: "PLEXA 可以准备和建议，最终决策与批准仍由负责人完成。",
                zhHant: "PLEXA 可以準備和建議，最終決策與批准仍由負責人完成。",
                th: "PLEXA สามารถเตรียมและเสนอได้ แต่ผู้รับผิดชอบยังคงเป็นผู้ตัดสินใจและอนุมัติ",
              })}
            </p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col bg-[#eef4f8]">
          <div
            aria-live="polite"
            className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6"
          >
            {messages.map((message) => (
              <article
                key={message.id}
                className={
                  message.author === "user"
                    ? "ml-auto max-w-[82%] rounded-2xl rounded-br-md bg-[#0758c8] px-4 py-3 text-sm leading-6 text-white"
                    : "max-w-3xl rounded-2xl rounded-bl-md bg-white px-5 py-4 text-[#111826] shadow-[0_8px_28px_rgba(7,19,38,0.06)]"
                }
              >
                {message.author === "plexa" ? (
                  <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-[#0758c8]">
                    <HugeiconsIcon icon={SparklesIcon} className="size-4" />
                    PLEXA
                  </div>
                ) : null}
                {message.title ? (
                  <h3 className="text-base font-semibold tracking-[-0.015em]">
                    {message.title}
                  </h3>
                ) : null}
                <p className="mt-1 text-sm leading-6 whitespace-pre-line">
                  {message.body}
                </p>
                {message.evidence?.length ? (
                  <div className="mt-4 border-t border-[#dbe6ee] pt-3">
                    <p className="flex items-center gap-2 text-xs font-semibold text-[#53667c]">
                      <HugeiconsIcon icon={Link01Icon} className="size-4" />
                      {localeText(locale, {
                        en: "Workspace evidence",
                        zh: "工作区依据",
                        zhHant: "工作區依據",
                        th: "หลักฐานในพื้นที่ทำงาน",
                      })}
                    </p>
                    <ul className="mt-2 grid gap-1.5 text-xs leading-5 text-[#53667c]">
                      {message.evidence.map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="mt-2 size-1 shrink-0 rounded-full bg-[#0a84ff]" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {message.action && message.actionState ? (
                  <div className="mt-4 rounded-xl bg-[#dcecf7] p-3">
                    <p className="flex items-center gap-2 text-xs font-semibold text-[#071326]">
                      <HugeiconsIcon icon={Task01Icon} className="size-4" />
                      {message.action}
                    </p>
                    {message.actionState === "ready" ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          onClick={() => resolveAction(message.id, true)}
                        >
                          {localeText(locale, {
                            en: "Approve demo action",
                            zh: "批准演示操作",
                            zhHant: "批准示範操作",
                            th: "อนุมัติการสาธิต",
                          })}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => resolveAction(message.id, false)}
                        >
                          {localeText(locale, {
                            en: "Dismiss",
                            zh: "取消",
                            zhHant: "取消",
                            th: "ยกเลิก",
                          })}
                        </Button>
                      </div>
                    ) : (
                      <p className="mt-2 flex items-center gap-2 text-xs text-[#53667c]">
                        <HugeiconsIcon
                          icon={CheckmarkCircle02Icon}
                          className="size-4"
                        />
                        {message.actionState === "approved"
                          ? localeText(locale, {
                              en: "Completed inside this demo only",
                              zh: "仅在本演示中完成",
                              zhHant: "僅在本示範中完成",
                              th: "เสร็จสิ้นเฉพาะในการสาธิตนี้",
                            })
                          : localeText(locale, {
                              en: "Demo action dismissed",
                              zh: "已取消演示操作",
                              zhHant: "已取消示範操作",
                              th: "ยกเลิกการสาธิตแล้ว",
                            })}
                      </p>
                    )}
                  </div>
                ) : null}
              </article>
            ))}
            {busy ? (
              <div className="flex max-w-xs items-center gap-3 rounded-2xl rounded-bl-md bg-white px-4 py-3 text-sm text-[#53667c] shadow-[0_8px_28px_rgba(7,19,38,0.06)]">
                <HugeiconsIcon
                  icon={SparklesIcon}
                  className="size-4 animate-pulse text-[#0758c8] motion-reduce:animate-none"
                />
                {localeText(locale, {
                  en: "Preparing a grounded demo response…",
                  zh: "正在准备基于工作区的演示回复…",
                  zhHant: "正在準備基於工作區的示範回覆…",
                  th: "กำลังเตรียมคำตอบสาธิตจากข้อมูลในพื้นที่ทำงาน…",
                })}
              </div>
            ) : null}
          </div>

          <form
            onSubmit={submitQuestion}
            className="border-t border-[#dbe6ee] bg-white p-4 sm:p-5"
          >
            <Label htmlFor={`plexa-question-${role}`} className="sr-only">
              {localeText(locale, {
                en: "Ask PLEXA",
                zh: "询问 PLEXA",
                zhHant: "詢問 PLEXA",
                th: "ถาม PLEXA",
              })}
            </Label>
            <div className="flex gap-2">
              <Input
                id={`plexa-question-${role}`}
                value={question}
                disabled={busy}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder={localeText(locale, {
                  en: "Ask about profiles, matching, meetings, follow-up, or reporting",
                  zh: "询问资料、配对、会议、后续行动或报告",
                  zhHant: "詢問資料、配對、會議、後續行動或報告",
                  th: "ถามเกี่ยวกับโปรไฟล์ การจับคู่ การประชุม การติดตามผล หรือรายงาน",
                })}
                className="h-12 rounded-xl bg-[#f7f7f2]"
              />
              <Button
                type="submit"
                size="icon"
                className="size-12 shrink-0 rounded-xl"
                disabled={busy || !question.trim()}
                aria-label={localeText(locale, {
                  en: "Send question",
                  zh: "发送问题",
                  zhHant: "發送問題",
                  th: "ส่งคำถาม",
                })}
              >
                <HugeiconsIcon icon={ArrowUp02Icon} strokeWidth={1.8} />
              </Button>
            </div>
          </form>
        </div>

        <aside className="border-t border-[#dbe6ee] bg-white p-5 xl:border-t-0 xl:border-l">
          <h3 className="text-sm font-semibold text-[#111826]">
            {localeText(locale, {
              en: "Grounded context",
              zh: "工作区上下文",
              zhHant: "工作區上下文",
              th: "บริบทที่อ้างอิง",
            })}
          </h3>
          <p className="mt-1 text-xs leading-5 text-[#53667c]">
            {context.workspaceName}
          </p>
          <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5 xl:grid-cols-1">
            {context.metrics.map((metric) => (
              <div key={metric.label}>
                <dt className="text-xs text-[#53667c]">{metric.label}</dt>
                <dd className="mt-1 text-xl font-semibold tracking-[-0.025em] text-[#111826] tabular-nums">
                  {metric.value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 border-t border-[#dbe6ee] pt-5">
            <h3 className="text-sm font-semibold text-[#111826]">
              {localeText(locale, {
                en: "Demo activity",
                zh: "演示活动",
                zhHant: "示範活動",
                th: "กิจกรรมสาธิต",
              })}
            </h3>
            {activity.length ? (
              <ul className="mt-3 grid gap-3 text-xs leading-5 text-[#53667c]">
                {activity.map((item, index) => (
                  <li key={`${item}-${index}`} className="flex gap-2">
                    <HugeiconsIcon
                      icon={CheckmarkCircle02Icon}
                      className="mt-0.5 size-4 shrink-0 text-[#08664d]"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs leading-5 text-[#53667c]">
                {localeText(locale, {
                  en: "Approved demo actions will appear here. They do not persist.",
                  zh: "已批准的演示操作将显示在此处，不会持久保存。",
                  zhHant: "已批准的示範操作將顯示在此處，不會持久保存。",
                  th: "การดำเนินการสาธิตที่อนุมัติจะแสดงที่นี่และจะไม่ถูกบันทึกถาวร",
                })}
              </p>
            )}
          </div>
        </aside>
      </div>
    </section>
  )
}

export function PlexaRoleAccessPanel({
  locale,
  settingId,
  initialAccess,
}: {
  locale: Locale
  settingId?: string
  initialAccess: PlexaRoleAccess
}) {
  const router = useRouter()
  const [access, setAccess] = useState(initialAccess)
  const [pending, startTransition] = useTransition()

  function updateRole(role: keyof PlexaRoleAccess, enabled: boolean) {
    if (!settingId || pending) return

    const nextAccess = { ...access, [role]: enabled }
    setAccess(nextAccess)

    startTransition(async () => {
      const result = await updatePlexaRoleAccessAction({
        locale,
        settingId,
        ...nextAccess,
      })

      if (!result.ok) {
        setAccess(access)
        toast.error(result.error ?? "Unable to update PLEXA access.")
        return
      }

      toast.success(
        `${role === "admin" ? "Admin" : "Vendor"} PLEXA access ${enabled ? "enabled" : "disabled"}.`
      )
      router.refresh()
    })
  }

  return (
    <section className="rounded-2xl bg-[#071326] p-5 text-white sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-[#0a84ff] text-[#071326]">
              <HugeiconsIcon icon={AiBrain01Icon} strokeWidth={1.8} />
            </span>
            <h2 className="text-xl font-semibold tracking-[-0.02em]">
              PLEXA distribution control
            </h2>
          </div>
          <p className="mt-4 text-sm leading-6 text-[#b8cadc]">
            Superadmin always retains access. Enable the interactive PLEXA demo
            for each downstream role. Changes are platform-wide and audited.
          </p>
        </div>
        <Badge className="w-fit bg-[#fff0c9] text-[#735000] hover:bg-[#fff0c9]">
          Demo capability
        </Badge>
      </div>

      {settingId ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {(
            [
              [
                "admin",
                "Admin / Organizer",
                "Show PLEXA in every active Admin tenant workspace.",
              ],
              [
                "vendor",
                "Business Participant",
                "Show PLEXA to Delegation and Partner Vendor accounts.",
              ],
            ] as const
          ).map(([role, label, description]) => (
            <div
              key={role}
              className="flex min-h-28 items-center justify-between gap-4 rounded-xl bg-white/7 px-4 py-4"
            >
              <div>
                <Label htmlFor={`plexa-access-${role}`} className="text-sm">
                  {label}
                </Label>
                <p className="mt-1 text-xs leading-5 text-[#b8cadc]">
                  {description}
                </p>
              </div>
              <Switch
                id={`plexa-access-${role}`}
                checked={access[role]}
                disabled={pending}
                onCheckedChange={(enabled) => updateRole(role, enabled)}
                aria-label={`${label} PLEXA access`}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-xl bg-[#fff0c9] px-4 py-3 text-sm text-[#735000]">
          Apply the PLEXA role-access migration before using these controls.
        </div>
      )}
    </section>
  )
}
