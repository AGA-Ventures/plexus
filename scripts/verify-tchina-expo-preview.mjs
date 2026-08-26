import assert from "node:assert/strict"
import { chromium } from "@playwright/test"

const baseUrl = process.env.TCHINA_PREVIEW_URL ?? "http://localhost:3001"

const browser = await chromium.launch({ headless: true })

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await page.goto(`${baseUrl}/en/tchina-expo/preview`, {
    waitUntil: "domcontentloaded",
  })
  await page.getByRole("radio", { name: /general visitor/i }).click()
  await page.getByRole("button", { name: "Continue" }).click()

  const callingCode = page.getByRole("combobox", { name: /^Calling code:/ })
  await callingCode.waitFor()
  assert.match(
    (await callingCode.getAttribute("aria-label")) ?? "",
    /Malaysia, \+60/
  )

  await callingCode.focus()
  await callingCode.press("Enter")
  const options = page.locator("[cmdk-item]")
  await options.first().waitFor()
  const flagSources = await options
    .locator("img")
    .evaluateAll((images) => images.map((image) => image.getAttribute("src")))
  assert.equal(flagSources.length, await options.count())
  assert.ok(
    flagSources.every((source) => source?.startsWith("/tchina-country-flags/"))
  )

  await page.getByPlaceholder("Search country or calling code…").fill("united")
  await page.getByRole("option", { name: /United States.*\+1/ }).click()
  await page.getByLabel("Full name").fill("Amina Tan")
  await page.getByLabel("Email address").fill("amina@example.com")
  await page
    .getByRole("textbox", { name: "International mobile number" })
    .fill("555 555 5555")
  const countryRegion = page.getByRole("combobox", {
    name: /^Country \/ region:/,
  })
  await countryRegion.focus()
  await countryRegion.press("Enter")
  await page.getByPlaceholder("Search country…").fill("malay")
  await page.getByRole("option", { name: "Malaysia" }).click()
  await page.locator('input[type="checkbox"]').first().check()
  await page.getByRole("button", { name: "Continue" }).click()
  await page.getByRole("heading", { name: "Visit interests" }).waitFor()
  await page.locator('input[type="checkbox"]').first().check()
  await page
    .getByRole("textbox", { name: "Purpose of visit" })
    .fill("Explore suppliers and market developments.")
  await page.getByRole("button", { name: "Review registration" }).click()
  await page
    .getByRole("heading", { name: "Review before submitting" })
    .waitFor()
  await page.getByText("+1 555 555 5555", { exact: true }).waitFor()

  const chinesePage = await browser.newPage({
    viewport: { width: 430, height: 932 },
  })
  await chinesePage.goto(`${baseUrl}/zh/tchina-expo/preview`, {
    waitUntil: "domcontentloaded",
  })
  await chinesePage.getByRole("radio", { name: /普通观众/ }).click()
  await chinesePage.getByRole("button", { name: "继续" }).click()
  const chineseCallingCode = chinesePage.getByRole("combobox", {
    name: /^国家代码:/,
  })
  await chineseCallingCode.waitFor()
  assert.match(
    (await chineseCallingCode.getAttribute("aria-label")) ?? "",
    /马来西亚, \+60/
  )
  await chineseCallingCode.focus()
  await chineseCallingCode.press("Enter")
  await chinesePage.getByPlaceholder("搜索国家或国家代码…").fill("中国")
  await chinesePage.getByRole("option", { name: /中国.*\+86/ }).click()
  assert.match(
    (await chineseCallingCode.locator("img").getAttribute("src")) ?? "",
    /\/tchina-country-flags\/cn\.svg$/
  )
  const chineseCountryRegion = chinesePage.getByRole("combobox", {
    name: /^国家 \/ 地区:/,
  })
  await chineseCountryRegion.focus()
  await chineseCountryRegion.press("Enter")
  await chinesePage.getByPlaceholder("搜索国家…").fill("马来西亚")
  await chinesePage.getByRole("option", { name: "马来西亚" }).click()
  assert.match(
    (await chineseCountryRegion.getAttribute("aria-label")) ?? "",
    /马来西亚/
  )
  await chinesePage.close()
  await page.close()
} finally {
  await browser.close()
}

console.log("TChina Expo phone preview verified.")
