export const locales = [
  "en",
  "zh",
  "zh-Hant",
  "ja",
  "ko",
  "ms",
  "th",
  "id",
  "fil",
  "vi",
  "es",
  "fr",
  "ru",
] as const
export const localeParams = [
  "en",
  "zh",
  "cn",
  "zh-Hant",
  "zh-hant",
  "zht",
  "zh-tw",
  "zh_TW",
  "tw",
  "ja",
  "jp",
  "ko",
  "kr",
  "ms",
  "my",
  "th",
  "id",
  "fil",
  "tl",
  "vi",
  "vn",
  "es",
  "mx",
  "cl",
  "pe",
  "fr",
  "ca-fr",
  "ru",
] as const

export type Locale = (typeof locales)[number]
export type LocaleParam = (typeof localeParams)[number]

export const localeLabels: Record<Locale, string> = {
  en: "EN",
  zh: "中文",
  "zh-Hant": "繁體中文",
  ja: "日本語",
  ko: "한국어",
  ms: "BM",
  th: "ไทย",
  id: "ID",
  fil: "Fil",
  vi: "VI",
  es: "ES",
  fr: "FR",
  ru: "RU",
}

export const localeNames: Record<Locale, string> = {
  en: "English",
  zh: "中文",
  "zh-Hant": "繁體中文",
  ja: "Japanese",
  ko: "Korean",
  ms: "Bahasa Malaysia",
  th: "ไทย",
  id: "Bahasa Indonesia",
  fil: "Filipino",
  vi: "Vietnamese",
  es: "Spanish",
  fr: "French",
  ru: "Russian",
}

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale)
}

export function isLocaleParam(value: string): value is LocaleParam {
  return localeParams.includes(value as LocaleParam)
}

export function normalizeLocale(value?: string): Locale {
  if (value === "zh" || value === "cn") {
    return "zh"
  }

  if (
    value === "zh-Hant" ||
    value === "zh-hant" ||
    value === "zht" ||
    value === "zh-tw" ||
    value === "zh_TW" ||
    value === "tw"
  ) {
    return "zh-Hant"
  }

  if (value === "ja" || value === "jp") {
    return "ja"
  }

  if (value === "ko" || value === "kr") {
    return "ko"
  }

  if (value === "ms" || value === "my") {
    return "ms"
  }

  if (value === "th") {
    return "th"
  }

  if (value === "id") {
    return "id"
  }

  if (value === "fil" || value === "tl") {
    return "fil"
  }

  if (value === "vi" || value === "vn") {
    return "vi"
  }

  if (value === "es" || value === "mx" || value === "cl" || value === "pe") {
    return "es"
  }

  if (value === "fr" || value === "ca-fr") {
    return "fr"
  }

  if (value === "ru") {
    return "ru"
  }

  return "en"
}

export function isChineseLocale(locale: Locale) {
  return locale === "zh" || locale === "zh-Hant"
}
