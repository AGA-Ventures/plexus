"use client"

import { useDeferredValue, useMemo, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowUpRight01Icon,
  CheckmarkCircle02Icon,
  Search01Icon,
  WhatsappIcon,
} from "@hugeicons/core-free-icons"

import {
  buildPreEventWhatsAppHref,
  type PreEventCountryOption,
} from "@/lib/pre-event"

type CountryExplorerCopy = {
  searchLabel: string
  searchPlaceholder: string
  resultCount: string
  empty: string
  selectCountry: string
  selectedLabel: string
  whatsappCta: string
  whatsappAria: string
  messageTemplate: string
  countryFallback: string
}

type PreEventCountryExplorerProps = {
  countries: PreEventCountryOption[]
  copy: CountryExplorerCopy
  whatsappNumber: string | null
  whatsappDisplay: string | null
}

export function PreEventCountryExplorer({
  countries,
  copy,
  whatsappNumber,
  whatsappDisplay,
}: PreEventCountryExplorerProps) {
  const [query, setQuery] = useState("")
  const [selectedCountryCode, setSelectedCountryCode] = useState<string | null>(
    null
  )
  const deferredQuery = useDeferredValue(query)
  const normalizedQuery = deferredQuery.trim().toLocaleLowerCase()
  const filteredCountries = useMemo(() => {
    if (!normalizedQuery) {
      return countries
    }

    return countries.filter(
      ({ countryCode, countryName }) =>
        countryName.toLocaleLowerCase().includes(normalizedQuery) ||
        countryCode.toLocaleLowerCase().includes(normalizedQuery)
    )
  }, [countries, normalizedQuery])
  const selectedCountry = selectedCountryCode
    ? (countries.find(
        ({ countryCode }) => countryCode === selectedCountryCode
      ) ?? null)
    : null
  const contactCountry = selectedCountry?.countryName ?? copy.countryFallback
  const whatsappHref = buildPreEventWhatsAppHref({
    countryName: contactCountry,
    messageTemplate: copy.messageTemplate,
    whatsappNumber,
  })

  return (
    <div className="rounded-[4px] border border-[#c9d8e6] bg-white p-4 sm:p-6">
      <label
        htmlFor="pre-event-country-search"
        className="text-sm font-semibold text-[#111826]"
      >
        {copy.searchLabel}
      </label>
      <div className="relative mt-3">
        <HugeiconsIcon
          icon={Search01Icon}
          size={18}
          strokeWidth={1.8}
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#0758c8]"
        />
        <input
          id="pre-event-country-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={copy.searchPlaceholder}
          className="h-12 w-full rounded-[4px] border border-[#c9d8e6] bg-[#f6f9fc] pr-4 pl-10 text-base text-[#111826] outline-none placeholder:text-[#607084] focus-visible:border-[#0a84ff] focus-visible:ring-2 focus-visible:ring-[#0a84ff]/35"
        />
      </div>

      <p className="mt-3 text-xs text-[#53667c]" aria-live="polite">
        {copy.resultCount.replace("{count}", String(filteredCountries.length))}
      </p>

      <div
        className="mt-4 grid max-h-[30rem] gap-1.5 overflow-y-auto rounded-[4px] border border-[#d5e1eb] bg-[#f6f9fc] p-2 sm:grid-cols-2 lg:max-h-[34rem]"
        aria-label={copy.searchLabel}
        role="group"
      >
        {filteredCountries.length > 0 ? (
          filteredCountries.map(({ countryCode, countryName }) => {
            const isSelected = countryCode === selectedCountryCode

            return (
              <button
                key={countryCode}
                type="button"
                aria-pressed={isSelected}
                aria-label={copy.selectCountry.replace(
                  "{country}",
                  countryName
                )}
                onClick={() => setSelectedCountryCode(countryCode)}
                className={[
                  "flex min-h-12 items-center gap-3 rounded-[3px] border px-3 py-2 text-left text-sm transition focus-visible:ring-2 focus-visible:ring-[#0a84ff] focus-visible:outline-none",
                  isSelected
                    ? "border-[#0a84ff] bg-[#dcecf7] text-[#111826]"
                    : "border-transparent bg-white text-[#405872] hover:border-[#9db6cc] hover:text-[#111826]",
                ].join(" ")}
              >
                <span className="min-w-0 flex-1 truncate">{countryName}</span>
                <span className="text-[0.65rem] font-semibold tracking-[0.16em] text-[#6a7a8e]">
                  {countryCode}
                </span>
                {isSelected ? (
                  <HugeiconsIcon
                    icon={CheckmarkCircle02Icon}
                    size={17}
                    strokeWidth={1.8}
                    aria-hidden="true"
                    className="text-[#0758c8]"
                  />
                ) : null}
              </button>
            )
          })
        ) : (
          <p className="col-span-full px-4 py-12 text-center text-sm text-[#53667c]">
            {copy.empty}
          </p>
        )}
      </div>

      <div className="mt-5 rounded-[4px] border border-[#c9d8e6] bg-[#eef4f8] p-4">
        <p className="text-xs font-semibold tracking-[0.18em] text-[#0758c8] uppercase">
          {copy.selectedLabel}
        </p>
        <p className="mt-2 text-lg font-semibold text-[#111826]">
          {selectedCountry?.countryName ?? copy.countryFallback}
        </p>
        {selectedCountry && whatsappHref && whatsappDisplay ? (
          <>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              aria-label={copy.whatsappAria.replace(
                "{country}",
                contactCountry
              )}
              data-testid="pre-event-whatsapp"
              className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[11px] bg-[#075e54] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#064b43] focus-visible:ring-2 focus-visible:ring-[#075e54] focus-visible:ring-offset-2 focus-visible:outline-none sm:w-auto"
            >
              <HugeiconsIcon
                icon={WhatsappIcon}
                size={19}
                strokeWidth={1.9}
                aria-hidden="true"
              />
              {copy.whatsappCta}
              <HugeiconsIcon
                icon={ArrowUpRight01Icon}
                size={17}
                strokeWidth={1.9}
                aria-hidden="true"
              />
            </a>
          </>
        ) : null}
      </div>
    </div>
  )
}
