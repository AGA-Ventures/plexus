export const locales = ["en", "zh", "zh-Hant", "th"] as const
export const localeParams = [
  "en",
  "zh",
  "cn",
  "zh-Hant",
  "zh-hant",
  "zht",
  "zh-tw",
  "th",
] as const

export type Locale = (typeof locales)[number]
export type LocaleParam = (typeof localeParams)[number]

export const localeLabels: Record<Locale, string> = {
  en: "EN",
  zh: "中文",
  "zh-Hant": "繁體中文",
  th: "ไทย",
}

export const localeNames: Record<Locale, string> = {
  en: "English",
  zh: "中文",
  "zh-Hant": "繁體中文",
  th: "ไทย",
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
    value === "zh-tw"
  ) {
    return "zh-Hant"
  }

  if (value === "th") {
    return "th"
  }

  return "en"
}
