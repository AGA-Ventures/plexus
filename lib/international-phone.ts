import {
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js"

import { supportedMarkets } from "@/lib/markets"

export type CountryCallingCodeOption = {
  countryCode: CountryCode
  countryName: string
  callingCode: string
}

const englishRegionNames = new Intl.DisplayNames(["en"], { type: "region" })

export const countryCallingCodeOptions: CountryCallingCodeOption[] =
  getCountries()
    .map((countryCode) => ({
      countryCode,
      countryName: englishRegionNames.of(countryCode) ?? countryCode,
      callingCode: getCountryCallingCode(countryCode),
    }))
    .sort(
      (left, right) =>
        left.countryName.localeCompare(right.countryName, "en") ||
        left.countryCode.localeCompare(right.countryCode, "en")
    )

const countryCodeByRegionName = new Map<string, CountryCode>([
  ...supportedMarkets.map(
    (market) =>
      [market.nameEn.toLowerCase(), market.code as CountryCode] as const
  ),
  ["macau", "MO"],
])

const callingCodesByLength = [
  ...new Set(countryCallingCodeOptions.map((option) => option.callingCode)),
].sort((left, right) => right.length - left.length)

export function getCountryCodeForRegion(
  regionName: string,
  fallback: CountryCode = "MY"
) {
  const normalized = regionName.trim().toLowerCase()
  const knownCountry = countryCodeByRegionName.get(normalized)

  if (knownCountry) {
    return knownCountry
  }

  const matchedCountry = countryCallingCodeOptions.find(
    (option) => option.countryName.toLowerCase() === normalized
  )

  return matchedCountry?.countryCode ?? fallback
}

export function splitInternationalPhoneNumber(
  value: string,
  preferredCountry: CountryCode = "MY"
) {
  const trimmed = value.trim()

  if (!trimmed.startsWith("+")) {
    return {
      countryCode: preferredCountry,
      callingCode: getCountryCallingCode(preferredCountry),
      nationalNumber: trimmed,
    }
  }

  const parsed = parsePhoneNumberFromString(trimmed)
  const digits = trimmed.replace(/\D/g, "")
  const matchedCallingCode = callingCodesByLength.find((callingCode) =>
    digits.startsWith(callingCode)
  )
  const preferredCallingCode = getCountryCallingCode(preferredCountry)
  const callingCode =
    parsed?.countryCallingCode ?? matchedCallingCode ?? preferredCallingCode
  const candidates = countryCallingCodeOptions.filter(
    (option) => option.callingCode === callingCode
  )
  const countryCode =
    parsed?.country ??
    candidates.find((option) => option.countryCode === preferredCountry)
      ?.countryCode ??
    candidates[0]?.countryCode ??
    preferredCountry
  const prefixPattern = new RegExp(`^\\+\\s*${callingCode}\\s*`)

  return {
    countryCode,
    callingCode,
    nationalNumber: trimmed.replace(prefixPattern, ""),
  }
}

export function sanitizeNationalPhoneNumber(value: string) {
  return value
    .replace(/[^\d().\s-]/g, "")
    .replace(/\s{2,}/g, " ")
    .slice(0, 25)
}

export function composeInternationalPhoneNumber(
  countryCode: CountryCode,
  nationalNumber: string
) {
  const sanitizedNationalNumber =
    sanitizeNationalPhoneNumber(nationalNumber).trim()

  if (!sanitizedNationalNumber) {
    return ""
  }

  return `+${getCountryCallingCode(countryCode)} ${sanitizedNationalNumber}`
}
