import fs from "node:fs"
import path from "node:path"
import process from "node:process"
import { execFileSync } from "node:child_process"

const root = process.cwd()
const commandCenterPath = path.join(
  root,
  "docs/development/plexus-command-center.html"
)
const startMarker = "  /* COMMAND_CENTER_INVENTORY_START */"
const endMarker = "  /* COMMAND_CENTER_INVENTORY_END */"
const checkOnly = process.argv.includes("--check")

function trackedAndVisibleFiles() {
  const output = execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
    { cwd: root, encoding: "utf8" }
  )

  return output
    .split("\0")
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right))
}

function titleForMarkdown(file) {
  const content = fs.readFileSync(path.join(root, file), "utf8")
  const heading = content.match(/^#\s+(.+)$/m)?.[1]
  const frontmatterTitle = content.match(/^title:\s*["']?(.+?)["']?\s*$/m)?.[1]

  return heading ?? frontmatterTitle ?? path.posix.basename(file, ".md")
}

function documentGroup(file) {
  if (file.startsWith("docs/")) return "Canonical product and engineering docs"
  if (file.startsWith(".agents/")) return "Agent tooling references"
  if (file.startsWith(".impeccable/")) return "Design review artifacts"
  if (file.startsWith(".github/")) return "GitHub workflow"
  if (file.startsWith("public/")) return "Public assets"
  if (file.startsWith("supabase/")) return "Supabase"
  return "Repository root"
}

function routeFromFile(file) {
  const directory = path.posix.dirname(file).replace(/^app\/?/, "")
  const segments = directory
    .split("/")
    .filter((segment) => segment && !/^\(.+\)$/.test(segment))

  return `/${segments.join("/")}`
}

function pageAccess(route) {
  if (/vendor-signup/.test(route)) return "Public tenant application"
  if (/\/(?:\[locale\]\/)?login-preview$/.test(route)) {
    return "Protected operator preview"
  }
  if (/\/(?:\[locale\]\/)?reset-password$/.test(route)) {
    return "Verified recovery session"
  }
  if (
    /^\/(?:\[locale\]\/)?(?:superadmin|admin|vendor|delegation|partner|compliance)(?:\/|$)/.test(
      route
    )
  ) {
    return "Protected role route or alias"
  }
  if (/\/(?:\[locale\]\/)?(?:login|forgot-password)$/.test(route)) {
    return "Public authentication"
  }
  return "Public page or compatibility alias"
}

function handlerAccess(route) {
  if (route === "/api/vendor-applications") return "Public validated intake"
  if (route === "/api/webhooks/resend") return "Signed provider webhook"
  if (route === "/api/cron/email-reminders") return "Cron bearer secret"
  if (route === "/auth/callback") return "One-time Auth code"
  if (route === "/m/[slug]") return "Opaque time-limited link"
  if (route.startsWith("/api/lark/")) return "Protected provider authorization"
  if (route.startsWith("/api/admin/")) return "Owning Admin"
  if (route.startsWith("/api/compliance/")) return "Superadmin or owning Admin"
  if (route === "/api/meetings") return "Superadmin or owning Admin"
  if (route.startsWith("/api/mou-documents/")) return "Admin or participating Vendor"
  if (route.startsWith("/api/resources/")) return "Authorized resource audience"
  if (route === "/api/tenant-branding/logo") return "Superadmin or owning Admin"
  if (route.startsWith("/api/vendor/profile-documents")) return "Owning Vendor"
  return "See routes-and-access contract"
}

function methodsForHandler(file) {
  const content = fs.readFileSync(path.join(root, file), "utf8")
  const matches = content.matchAll(
    /export\s+(?:(?:async\s+)?function|const)\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/g
  )

  return [...new Set([...matches].map((match) => match[1]))]
}

function malaysiaDate() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kuala_Lumpur",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).formatToParts(new Date())
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))

  return `${values.day} ${values.month} ${values.year}`
}

function inventory() {
  const files = trackedAndVisibleFiles()
  const changedFiles = execFileSync(
    "git",
    ["status", "--porcelain=v1", "-z", "--untracked-files=all"],
    { cwd: root, encoding: "utf8" }
  )
    .split("\0")
    .filter(Boolean)
    .map((entry) => entry.slice(3))
    .filter((file) => file !== "docs/development/plexus-command-center.html")
  const markdownFiles = files.filter((file) => file.endsWith(".md"))
  const pageFiles = files.filter(
    (file) => file === "app/page.tsx" || /^app\/.+\/page\.tsx$/.test(file)
  )
  const handlerFiles = files.filter((file) => /^app\/.+\/route\.ts$/.test(file))
  const topLevelCounts = new Map()

  for (const file of files) {
    const topLevel = file.includes("/") ? file.split("/", 1)[0] : "(root files)"
    topLevelCounts.set(topLevel, (topLevelCounts.get(topLevel) ?? 0) + 1)
  }

  const documentGroups = new Map()
  for (const file of markdownFiles) {
    const group = documentGroup(file)
    const documents = documentGroups.get(group) ?? []
    documents.push({ file, title: titleForMarkdown(file) })
    documentGroups.set(group, documents)
  }

  const pages = pageFiles
    .map((file) => {
      const route = routeFromFile(file)
      return { access: pageAccess(route), file, route }
    })
    .sort((left, right) => left.route.localeCompare(right.route))
  const handlers = handlerFiles
    .map((file) => {
      const route = routeFromFile(file)
      return {
        access: handlerAccess(route),
        file,
        methods: methodsForHandler(file),
        route,
      }
    })
    .sort((left, right) => left.route.localeCompare(right.route))

  return {
    generated: malaysiaDate(),
    repository: {
      branch: execFileSync("git", ["branch", "--show-current"], {
        cwd: root,
        encoding: "utf8",
      }).trim(),
      commit: execFileSync("git", ["rev-parse", "--short=12", "HEAD"], {
        cwd: root,
        encoding: "utf8",
      }).trim(),
      e2eSpecs: files.filter((file) => /^tests\/.+\.spec\.ts$/.test(file)).length,
      markdownFiles: markdownFiles.length,
      migrations: files.filter((file) => /^supabase\/migrations\/.+\.sql$/.test(file))
        .length,
      pageRoutes: pages.length,
      projectFiles: files.length,
      routeHandlers: handlers.length,
      unitTestFiles: files.filter((file) => /^tests\/unit\/.+\.test\.ts$/.test(file))
        .length,
      workingTreeChanges: changedFiles.length,
    },
    topLevel: [...topLevelCounts]
      .map(([name, count]) => ({ count, name }))
      .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name)),
    documents: [...documentGroups]
      .map(([group, items]) => ({ group, items }))
      .sort((left, right) => left.group.localeCompare(right.group)),
    routes: { handlers, pages },
  }
}

if (!fs.existsSync(commandCenterPath)) {
  throw new Error(`Command center is missing: ${commandCenterPath}`)
}

const source = fs.readFileSync(commandCenterPath, "utf8")
const start = source.indexOf(startMarker)
const end = source.indexOf(endMarker)

if (start === -1 || end === -1 || end <= start) {
  throw new Error("Command center inventory markers are missing or out of order.")
}

const generatedBlock = `${startMarker}\n  inventory: ${JSON.stringify(inventory(), null, 2)
  .split("\n")
  .join("\n  ")},\n${endMarker}`
const updated = `${source.slice(0, start)}${generatedBlock}${source.slice(
  end + endMarker.length
)}`

function normalizeVolatileRepositoryFields(value) {
  return value
    .replace(/("branch": )"[^"]*"/, '$1"<volatile>"')
    .replace(/("commit": )"[^"]+"/, '$1"<volatile>"')
    .replace(/("workingTreeChanges": )\d+/, "$1<volatile>")
}

if (checkOnly) {
  if (
    normalizeVolatileRepositoryFields(updated) !==
    normalizeVolatileRepositoryFields(source)
  ) {
    console.error(
      "✗ Development Command Center inventory is stale. Run npm run docs:command-center."
    )
    process.exitCode = 1
  } else {
    console.log("✓ Development Command Center inventory matches the worktree.")
  }
} else if (updated === source) {
  console.log("✓ Development Command Center inventory is already current.")
} else {
  fs.writeFileSync(commandCenterPath, updated)
  console.log("✓ Updated Development Command Center from the current worktree.")
}
