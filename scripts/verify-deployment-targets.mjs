import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import process from "node:process"

const root = process.cwd()
const targetPath = path.join(root, ".deployment-targets.json")
const targets = JSON.parse(fs.readFileSync(targetPath, "utf8"))
const failures = []
const warnings = []
const notes = []

function runGit(args, { allowFailure = false } = {}) {
  try {
    return execFileSync("git", args, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim()
  } catch (error) {
    if (allowFailure) return ""
    throw error
  }
}

function readDotEnv(file) {
  if (!fs.existsSync(file)) return null

  const values = new Map()
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
    if (!match) continue

    let value = match[2].trim()
    if (
      value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = value.slice(1, -1)
    }
    values.set(match[1], value)
  }
  return values
}

function normalizeGitHubUrl(value) {
  return value
    .trim()
    .replace(/\/$/, "")
    .replace(/\.git$/, "")
}

const allowedPushUrls = targets.github.pushUrls.map(normalizeGitHubUrl)
const configuredPushUrl = runGit(
  ["remote", "get-url", "--push", targets.github.remote],
  { allowFailure: true }
)

if (!configuredPushUrl) {
  failures.push(`Git remote "${targets.github.remote}" is missing.`)
} else if (!allowedPushUrls.includes(normalizeGitHubUrl(configuredPushUrl))) {
  failures.push(
    `Git remote "${targets.github.remote}" points to an unapproved push URL.`
  )
}

if (process.env.GITHUB_REPOSITORY) {
  if (process.env.GITHUB_REPOSITORY !== targets.github.repository) {
    failures.push(
      `CI is running in ${process.env.GITHUB_REPOSITORY}, not ${targets.github.repository}.`
    )
  }
} else {
  const pushDefault = runGit(["config", "--get", "remote.pushDefault"], {
    allowFailure: true,
  })
  if (pushDefault !== targets.github.remote) {
    failures.push(
      `remote.pushDefault must be "${targets.github.remote}"; run npm run setup:repo.`
    )
  }

  const branchPushRemotes = runGit(
    ["config", "--get-regexp", "^branch\\..*\\.pushRemote$"],
    { allowFailure: true }
  )
  for (const line of branchPushRemotes.split(/\r?\n/).filter(Boolean)) {
    const [, remote] = line.split(/\s+/, 2)
    if (remote !== targets.github.remote) {
      failures.push(`A branch-specific push target is set to "${remote}".`)
    }
  }
}

const pushIndex = process.argv.indexOf("--push")
if (pushIndex !== -1) {
  const remoteName = process.argv[pushIndex + 1] ?? ""
  const remoteUrl = process.argv[pushIndex + 2] ?? ""

  if (
    remoteName !== targets.github.remote ||
    !allowedPushUrls.includes(normalizeGitHubUrl(remoteUrl))
  ) {
    failures.push(
      `Push blocked: only ${targets.github.remote} (${targets.github.repository}) is approved.`
    )
  }
}

const envExample = readDotEnv(path.join(root, ".env.example"))
if (!envExample) {
  failures.push(".env.example is missing.")
} else {
  if (envExample.get("NEXT_PUBLIC_SUPABASE_URL") !== targets.supabase.url) {
    failures.push(".env.example points to the wrong Supabase project.")
  }
  if (
    !envExample
      .get("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")
      ?.startsWith("sb_publishable_")
  ) {
    failures.push(".env.example is missing the Supabase publishable key.")
  }
  if (envExample.get("SUPABASE_SECRET_KEY")) {
    failures.push("SUPABASE_SECRET_KEY must be empty in .env.example.")
  }
}

const envLocal = readDotEnv(path.join(root, ".env.local"))
if (!envLocal) {
  warnings.push(
    ".env.local is absent; local Supabase development is not ready."
  )
} else {
  if (envLocal.get("NEXT_PUBLIC_SUPABASE_URL") !== targets.supabase.url) {
    failures.push(".env.local points to the wrong Supabase project.")
  }
  if (
    !envLocal
      .get("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")
      ?.startsWith("sb_publishable_")
  ) {
    failures.push(".env.local has an invalid Supabase publishable key.")
  }

  const secret = envLocal.get("SUPABASE_SECRET_KEY")
  if (secret && !secret.startsWith("sb_secret_")) {
    failures.push(".env.local has an invalid Supabase server secret format.")
  }
}

const trackedEnvFiles = runGit(["ls-files"], { allowFailure: true })
  .split(/\r?\n/)
  .filter((file) => /(^|\/)\.env($|\.)/.test(file) && file !== ".env.example")
if (trackedEnvFiles.length > 0) {
  failures.push(
    `Tracked environment file detected: ${trackedEnvFiles.join(", ")}`
  )
}

const trackedSecretFiles = runGit(
  ["grep", "-Il", "-E", "sb_secret_[A-Za-z0-9_-]{20,}"],
  { allowFailure: true }
)
  .split(/\r?\n/)
  .filter(Boolean)
if (trackedSecretFiles.length > 0) {
  failures.push(
    `A Supabase secret-shaped value is tracked in: ${trackedSecretFiles.join(", ")}`
  )
}

const supabaseConfig = path.join(root, "supabase", "config.toml")
if (!fs.existsSync(supabaseConfig)) {
  failures.push("supabase/config.toml is missing.")
} else {
  const config = fs.readFileSync(supabaseConfig, "utf8")
  if (
    !new RegExp(`major_version\\s*=\\s*${targets.supabase.postgresMajor}`).test(
      config
    )
  ) {
    failures.push("The local Postgres major version does not match production.")
  }
  if (!/\[auth\][\s\S]*?enable_signup\s*=\s*false/.test(config)) {
    failures.push("Local Supabase public signup must remain disabled.")
  }
}

const linkedRefPath = path.join(root, "supabase", ".temp", "project-ref")
const linkedRef = fs.existsSync(linkedRefPath)
  ? fs.readFileSync(linkedRefPath, "utf8").trim()
  : ""
if (!linkedRef) {
  const message =
    "Supabase CLI is not linked; run npm run supabase:login, then npm run supabase:link."
  if (process.argv.includes("--require-supabase-link")) {
    failures.push(message)
  } else {
    warnings.push(message)
  }
} else if (linkedRef !== targets.supabase.projectRef) {
  failures.push(`Supabase CLI is linked to the wrong project (${linkedRef}).`)
}

const vercelProjectPath = path.join(root, ".vercel", "project.json")
if (fs.existsSync(vercelProjectPath)) {
  const project = JSON.parse(fs.readFileSync(vercelProjectPath, "utf8"))
  if (
    project.projectId !== targets.vercel.projectId ||
    project.orgId !== targets.vercel.orgId
  ) {
    failures.push(".vercel/project.json points to the wrong Vercel project.")
  }
} else if (!process.env.CI) {
  warnings.push("This checkout is not linked to the approved Vercel project.")
}

notes.push(`GitHub: ${targets.github.repository} via ${targets.github.remote}`)
notes.push(
  `Supabase: ${targets.supabase.projectName} (${targets.supabase.projectRef})`
)
notes.push(
  `Vercel: ${targets.vercel.projectName} (${targets.vercel.projectId})`
)

for (const note of notes) console.log(`✓ ${note}`)
for (const warning of warnings) console.warn(`! ${warning}`)
for (const failure of failures) console.error(`✗ ${failure}`)

if (failures.length > 0) {
  process.exitCode = 1
} else {
  console.log("✓ Deployment target checks passed.")
}
