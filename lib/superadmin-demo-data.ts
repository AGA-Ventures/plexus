import type { AdminTenant, ManagedVendor } from "@/lib/management-data"

export const SUPERADMIN_VENDOR_DEMO_TARGET = 240
export const SUPERADMIN_VENDOR_DEMO_PREFIX = "demo-vendor-"

const companyNames = [
  "Meridian AgriTech",
  "Northstar Robotics",
  "Harbour Health Systems",
  "Atlas Mobility",
  "Lumen Food Sciences",
  "Cedar Digital Commerce",
  "Orchid Clean Energy",
  "Summit Precision",
  "Nexus Trade Logistics",
  "Bluegate Materials",
  "Horizon BioSolutions",
  "Keystone Smart Cities",
]

const companyNamesCn = [
  "经纬农业科技",
  "北辰机器人",
  "港湾医疗系统",
  "寰宇智慧出行",
  "明光食品科技",
  "杉木数字商贸",
  "兰花清洁能源",
  "高峰精密制造",
  "联汇贸易物流",
  "蓝门新材料",
  "远景生物方案",
  "基石智慧城市",
]

const sectors = [
  "Advanced Manufacturing",
  "Agriculture & Food",
  "Clean Energy",
  "Digital Commerce",
  "Healthcare",
  "Logistics",
  "Professional Services",
  "Smart Cities",
  "Technology",
  "Tourism & Hospitality",
]

const origins = [
  "Malaysia",
  "Macao",
  "Shanghai",
  "Guangdong",
  "Hong Kong",
  "Thailand",
]

const companySizes = ["1–10", "11–50", "51–200", "201–500", "500+"]

export function isSuperadminDemoVendor(vendor: Pick<ManagedVendor, "id">) {
  return vendor.id.startsWith(SUPERADMIN_VENDOR_DEMO_PREFIX)
}

export function buildSuperadminVendorDemoRecords(
  tenants: AdminTenant[],
  existingVendorCount: number,
  target = SUPERADMIN_VENDOR_DEMO_TARGET
): ManagedVendor[] {
  if (!tenants.length || existingVendorCount >= target) {
    return []
  }

  return Array.from({ length: target - existingVendorCount }, (_, index) => {
    const sequence = index + 1
    const tenant = tenants[index % tenants.length]
    const nameIndex = index % companyNames.length
    const status =
      sequence % 17 === 0
        ? "archived"
        : sequence % 11 === 0
          ? "suspended"
          : "active"
    const vendorType = sequence % 2 === 0 ? "partner" : "delegation"
    const createdAt = new Date(
      Date.UTC(2026, 0, 2 + (index % 180), 1 + (index % 12), (index * 7) % 60)
    ).toISOString()

    return {
      id: `${SUPERADMIN_VENDOR_DEMO_PREFIX}${String(sequence).padStart(4, "0")}`,
      admin_id: tenant.id,
      vendor_type: vendorType,
      name_en: `${companyNames[nameIndex]} ${String(Math.floor(index / companyNames.length) + 1).padStart(2, "0")}`,
      name_cn: `${companyNamesCn[nameIndex]} ${String(Math.floor(index / companyNames.length) + 1).padStart(2, "0")}`,
      sector: sectors[index % sectors.length],
      status,
      created_at: createdAt,
      updated_at: createdAt,
      company_size: companySizes[index % companySizes.length],
      contact: `Demo contact ${sequence}`,
      contact_meta: `demo-${sequence}@example.invalid`,
      profile_complete: 55 + ((index * 13) % 46),
      origin: origins[index % origins.length],
      needs: "Illustrative cross-border partner discovery and meeting support.",
      coordinator: "Plexus demo team",
      partner_type:
        vendorType === "partner"
          ? (["Enterprise", "Association", "Government"] as const)[index % 3]
          : "Enterprise",
      offerings:
        "Illustrative capability profile for Superadmin scale demonstration.",
    }
  })
}
