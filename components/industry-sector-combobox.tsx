"use client"

import { useState } from "react"
import { ArrowDown01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import {
  findIndustrySectorOption,
  industrySectorGroups,
  industrySectorOptions,
} from "@/lib/industry-sectors"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function IndustrySectorCombobox({
  id,
  name,
  defaultValue = "",
  value,
  onValueChange,
  required = false,
  disabled = false,
}: {
  id: string
  name: string
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  required?: boolean
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue)
  const selectedValue = value ?? uncontrolledValue
  const selectedOption = findIndustrySectorOption(selectedValue)
  const hasCustomSavedValue = Boolean(selectedValue && !selectedOption)
  const listId = `${id}-list`
  const helpId = `${id}-help`

  function selectSector(value: string) {
    if (onValueChange) {
      onValueChange(value)
    } else {
      setUncontrolledValue(value)
    }
    setOpen(false)
  }

  return (
    <div className="grid gap-1.5">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-describedby={helpId}
            aria-required={required}
            disabled={disabled}
            className="h-7 w-full min-w-0 justify-between bg-input/20 px-2 font-normal dark:bg-input/30"
          >
            <span className="min-w-0 truncate text-start">
              {selectedOption
                ? `${selectedOption.code} · ${selectedOption.label}`
                : selectedValue || "Select an industry sector"}
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
          className="w-[min(42rem,calc(100vw-2rem))] p-0"
        >
          <Command
            filter={(value, search) => {
              const normalizedValue = value.toLocaleLowerCase()
              const searchTerms = search
                .trim()
                .toLocaleLowerCase()
                .split(/\s+/)
                .filter(Boolean)

              return searchTerms.every((term) => normalizedValue.includes(term))
                ? 1
                : 0
            }}
          >
            <CommandInput
              placeholder="Search by industry, activity, or ISIC code…"
              aria-label="Search global industry sectors"
            />
            <CommandList id={listId} className="max-h-96">
              <CommandEmpty>
                No matching industry. Search a broader activity.
              </CommandEmpty>
              {hasCustomSavedValue ? (
                <>
                  <CommandGroup heading="Current saved value">
                    <CommandItem
                      value={`current saved custom value ${selectedValue}`}
                      data-checked
                      aria-selected
                      onSelect={() => selectSector(selectedValue)}
                    >
                      <span className="min-w-0 flex-1 truncate">
                        {selectedValue}
                      </span>
                      <span className="shrink-0 text-[0.625rem] text-muted-foreground">
                        Custom
                      </span>
                    </CommandItem>
                  </CommandGroup>
                  <CommandSeparator />
                </>
              ) : null}
              {industrySectorGroups.map((group) => (
                <CommandGroup
                  key={group.code}
                  heading={`${group.code} · ${group.label}`}
                >
                  {group.industries.map((industry) => (
                    <CommandItem
                      key={industry.code}
                      value={`${industry.code} ${industry.label} ${group.label}`}
                      data-checked={
                        selectedValue === industry.label || undefined
                      }
                      aria-selected={selectedValue === industry.label}
                      onSelect={() => selectSector(industry.label)}
                    >
                      <span className="w-7 shrink-0 font-medium tabular-nums">
                        {industry.code}
                      </span>
                      <span className="min-w-0 flex-1">{industry.label}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <input
        type="hidden"
        name={name}
        value={selectedValue}
        required={required}
      />
      <p id={helpId} className="text-xs text-muted-foreground">
        {disabled
          ? "This sector is read-only."
          : `Search ${industrySectorOptions.length} globally recognized industries across ${industrySectorGroups.length} UN ISIC groups.`}
        {hasCustomSavedValue
          ? " The current custom value is preserved until you select a replacement."
          : ""}
      </p>
    </div>
  )
}

export function IndustrySectorMultiCombobox({
  id,
  values,
  onToggle,
}: {
  id: string
  values: string[]
  onToggle: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const listId = `${id}-list`
  const helpId = `${id}-help`
  const customValues = values.filter(
    (selectedValue) => !findIndustrySectorOption(selectedValue)
  )

  return (
    <div className="grid gap-2">
      {values.length ? (
        <div
          className="flex flex-wrap gap-1.5"
          aria-label="Selected industries"
        >
          {values.map((selectedValue) => {
            const selectedOption = findIndustrySectorOption(selectedValue)

            return (
              <Button
                key={selectedValue}
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => onToggle(selectedValue)}
                aria-label={`Remove ${selectedValue}`}
              >
                {selectedOption
                  ? `${selectedOption.code} · ${selectedValue}`
                  : selectedValue}
                <span aria-hidden>×</span>
              </Button>
            )
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No industry sector selected.
        </p>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-describedby={helpId}
            className="w-full justify-between sm:w-fit"
          >
            Add industry sectors
            <HugeiconsIcon
              icon={ArrowDown01Icon}
              className="size-3.5 text-muted-foreground"
              strokeWidth={1.7}
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-[min(42rem,calc(100vw-2rem))] p-0"
        >
          <Command
            filter={(itemValue, search) => {
              const normalizedValue = itemValue.toLocaleLowerCase()
              const searchTerms = search
                .trim()
                .toLocaleLowerCase()
                .split(/\s+/)
                .filter(Boolean)

              return searchTerms.every((term) => normalizedValue.includes(term))
                ? 1
                : 0
            }}
          >
            <CommandInput
              placeholder="Search by industry, activity, or ISIC code…"
              aria-label="Search global industry sectors"
            />
            <CommandList id={listId} className="max-h-96">
              <CommandEmpty>
                No matching industry. Search a broader activity.
              </CommandEmpty>
              {customValues.length ? (
                <>
                  <CommandGroup heading="Current custom values">
                    {customValues.map((customValue) => (
                      <CommandItem
                        key={customValue}
                        value={`current saved custom value ${customValue}`}
                        data-checked
                        aria-selected
                        onSelect={() => onToggle(customValue)}
                      >
                        <span className="min-w-0 flex-1 truncate">
                          {customValue}
                        </span>
                        <span className="text-[0.625rem] text-muted-foreground">
                          Remove
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandSeparator />
                </>
              ) : null}
              {industrySectorGroups.map((group) => (
                <CommandGroup
                  key={group.code}
                  heading={`${group.code} · ${group.label}`}
                >
                  {group.industries.map((industry) => {
                    const selected = values.includes(industry.label)

                    return (
                      <CommandItem
                        key={industry.code}
                        value={`${industry.code} ${industry.label} ${group.label}`}
                        data-checked={selected || undefined}
                        aria-selected={selected}
                        onSelect={() => onToggle(industry.label)}
                      >
                        <span className="w-7 shrink-0 font-medium tabular-nums">
                          {industry.code}
                        </span>
                        <span className="min-w-0 flex-1">{industry.label}</span>
                        <span className="shrink-0 text-[0.625rem] text-muted-foreground">
                          {selected ? "Selected" : "Add"}
                        </span>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <p id={helpId} className="text-xs text-muted-foreground">
        Search and select one or more of {industrySectorOptions.length} global
        industries across {industrySectorGroups.length} UN ISIC groups.
      </p>
    </div>
  )
}
