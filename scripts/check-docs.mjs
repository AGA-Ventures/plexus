import fs from "node:fs"
import path from "node:path"
import process from "node:process"

const root = process.cwd()
const failures = []
const ignoredDirectories = new Set([
  ".agents",
  ".design-qa",
  ".git",
  ".next",
  "coverage",
  "node_modules",
  "playwright-report",
  "test-results",
])
const headingExemptions = new Set([
  ".github/PULL_REQUEST_TEMPLATE.md",
  "AGENTS.md",
  "design-qa.md",
])
const requiredDocuments = [
  "README.md",
  "CONTRIBUTING.md",
  "CHANGELOG.md",
  "AGENTS.md",
  "docs/README.md",
  "docs/product/vision-and-scope.md",
  "docs/product/capability-map.md",
  "docs/architecture/system-overview.md",
  "docs/architecture/routes-and-access.md",
  "docs/architecture/database-schema.md",
  "docs/development/setup.md",
  "docs/development/workflow.md",
  "docs/development/codebase-map.md",
  "docs/development/environment-variables.md",
  "docs/development/plexus-command-center.html",
  "docs/project-management/operating-model.md",
  "docs/project-management/roadmap.md",
  "docs/project-management/decision-log.md",
  "docs/project-management/versioning-and-releases.md",
  "docs/quality/testing.md",
  "docs/quality/definition-of-done.md",
  "docs/operations/deployment.md",
  "docs/operations/runbook.md",
  "docs/operations/incident-response.md",
  "docs/security/authorization-and-data-security.md",
  "docs/reference/project-status.md",
  "docs/reference/command-reference.md",
  "docs/reference/glossary.md",
]

function walk(directory) {
  const files = []

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue

    const absolute = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      files.push(...walk(absolute))
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(absolute)
    }
  }

  return files
}

function relative(absolute) {
  return path.relative(root, absolute).split(path.sep).join("/")
}

function withoutLeadingFrontmatter(content) {
  const lines = content.split(/\r?\n/)
  if (lines[0]?.trim() !== "---") return content

  const closingIndex = lines.findIndex(
    (line, index) => index > 0 && ["---", "..."].includes(line.trim())
  )

  return closingIndex === -1
    ? content
    : lines.slice(closingIndex + 1).join("\n")
}

for (const document of requiredDocuments) {
  if (!fs.existsSync(path.join(root, document))) {
    failures.push(`Required document is missing: ${document}`)
  }
}

const markdownFiles = walk(root)

for (const absolute of markdownFiles) {
  const file = relative(absolute)
  const content = fs.readFileSync(absolute, "utf8")

  if (!headingExemptions.has(file)) {
    const firstContentLine = withoutLeadingFrontmatter(content)
      .split(/\r?\n/)
      .find((line) => line.trim().length > 0)

    if (!firstContentLine?.startsWith("# ")) {
      failures.push(`${file}: first content line must be one H1 heading`)
    }
  }

  const withoutCodeBlocks = content.replace(/```[\s\S]*?```/g, "")
  const links = withoutCodeBlocks.matchAll(/!?\[[^\]]*]\(([^)]+)\)/g)

  for (const match of links) {
    let target = match[1].trim()
    if (target.startsWith("<") && target.endsWith(">")) {
      target = target.slice(1, -1)
    }
    target = target.split(/\s+["']/)[0]

    if (
      !target ||
      target.startsWith("#") ||
      target.startsWith("/") ||
      /^[a-z][a-z0-9+.-]*:/i.test(target)
    ) {
      continue
    }

    const fileTarget = target.split("#", 1)[0].split("?", 1)[0]
    if (!fileTarget) continue

    let decodedTarget
    try {
      decodedTarget = decodeURIComponent(fileTarget)
    } catch {
      failures.push(`${file}: invalid encoded link target ${target}`)
      continue
    }

    const resolved = path.resolve(path.dirname(absolute), decodedTarget)
    if (!resolved.startsWith(`${root}${path.sep}`) && resolved !== root) {
      failures.push(`${file}: local link escapes the repository: ${target}`)
    } else if (!fs.existsSync(resolved)) {
      failures.push(`${file}: broken local link: ${target}`)
    }
  }
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`✗ ${failure}`)
  process.exitCode = 1
} else {
  console.log(
    `✓ Documentation check passed for ${markdownFiles.length} Markdown files.`
  )
}
