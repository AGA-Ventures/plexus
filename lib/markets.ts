import type { Locale } from "@/lib/i18n"

export type SupportedMarket = {
  code: string
  nameEn: string
  nameNative: string
  defaultLocale: Locale
  complianceScope: "global" | "malaysia"
}

export const supportedMarkets = [
  {
    code: "CN",
    nameEn: "China",
    nameNative: "中国",
    defaultLocale: "zh",
    complianceScope: "global",
  },
  {
    code: "HK",
    nameEn: "Hong Kong",
    nameNative: "香港",
    defaultLocale: "zh-Hant",
    complianceScope: "global",
  },
  {
    code: "JP",
    nameEn: "Japan",
    nameNative: "日本",
    defaultLocale: "ja",
    complianceScope: "global",
  },
  {
    code: "KR",
    nameEn: "Republic of Korea",
    nameNative: "韩国",
    defaultLocale: "ko",
    complianceScope: "global",
  },
  {
    code: "TW",
    nameEn: "Chinese Taipei",
    nameNative: "中国台北",
    defaultLocale: "zh-Hant",
    complianceScope: "global",
  },
  {
    code: "MY",
    nameEn: "Malaysia",
    nameNative: "马来西亚",
    defaultLocale: "ms",
    complianceScope: "malaysia",
  },
  {
    code: "SG",
    nameEn: "Singapore",
    nameNative: "新加坡",
    defaultLocale: "en",
    complianceScope: "global",
  },
  {
    code: "TH",
    nameEn: "Thailand",
    nameNative: "泰国",
    defaultLocale: "th",
    complianceScope: "global",
  },
  {
    code: "ID",
    nameEn: "Indonesia",
    nameNative: "印尼",
    defaultLocale: "id",
    complianceScope: "global",
  },
  {
    code: "PH",
    nameEn: "Philippines",
    nameNative: "菲律宾",
    defaultLocale: "fil",
    complianceScope: "global",
  },
  {
    code: "VN",
    nameEn: "Vietnam",
    nameNative: "越南",
    defaultLocale: "vi",
    complianceScope: "global",
  },
  {
    code: "BN",
    nameEn: "Brunei Darussalam",
    nameNative: "文莱",
    defaultLocale: "ms",
    complianceScope: "global",
  },
  {
    code: "AU",
    nameEn: "Australia",
    nameNative: "澳大利亚",
    defaultLocale: "en",
    complianceScope: "global",
  },
  {
    code: "NZ",
    nameEn: "New Zealand",
    nameNative: "新西兰",
    defaultLocale: "en",
    complianceScope: "global",
  },
  {
    code: "PG",
    nameEn: "Papua New Guinea",
    nameNative: "巴布亚新几内亚",
    defaultLocale: "en",
    complianceScope: "global",
  },
  {
    code: "US",
    nameEn: "United States",
    nameNative: "美国",
    defaultLocale: "en",
    complianceScope: "global",
  },
  {
    code: "CA",
    nameEn: "Canada",
    nameNative: "加拿大",
    defaultLocale: "en",
    complianceScope: "global",
  },
  {
    code: "MX",
    nameEn: "Mexico",
    nameNative: "墨西哥",
    defaultLocale: "es",
    complianceScope: "global",
  },
  {
    code: "CL",
    nameEn: "Chile",
    nameNative: "智利",
    defaultLocale: "es",
    complianceScope: "global",
  },
  {
    code: "PE",
    nameEn: "Peru",
    nameNative: "秘鲁",
    defaultLocale: "es",
    complianceScope: "global",
  },
  {
    code: "RU",
    nameEn: "Russia",
    nameNative: "俄罗斯",
    defaultLocale: "ru",
    complianceScope: "global",
  },
] satisfies SupportedMarket[]

export const supportedMarketNames = supportedMarkets.map(
  (market) => market.nameEn
)

export function isMalaysiaMarket(value: string) {
  const normalized = value.trim().toLowerCase()

  return (
    normalized === "my" ||
    normalized === "malaysia" ||
    normalized === "马来西亚"
  )
}
