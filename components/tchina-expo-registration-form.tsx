"use client"

import Link from "next/link"
import Image from "next/image"
import { useMemo, useState, type FormEvent } from "react"
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Building01Icon,
  Calendar03Icon,
  CheckmarkCircle02Icon,
  Location01Icon,
  Mail01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import type { EventAttendeeType, TChinaLocale } from "@/lib/tchina-expo"
import { tchinaAttendanceDates } from "@/lib/tchina-expo"
import type { TChinaPublicEvent } from "@/lib/tchina-expo-server"

type FormState = {
  fullName: string
  email: string
  mobileNumber: string
  chatPlatform: "none" | "whatsapp" | "wechat"
  chatId: string
  countryRegion: string
  preferredLanguage: TChinaLocale
  attendanceDates: string[]
  companyNameEn: string
  companyNameZh: string
  delegatePosition: string
  website: string
  sectors: string[]
  productsServices: string
  offers: string
  needs: string
  desiredPartners: string
  desiredOutcomes: string
  businessMatchingInterest: boolean
  organization: string
  visitorPosition: string
  industryInterests: string[]
  visitPurpose: string
  consent: boolean
  websiteConfirm: string
}

const initialForm: FormState = {
  fullName: "",
  email: "",
  mobileNumber: "",
  chatPlatform: "none",
  chatId: "",
  countryRegion: "",
  preferredLanguage: "en",
  attendanceDates: [],
  companyNameEn: "",
  companyNameZh: "",
  delegatePosition: "",
  website: "",
  sectors: [],
  productsServices: "",
  offers: "",
  needs: "",
  desiredPartners: "",
  desiredOutcomes: "",
  businessMatchingInterest: true,
  organization: "",
  visitorPosition: "",
  industryInterests: [],
  visitPurpose: "",
  consent: false,
  websiteConfirm: "",
}

const sectorOptions = [
  ["Manufacturing", "制造业"],
  ["Technology", "科技"],
  ["Consumer goods", "消费品"],
  ["Food & agriculture", "食品与农业"],
  ["Healthcare", "医疗健康"],
  ["Professional services", "专业服务"],
] as const

const copy = {
  en: {
    eyebrow: "Guangzhou · 31 Aug—4 Sep 2026",
    title: "Tell us how you want to take part.",
    intro:
      "Choose the route that fits your visit. One person, one registration. Every submission is reviewed before an invitation is confirmed.",
    stepLabels: ["Path", "Your details", "Your visit", "Review"],
    delegate: "Business Delegate",
    delegateDesc:
      "For company representatives seeking meetings, partners, buyers or market opportunities.",
    visitor: "General Visitor",
    visitorDesc:
      "For attendees exploring the expo, industries and participating organizations.",
    recommended: "Business matching route",
    choose: "Choose this path",
    selected: "Selected",
    required: "Required",
    next: "Continue",
    back: "Back",
    review: "Review registration",
    submit: "Submit for review",
    submitting: "Submitting…",
    sharedTitle: "Your details",
    sharedIntro: "Use information we can rely on for review and invitation.",
    fullName: "Full name",
    email: "Email address",
    mobile: "International mobile number",
    mobileHint: "Include the country code, for example +60 12 345 6789.",
    contactApp: "WhatsApp / WeChat",
    none: "I do not use either",
    contactId: "WhatsApp number or WeChat ID",
    contactCollectOnly:
      "Collected for reference only. No automated message will be sent.",
    country: "Country / region",
    language: "Preferred language",
    english: "English",
    chinese: "简体中文",
    dates: "Dates you plan to attend",
    delegateTitle: "Business profile and matching goals",
    visitorTitle: "Visit interests",
    companyEn: "Company name (English)",
    companyZh: "Company name (Chinese, optional)",
    position: "Position / title",
    website: "Company website (optional)",
    sectors: "Industry sectors",
    products: "Products or services",
    offers: "What can your company offer?",
    needs: "What does your company need?",
    partners: "Desired partners",
    outcomes: "Desired outcomes from the expo",
    matching: "I am interested in business-matching meetings.",
    organization: "Organization (optional)",
    visitorPosition: "Position / title (optional)",
    interests: "Industry interests",
    purpose: "Purpose of visit",
    reviewTitle: "Review before submitting",
    reviewIntro:
      "Check that this belongs to one attendee. You can edit either section before sending it for review.",
    attendeePath: "Attendee path",
    contact: "Contact and attendance",
    profile: "Questionnaire",
    edit: "Edit",
    consent:
      "I confirm this information is accurate and consent to Plexus and the event organizer processing it for registration, review and invitation purposes.",
    pendingTitle: "Registration received for review",
    pendingText:
      "This is a pending receipt, not entry confirmation. The organizer will review your information and contact the email address you supplied after a decision.",
    pendingNote: "No Plexus account has been created at this stage.",
    close: "You may now close this page.",
    error:
      "Registration could not be submitted. Check your information and try again.",
    privacy:
      "We do not ask for passports, identity documents, visa or financial information.",
    preview: "Local preview — no registration data will be saved.",
    support: "Support",
    organizedBy: "Organized by",
    venue: "Venue",
    validationRequired: "Complete this field.",
    validationEmail: "Enter a valid email address.",
    validationMobile: "Enter an international number beginning with +.",
    validationChoice: "Select at least one option.",
    validationConsent: "Consent is required to submit.",
  },
  zh: {
    eyebrow: "广州 · 2026年8月31日—9月4日",
    title: "请选择您的参会方式。",
    intro:
      "请选择适合您的登记路线。每次登记仅限一位参会者，所有提交内容均须审核后才会确认邀请。",
    stepLabels: ["路线", "个人资料", "参会需求", "检查提交"],
    delegate: "商务代表",
    delegateDesc:
      "适合希望安排商务洽谈、寻找合作伙伴、买家或市场机会的企业代表。",
    visitor: "普通观众",
    visitorDesc: "适合参观展会、了解行业及参展机构的人士。",
    recommended: "商务配对路线",
    choose: "选择此路线",
    selected: "已选择",
    required: "必填",
    next: "继续",
    back: "返回",
    review: "检查登记内容",
    submit: "提交审核",
    submitting: "提交中…",
    sharedTitle: "个人资料",
    sharedIntro: "请填写可供审核及发送邀请使用的真实资料。",
    fullName: "姓名",
    email: "电子邮箱",
    mobile: "国际手机号码",
    mobileHint: "请包含国家代码，例如 +60 12 345 6789。",
    contactApp: "WhatsApp / 微信",
    none: "两者都不使用",
    contactId: "WhatsApp 号码或微信号",
    contactCollectOnly: "仅作资料记录，不会发送自动消息。",
    country: "国家 / 地区",
    language: "首选语言",
    english: "English",
    chinese: "简体中文",
    dates: "计划参会日期",
    delegateTitle: "企业资料及商务配对目标",
    visitorTitle: "参观兴趣",
    companyEn: "公司英文名称",
    companyZh: "公司中文名称（选填）",
    position: "职位",
    website: "公司网站（选填）",
    sectors: "所属行业",
    products: "产品或服务",
    offers: "贵公司可提供什么？",
    needs: "贵公司需要什么？",
    partners: "希望对接的合作伙伴",
    outcomes: "期望从展会获得的成果",
    matching: "我有兴趣参加商务配对洽谈。",
    organization: "机构名称（选填）",
    visitorPosition: "职位（选填）",
    interests: "感兴趣的行业",
    purpose: "参观目的",
    reviewTitle: "提交前请检查",
    reviewIntro: "请确认本登记只属于一位参会者。提交前可返回修改任何部分。",
    attendeePath: "参会路线",
    contact: "联系方式与参会日期",
    profile: "问卷内容",
    edit: "修改",
    consent:
      "本人确认以上资料准确，并同意 Plexus 及活动主办方为登记、审核及邀请用途处理这些资料。",
    pendingTitle: "登记已收到，等待审核",
    pendingText:
      "这只是待审核回执，并非入场确认。主办方审核后，将通过您填写的电子邮箱通知结果。",
    pendingNote: "目前尚未创建 Plexus 账号。",
    close: "您现在可以关闭此页面。",
    error: "登记未能提交，请检查资料后再试。",
    privacy: "我们不会要求护照、身份证件、签证或财务资料。",
    preview: "本地预览——登记资料不会被保存。",
    support: "支持邮箱",
    organizedBy: "主办方",
    venue: "地点",
    validationRequired: "请填写此项。",
    validationEmail: "请输入有效的电子邮箱。",
    validationMobile: "请输入以 + 开头的国际号码。",
    validationChoice: "请至少选择一项。",
    validationConsent: "必须同意后方可提交。",
  },
} as const

const inputClass =
  "mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-[15px] text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
const textareaClass = `${inputClass} min-h-28 resize-y`

export function TChinaExpoRegistrationForm({
  locale,
  event,
  previewMode = false,
}: {
  locale: TChinaLocale
  event: TChinaPublicEvent
  previewMode?: boolean
}) {
  const t = copy[locale]
  const [step, setStep] = useState(0)
  const [attendeeType, setAttendeeType] = useState<EventAttendeeType | null>(
    null
  )
  const [form, setForm] = useState<FormState>(() => ({
    ...initialForm,
    preferredLanguage: locale,
  }))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const oppositeLocale = locale === "en" ? "zh" : "en"
  const pathLabel =
    attendeeType === "business_delegate" ? t.delegate : t.visitor
  const questionnaireRows = useMemo(() => {
    if (attendeeType === "business_delegate") {
      return [
        [t.companyEn, form.companyNameEn],
        [t.position, form.delegatePosition],
        [t.sectors, form.sectors.join(", ")],
        [t.products, form.productsServices],
        [t.offers, form.offers],
        [t.needs, form.needs],
        [t.partners, form.desiredPartners],
        [t.outcomes, form.desiredOutcomes],
      ]
    }
    return [
      [t.organization, form.organization || "—"],
      [t.visitorPosition, form.visitorPosition || "—"],
      [t.interests, form.industryInterests.join(", ")],
      [t.purpose, form.visitPurpose],
    ]
  }, [attendeeType, form, t])

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => {
      if (!current[key]) return current
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  function toggleList(
    key: "attendanceDates" | "sectors" | "industryInterests",
    value: string
  ) {
    update(
      key,
      form[key].includes(value)
        ? form[key].filter((item) => item !== value)
        : [...form[key], value]
    )
  }

  function validate(currentStep: number) {
    const nextErrors: Record<string, string> = {}
    if (currentStep === 0 && !attendeeType)
      nextErrors.attendeeType = t.validationChoice
    if (currentStep === 1) {
      if (!form.fullName.trim()) nextErrors.fullName = t.validationRequired
      if (!/^\S+@\S+\.\S+$/.test(form.email))
        nextErrors.email = t.validationEmail
      if (!/^\+[1-9][0-9 ()-]{6,30}$/.test(form.mobileNumber)) {
        nextErrors.mobileNumber = t.validationMobile
      }
      if (form.chatPlatform !== "none" && !form.chatId.trim()) {
        nextErrors.chatId = t.validationRequired
      }
      if (!form.countryRegion.trim())
        nextErrors.countryRegion = t.validationRequired
      if (!form.attendanceDates.length)
        nextErrors.attendanceDates = t.validationChoice
    }
    if (currentStep === 2 && attendeeType === "business_delegate") {
      const required: (keyof FormState)[] = [
        "companyNameEn",
        "delegatePosition",
        "productsServices",
        "offers",
        "needs",
        "desiredPartners",
        "desiredOutcomes",
      ]
      required.forEach((key) => {
        if (!String(form[key]).trim()) nextErrors[key] = t.validationRequired
      })
      if (!form.sectors.length) nextErrors.sectors = t.validationChoice
    }
    if (currentStep === 2 && attendeeType === "general_visitor") {
      if (!form.industryInterests.length)
        nextErrors.industryInterests = t.validationChoice
      if (!form.visitPurpose.trim())
        nextErrors.visitPurpose = t.validationRequired
    }
    if (currentStep === 3 && !form.consent)
      nextErrors.consent = t.validationConsent

    setErrors(nextErrors)
    const first = Object.keys(nextErrors)[0]
    if (first) {
      requestAnimationFrame(() =>
        document.querySelector<HTMLElement>(`[data-field="${first}"]`)?.focus()
      )
    }
    return !first
  }

  function continueForm() {
    if (!validate(step)) return
    setStep((current) => Math.min(current + 1, 3))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  async function submitRegistration(eventObject: FormEvent<HTMLFormElement>) {
    eventObject.preventDefault()
    if (!validate(3) || !attendeeType) return

    if (previewMode) {
      setSubmitted(true)
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }

    setSubmitting(true)
    setErrors({})

    const shared = {
      locale,
      attendeeType,
      fullName: form.fullName,
      email: form.email,
      mobileNumber: form.mobileNumber,
      chatPlatform: form.chatPlatform,
      chatId: form.chatId,
      countryRegion: form.countryRegion,
      preferredLanguage: form.preferredLanguage,
      attendanceDates: form.attendanceDates,
      consent: form.consent,
      websiteConfirm: form.websiteConfirm,
    }
    const payload =
      attendeeType === "business_delegate"
        ? {
            ...shared,
            attendeeType,
            delegate: {
              companyNameEn: form.companyNameEn,
              companyNameZh: form.companyNameZh,
              position: form.delegatePosition,
              website: form.website,
              sectors: form.sectors,
              productsServices: form.productsServices,
              offers: form.offers,
              needs: form.needs,
              desiredPartners: form.desiredPartners,
              desiredOutcomes: form.desiredOutcomes,
              businessMatchingInterest: form.businessMatchingInterest,
            },
          }
        : {
            ...shared,
            attendeeType,
            visitor: {
              organization: form.organization,
              position: form.visitorPosition,
              industryInterests: form.industryInterests,
              visitPurpose: form.visitPurpose,
            },
          }

    try {
      const response = await fetch("/api/tchina-expo/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const result = (await response.json()) as {
        ok?: boolean
        error?: string
        fieldErrors?: Record<string, string>
      }
      if (!response.ok || !result.ok) {
        setErrors({ form: result.error ?? t.error })
        return
      }
      setSubmitted(true)
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch {
      setErrors({ form: t.error })
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <EventShell
        locale={locale}
        event={event}
        oppositeLocale={oppositeLocale}
        previewMode={previewMode}
      >
        <div className="mx-auto flex min-h-[620px] max-w-2xl flex-col justify-center px-6 py-16 sm:px-10">
          <span className="flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
            <HugeiconsIcon
              icon={CheckmarkCircle02Icon}
              className="size-8"
              strokeWidth={1.8}
              aria-hidden
            />
          </span>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            {t.pendingTitle}
          </h1>
          <span className="mt-5 inline-flex w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">
            {pathLabel}
          </span>
          <p className="mt-5 text-base leading-7 text-slate-600">
            {t.pendingText}
          </p>
          <div className="mt-7 border-l border-blue-600 bg-blue-50 px-5 py-4 text-sm leading-6 text-blue-950">
            {t.pendingNote}
          </div>
          <p className="mt-7 text-sm text-slate-500">{t.close}</p>
        </div>
      </EventShell>
    )
  }

  return (
    <EventShell
      locale={locale}
      event={event}
      oppositeLocale={oppositeLocale}
      previewMode={previewMode}
    >
      <form onSubmit={submitRegistration} noValidate className="min-w-0">
        {step > 0 ? (
          <div className="border-b border-slate-200 px-5 py-4 sm:px-8">
            <ProgressStrip labels={t.stepLabels} step={step} />
          </div>
        ) : null}

        <div className="px-5 py-8 sm:px-8 lg:px-12 lg:py-11">
          {step === 0 ? (
            <section aria-labelledby="path-title">
              <h1
                id="path-title"
                className="max-w-2xl text-3xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-4xl"
              >
                {t.title}
              </h1>
              <p className="mt-4 max-w-2xl text-[15px] leading-7 text-slate-600">
                {t.intro}
              </p>
              <div
                className="mt-8 grid gap-4 md:grid-cols-[1.08fr_.92fr]"
                role="radiogroup"
                aria-label={t.attendeePath}
              >
                <PathChoice
                  selected={attendeeType === "business_delegate"}
                  title={t.delegate}
                  description={t.delegateDesc}
                  badge={t.recommended}
                  featured
                  icon={Building01Icon}
                  action={
                    attendeeType === "business_delegate" ? t.selected : t.choose
                  }
                  onClick={() => setAttendeeType("business_delegate")}
                />
                <PathChoice
                  selected={attendeeType === "general_visitor"}
                  title={t.visitor}
                  description={t.visitorDesc}
                  icon={UserGroupIcon}
                  action={
                    attendeeType === "general_visitor" ? t.selected : t.choose
                  }
                  onClick={() => setAttendeeType("general_visitor")}
                />
              </div>
              {errors.attendeeType ? (
                <FieldError>{errors.attendeeType}</FieldError>
              ) : null}
              <div className="mt-8 border-t border-slate-200 pt-6">
                <ProgressStrip labels={t.stepLabels} step={step} />
              </div>
              <div className="mt-8 border-t border-slate-200 pt-6" aria-hidden>
                <h2 className="text-lg font-semibold text-slate-900">
                  {t.sharedTitle}
                </h2>
                <p className="mt-1 text-sm text-slate-500">{t.sharedIntro}</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {[t.fullName, t.email].map((label) => (
                    <div key={label}>
                      <span className="text-xs font-medium text-slate-600">
                        {label}
                      </span>
                      <span className="mt-2 block h-11 rounded-xl border border-slate-200 bg-white" />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          {step === 1 ? (
            <section aria-labelledby="details-title">
              <SectionHeading
                eyebrow={pathLabel}
                title={t.sharedTitle}
                intro={t.sharedIntro}
              />
              <div className="mt-8 grid gap-x-5 gap-y-6 sm:grid-cols-2">
                <Field
                  label={t.fullName}
                  error={errors.fullName}
                  field="fullName"
                >
                  <input
                    data-field="fullName"
                    className={inputClass}
                    value={form.fullName}
                    onChange={(e) => update("fullName", e.target.value)}
                    autoComplete="name"
                  />
                </Field>
                <Field label={t.email} error={errors.email} field="email">
                  <input
                    data-field="email"
                    className={inputClass}
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    type="email"
                    autoComplete="email"
                  />
                </Field>
                <Field
                  label={t.mobile}
                  hint={t.mobileHint}
                  error={errors.mobileNumber}
                  field="mobileNumber"
                >
                  <input
                    data-field="mobileNumber"
                    className={inputClass}
                    value={form.mobileNumber}
                    onChange={(e) => update("mobileNumber", e.target.value)}
                    type="tel"
                    autoComplete="tel"
                    placeholder="+60 12 345 6789"
                  />
                </Field>
                <Field
                  label={t.country}
                  error={errors.countryRegion}
                  field="countryRegion"
                >
                  <input
                    data-field="countryRegion"
                    className={inputClass}
                    value={form.countryRegion}
                    onChange={(e) => update("countryRegion", e.target.value)}
                    autoComplete="country-name"
                  />
                </Field>
                <Field
                  label={t.contactApp}
                  hint={t.contactCollectOnly}
                  field="chatPlatform"
                >
                  <select
                    className={inputClass}
                    value={form.chatPlatform}
                    onChange={(e) =>
                      update(
                        "chatPlatform",
                        e.target.value as FormState["chatPlatform"]
                      )
                    }
                  >
                    <option value="none">{t.none}</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="wechat">WeChat / 微信</option>
                  </select>
                </Field>
                {form.chatPlatform !== "none" ? (
                  <Field
                    label={t.contactId}
                    error={errors.chatId}
                    field="chatId"
                  >
                    <input
                      data-field="chatId"
                      className={inputClass}
                      value={form.chatId}
                      onChange={(e) => update("chatId", e.target.value)}
                    />
                  </Field>
                ) : (
                  <div />
                )}
                <Field label={t.language} field="preferredLanguage">
                  <select
                    className={inputClass}
                    value={form.preferredLanguage}
                    onChange={(e) =>
                      update(
                        "preferredLanguage",
                        e.target.value as TChinaLocale
                      )
                    }
                  >
                    <option value="en">{t.english}</option>
                    <option value="zh">{t.chinese}</option>
                  </select>
                </Field>
              </div>
              <div className="mt-7">
                <ChoiceGroupLabel>{t.dates}</ChoiceGroupLabel>
                <div
                  className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3"
                  data-field="attendanceDates"
                  tabIndex={-1}
                >
                  {tchinaAttendanceDates.map((date) => (
                    <CheckboxChoice
                      key={date}
                      checked={form.attendanceDates.includes(date)}
                      onChange={() => toggleList("attendanceDates", date)}
                    >
                      {formatDate(date, locale)}
                    </CheckboxChoice>
                  ))}
                </div>
                {errors.attendanceDates ? (
                  <FieldError>{errors.attendanceDates}</FieldError>
                ) : null}
              </div>
            </section>
          ) : null}

          {step === 2 && attendeeType === "business_delegate" ? (
            <section aria-labelledby="delegate-title">
              <SectionHeading eyebrow={pathLabel} title={t.delegateTitle} />
              <div className="mt-8 grid gap-x-5 gap-y-6 sm:grid-cols-2">
                <Field
                  label={t.companyEn}
                  error={errors.companyNameEn}
                  field="companyNameEn"
                >
                  <input
                    data-field="companyNameEn"
                    className={inputClass}
                    value={form.companyNameEn}
                    onChange={(e) => update("companyNameEn", e.target.value)}
                    autoComplete="organization"
                  />
                </Field>
                <Field label={t.companyZh} field="companyNameZh">
                  <input
                    className={inputClass}
                    value={form.companyNameZh}
                    onChange={(e) => update("companyNameZh", e.target.value)}
                  />
                </Field>
                <Field
                  label={t.position}
                  error={errors.delegatePosition}
                  field="delegatePosition"
                >
                  <input
                    data-field="delegatePosition"
                    className={inputClass}
                    value={form.delegatePosition}
                    onChange={(e) => update("delegatePosition", e.target.value)}
                    autoComplete="organization-title"
                  />
                </Field>
                <Field label={t.website} field="website">
                  <input
                    className={inputClass}
                    type="url"
                    value={form.website}
                    onChange={(e) => update("website", e.target.value)}
                    placeholder="https://"
                  />
                </Field>
              </div>
              <div className="mt-7">
                <ChoiceGroupLabel>{t.sectors}</ChoiceGroupLabel>
                <div
                  className="mt-3 grid gap-2 sm:grid-cols-2"
                  data-field="sectors"
                  tabIndex={-1}
                >
                  {sectorOptions.map(([en, zh]) => (
                    <CheckboxChoice
                      key={en}
                      checked={form.sectors.includes(en)}
                      onChange={() => toggleList("sectors", en)}
                    >
                      {locale === "zh" ? zh : en}
                    </CheckboxChoice>
                  ))}
                </div>
                {errors.sectors ? (
                  <FieldError>{errors.sectors}</FieldError>
                ) : null}
              </div>
              <div className="mt-7 grid gap-x-5 gap-y-6 sm:grid-cols-2">
                <Field
                  label={t.products}
                  error={errors.productsServices}
                  field="productsServices"
                >
                  <textarea
                    data-field="productsServices"
                    className={textareaClass}
                    value={form.productsServices}
                    onChange={(e) => update("productsServices", e.target.value)}
                  />
                </Field>
                <Field label={t.offers} error={errors.offers} field="offers">
                  <textarea
                    data-field="offers"
                    className={textareaClass}
                    value={form.offers}
                    onChange={(e) => update("offers", e.target.value)}
                  />
                </Field>
                <Field label={t.needs} error={errors.needs} field="needs">
                  <textarea
                    data-field="needs"
                    className={textareaClass}
                    value={form.needs}
                    onChange={(e) => update("needs", e.target.value)}
                  />
                </Field>
                <Field
                  label={t.partners}
                  error={errors.desiredPartners}
                  field="desiredPartners"
                >
                  <textarea
                    data-field="desiredPartners"
                    className={textareaClass}
                    value={form.desiredPartners}
                    onChange={(e) => update("desiredPartners", e.target.value)}
                  />
                </Field>
                <Field
                  label={t.outcomes}
                  error={errors.desiredOutcomes}
                  field="desiredOutcomes"
                >
                  <textarea
                    data-field="desiredOutcomes"
                    className={textareaClass}
                    value={form.desiredOutcomes}
                    onChange={(e) => update("desiredOutcomes", e.target.value)}
                  />
                </Field>
              </div>
              <label className="mt-6 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-950">
                <input
                  type="checkbox"
                  className="mt-1 size-4 accent-blue-700"
                  checked={form.businessMatchingInterest}
                  onChange={(e) =>
                    update("businessMatchingInterest", e.target.checked)
                  }
                />
                {t.matching}
              </label>
            </section>
          ) : null}

          {step === 2 && attendeeType === "general_visitor" ? (
            <section aria-labelledby="visitor-title">
              <SectionHeading eyebrow={pathLabel} title={t.visitorTitle} />
              <div className="mt-8 grid gap-x-5 gap-y-6 sm:grid-cols-2">
                <Field label={t.organization} field="organization">
                  <input
                    className={inputClass}
                    value={form.organization}
                    onChange={(e) => update("organization", e.target.value)}
                    autoComplete="organization"
                  />
                </Field>
                <Field label={t.visitorPosition} field="visitorPosition">
                  <input
                    className={inputClass}
                    value={form.visitorPosition}
                    onChange={(e) => update("visitorPosition", e.target.value)}
                    autoComplete="organization-title"
                  />
                </Field>
              </div>
              <div className="mt-7">
                <ChoiceGroupLabel>{t.interests}</ChoiceGroupLabel>
                <div
                  className="mt-3 grid gap-2 sm:grid-cols-2"
                  data-field="industryInterests"
                  tabIndex={-1}
                >
                  {sectorOptions.map(([en, zh]) => (
                    <CheckboxChoice
                      key={en}
                      checked={form.industryInterests.includes(en)}
                      onChange={() => toggleList("industryInterests", en)}
                    >
                      {locale === "zh" ? zh : en}
                    </CheckboxChoice>
                  ))}
                </div>
                {errors.industryInterests ? (
                  <FieldError>{errors.industryInterests}</FieldError>
                ) : null}
              </div>
              <div className="mt-7">
                <Field
                  label={t.purpose}
                  error={errors.visitPurpose}
                  field="visitPurpose"
                >
                  <textarea
                    data-field="visitPurpose"
                    className={textareaClass}
                    value={form.visitPurpose}
                    onChange={(e) => update("visitPurpose", e.target.value)}
                  />
                </Field>
              </div>
            </section>
          ) : null}

          {step === 3 ? (
            <section aria-labelledby="review-title">
              <SectionHeading
                eyebrow={pathLabel}
                title={t.reviewTitle}
                intro={t.reviewIntro}
              />
              <ReviewSection
                title={t.attendeePath}
                onEdit={() => setStep(0)}
                edit={t.edit}
              >
                <ReviewRow label={t.attendeePath} value={pathLabel} />
              </ReviewSection>
              <ReviewSection
                title={t.contact}
                onEdit={() => setStep(1)}
                edit={t.edit}
              >
                <ReviewRow label={t.fullName} value={form.fullName} />
                <ReviewRow label={t.email} value={form.email} />
                <ReviewRow label={t.mobile} value={form.mobileNumber} />
                <ReviewRow label={t.country} value={form.countryRegion} />
                <ReviewRow
                  label={t.dates}
                  value={form.attendanceDates
                    .map((date) => formatDate(date, locale))
                    .join(", ")}
                />
              </ReviewSection>
              <ReviewSection
                title={t.profile}
                onEdit={() => setStep(2)}
                edit={t.edit}
              >
                {questionnaireRows.map(([label, value]) => (
                  <ReviewRow key={label} label={label} value={value} />
                ))}
              </ReviewSection>
              <label
                className={`mt-7 flex items-start gap-3 rounded-xl border p-4 text-sm leading-6 ${errors.consent ? "border-red-400 bg-red-50" : "border-slate-300 bg-white"}`}
              >
                <input
                  data-field="consent"
                  type="checkbox"
                  className="mt-1 size-4 accent-blue-700"
                  checked={form.consent}
                  onChange={(e) => update("consent", e.target.checked)}
                />
                <span>{t.consent}</span>
              </label>
              {errors.consent ? (
                <FieldError>{errors.consent}</FieldError>
              ) : null}
              <p className="mt-4 text-xs leading-5 text-slate-500">
                {t.privacy}
              </p>
              <div className="pointer-events-none absolute -left-[9999px] size-px overflow-hidden">
                <label>
                  Leave this field empty
                  <input
                    tabIndex={-1}
                    autoComplete="off"
                    value={form.websiteConfirm}
                    onChange={(e) => update("websiteConfirm", e.target.value)}
                  />
                </label>
              </div>
            </section>
          ) : null}

          {errors.form ? (
            <div
              className="mt-7 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
              role="alert"
            >
              {errors.form}
            </div>
          ) : null}

          <div className="mt-9 flex items-center justify-between gap-4 border-t border-slate-200 pt-6">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => setStep((current) => current - 1)}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-950"
              >
                <HugeiconsIcon
                  icon={ArrowLeft01Icon}
                  className="size-4"
                  strokeWidth={1.8}
                  aria-hidden
                />
                {t.back}
              </button>
            ) : (
              <span />
            )}
            {step < 3 ? (
              <button
                type="button"
                data-field="attendeeType"
                onClick={continueForm}
                className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-blue-700 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
              >
                {step === 2 ? t.review : t.next}
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  className="size-4"
                  strokeWidth={1.8}
                  aria-hidden
                />
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="min-h-12 rounded-xl bg-blue-700 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-wait disabled:opacity-60"
              >
                {submitting ? t.submitting : t.submit}
              </button>
            )}
          </div>
        </div>
      </form>
    </EventShell>
  )
}

function EventShell({
  locale,
  event,
  oppositeLocale,
  previewMode,
  children,
}: {
  locale: TChinaLocale
  event: TChinaPublicEvent
  oppositeLocale: TChinaLocale
  previewMode: boolean
  children: React.ReactNode
}) {
  const t = copy[locale]
  return (
    <main className="min-h-svh bg-[#eef3f8] text-slate-950">
      <header className="h-[68px] bg-[#071b36] text-white">
        <div className="mx-auto flex h-full max-w-[1280px] items-center justify-between px-5 sm:px-8">
          <Link
            href={`/${locale}`}
            className="flex min-h-11 items-center rounded-md focus-visible:ring-2 focus-visible:ring-cyan-300"
            aria-label="Plexus"
          >
            <Image
              src="/plexus-wordmark-transparent-trimmed.png"
              alt="Plexus"
              width={1933}
              height={311}
              priority
              className="h-auto w-32 object-contain sm:w-36"
            />
          </Link>
          <Link
            href={`/${oppositeLocale}/tchina-expo${previewMode ? "/preview" : ""}`}
            className="rounded-md border border-white/20 px-3 py-2 text-xs font-semibold text-white/85 hover:border-white/50 hover:text-white"
            hrefLang={oppositeLocale}
          >
            {oppositeLocale === "zh" ? "中文" : "EN"}
          </Link>
        </div>
      </header>
      {previewMode ? (
        <div className="border-b border-amber-300 bg-amber-100 px-5 py-2.5 text-center text-xs font-semibold text-amber-950">
          {t.preview}
        </div>
      ) : null}
      <div className="mx-auto grid max-w-[1280px] min-[880px]:min-h-[calc(100svh-68px)] min-[880px]:grid-cols-[clamp(300px,32vw,380px)_minmax(0,1fr)]">
        <aside className="bg-[#0f5bd3] px-5 py-7 text-white min-[880px]:px-8 min-[880px]:py-11 sm:px-8">
          <div className="min-[880px]:sticky min-[880px]:top-8">
            <h2 className="max-w-md text-2xl font-semibold tracking-[-0.035em] min-[880px]:text-[1.75rem] sm:text-3xl lg:text-[2rem]">
              {event.title}
            </h2>
            <p className="mt-3 flex items-start gap-2 text-sm leading-5 text-blue-100">
              <HugeiconsIcon
                icon={Calendar03Icon}
                className="mt-0.5 size-4 shrink-0"
                strokeWidth={1.8}
                aria-hidden
              />
              <span>{t.eyebrow}</span>
            </p>
            <div className="mt-6 grid gap-y-5 border-y border-white/20 py-5 min-[600px]:max-[879px]:grid-cols-3 min-[600px]:max-[879px]:gap-x-6 min-[880px]:gap-0 min-[880px]:divide-y min-[880px]:divide-white/15 min-[880px]:py-0">
              <Briefing label={t.venue} icon={Location01Icon}>
                <strong>{event.venue_name}</strong>
                <span>{event.venue_address}</span>
                <span>{event.city}</span>
              </Briefing>
              <Briefing label={t.organizedBy} icon={Building01Icon}>
                <strong>{event.organizer_name}</strong>
              </Briefing>
              <Briefing label={t.support} icon={Mail01Icon}>
                <a
                  className="break-all underline decoration-white/40 underline-offset-4 hover:decoration-white"
                  href={`mailto:${event.support_email}`}
                >
                  {event.support_email}
                </a>
              </Briefing>
            </div>
            <p className="mt-5 max-w-3xl text-xs leading-5 text-blue-100 min-[880px]:mt-6">
              {t.privacy}
            </p>
          </div>
        </aside>
        <section className="min-w-0 bg-[#fbfaf7]">{children}</section>
      </div>
    </main>
  )
}

function PathChoice({
  selected,
  title,
  description,
  badge,
  featured = false,
  icon,
  action,
  onClick,
}: {
  selected: boolean
  title: string
  description: string
  badge?: string
  featured?: boolean
  icon: typeof Building01Icon
  action: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={`group min-h-64 rounded-2xl border p-6 text-left transition focus:ring-4 focus:ring-blue-100 focus:outline-none ${selected ? "border-blue-700 bg-blue-700 text-white shadow-lg" : featured ? "border-blue-500 bg-blue-50/40 text-slate-950 hover:border-blue-700 hover:shadow-md" : "border-slate-300 bg-white text-slate-950 hover:border-blue-500 hover:shadow-md"}`}
    >
      <span className="flex items-start justify-between gap-4">
        <span
          className={`flex size-11 items-center justify-center rounded-xl border ${selected ? "border-white/25 bg-white/10 text-white" : "border-blue-200 bg-white text-blue-700"}`}
        >
          <HugeiconsIcon icon={icon} className="size-6" strokeWidth={1.7} />
        </span>
        {badge ? (
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] uppercase ${selected ? "bg-white/15 text-white" : "bg-blue-100 text-blue-800"}`}
          >
            {badge}
          </span>
        ) : null}
      </span>
      <span className="mt-6 block text-2xl font-semibold tracking-[-0.025em]">
        {title}
      </span>
      <span
        className={`mt-3 block text-sm leading-6 ${selected ? "text-blue-50" : "text-slate-600"}`}
      >
        {description}
      </span>
      <span
        className={`mt-7 inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold ${selected || featured ? "bg-blue-700 text-white" : "border border-blue-300 text-blue-700"}`}
      >
        {action}
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          className="size-4"
          strokeWidth={1.8}
          aria-hidden
        />
      </span>
    </button>
  )
}

function SectionHeading({
  eyebrow,
  title,
  intro,
}: {
  eyebrow: string
  title: string
  intro?: string
}) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-3xl font-semibold tracking-[-0.035em] text-slate-950">
          {title}
        </h2>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">
          {eyebrow}
        </span>
      </div>
      {intro ? (
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          {intro}
        </p>
      ) : null}
    </div>
  )
}

function ProgressStrip({
  labels,
  step,
}: {
  labels: readonly string[]
  step: number
}) {
  return (
    <ol className="grid grid-cols-4 gap-2" aria-label="Registration progress">
      {labels.map((label, index) => (
        <li key={label} className="min-w-0">
          <div
            className={`h-1 rounded-full ${index <= step ? "bg-blue-600" : "bg-slate-200"}`}
          />
          <span
            className={`mt-2 block truncate text-[11px] font-medium sm:text-xs ${index === step ? "text-blue-700" : "text-slate-500"}`}
          >
            {index + 1}. {label}
          </span>
        </li>
      ))}
    </ol>
  )
}

function Field({
  label,
  hint,
  error,
  field,
  children,
}: {
  label: string
  hint?: string
  error?: string
  field: string
  children: React.ReactNode
}) {
  return (
    <label className="block text-sm font-medium text-slate-800">
      <span>{label}</span>
      {children}
      {hint ? (
        <span className="mt-2 block text-xs leading-5 font-normal text-slate-500">
          {hint}
        </span>
      ) : null}
      {error ? <FieldError>{error}</FieldError> : null}
      <span className="sr-only">{field}</span>
    </label>
  )
}

function FieldError({ children }: { children: React.ReactNode }) {
  return (
    <span className="mt-2 block text-xs font-medium text-red-700" role="alert">
      {children}
    </span>
  )
}
function ChoiceGroupLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-medium text-slate-800">{children}</p>
}
function CheckboxChoice({
  checked,
  onChange,
  children,
}: {
  checked: boolean
  onChange: () => void
  children: React.ReactNode
}) {
  return (
    <label
      className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${checked ? "border-blue-600 bg-blue-50 text-blue-950" : "border-slate-300 bg-white text-slate-700 hover:border-blue-400"}`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="size-4 accent-blue-700"
      />
      {children}
    </label>
  )
}
function Briefing({
  label,
  icon,
  children,
}: {
  label: string
  icon: typeof Building01Icon
  children: React.ReactNode
}) {
  return (
    <div className="grid min-w-0 grid-cols-[18px_minmax(0,1fr)] items-start gap-2.5 min-[880px]:py-4">
      <HugeiconsIcon
        icon={icon}
        className="mt-0.5 size-[18px] text-blue-100"
        strokeWidth={1.8}
        aria-hidden
      />
      <div className="min-w-0">
        <p className="text-[10px] font-semibold tracking-[0.14em] text-blue-100 uppercase">
          {label}
        </p>
        <div className="mt-1 flex min-w-0 flex-col text-[13px] leading-5 text-blue-50 [&_strong]:font-semibold [&_strong]:text-white">
          {children}
        </div>
      </div>
    </div>
  )
}
function ReviewSection({
  title,
  edit,
  onEdit,
  children,
}: {
  title: string
  edit: string
  onEdit: () => void
  children: React.ReactNode
}) {
  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
        <h3 className="font-semibold text-slate-950">{title}</h3>
        <button
          type="button"
          onClick={onEdit}
          className="text-xs font-semibold text-blue-700 hover:underline"
        >
          {edit}
        </button>
      </div>
      <dl className="mt-3 divide-y divide-slate-100">{children}</dl>
    </div>
  )
}
function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 py-3 text-sm sm:grid-cols-[180px_1fr]">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium break-words text-slate-800">{value || "—"}</dd>
    </div>
  )
}
function formatDate(date: string, locale: TChinaLocale) {
  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-GB", {
    dateStyle: "medium",
    timeZone: "Asia/Shanghai",
  }).format(new Date(`${date}T12:00:00+08:00`))
}
