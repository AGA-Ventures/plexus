import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import process from "node:process"

const root = process.cwd()
const targets = JSON.parse(
  fs.readFileSync(path.join(root, ".deployment-targets.json"), "utf8")
)

function run(command, args, { allowFailure = false, timeout = 10000 } = {}) {
  try {
    return execFileSync(command, args, {
      cwd: root,
      encoding: "utf8",
      timeout,
      stdio: ["ignore", "pipe", "pipe"],
    }).trim()
  } catch (error) {
    if (allowFailure) return ""
    throw error
  }
}

function dotenvValue(file, key) {
  if (!fs.existsSync(file)) return ""
  const line = fs
    .readFileSync(file, "utf8")
    .split(/\r?\n/)
    .find((entry) => entry.startsWith(`${key}=`))
  return line?.slice(key.length + 1).replace(/^['"]|['"]$/g, "") ?? ""
}

const branch = run("git", ["branch", "--show-current"])
const commit = run("git", ["rev-parse", "--short=12", "HEAD"])
const upstream =
  run("git", ["rev-parse", "--abbrev-ref", "@{upstream}"], {
    allowFailure: true,
  }) || "not set"
const pushRemote =
  run("git", ["config", "--get", `branch.${branch}.pushRemote`], {
    allowFailure: true,
  }) ||
  run("git", ["config", "--get", "remote.pushDefault"], {
    allowFailure: true,
  }) ||
  "not set"
const pushUrl =
  pushRemote === "not set"
    ? "not set"
    : run("git", ["remote", "get-url", "--push", pushRemote], {
        allowFailure: true,
      }) || "not set"
const changedFiles = run("git", ["status", "--porcelain"], {
  allowFailure: true,
})
  .split(/\r?\n/)
  .filter(Boolean).length

const linkedRefPath = path.join(root, "supabase", ".temp", "project-ref")
const linkedRef = fs.existsSync(linkedRefPath)
  ? fs.readFileSync(linkedRefPath, "utf8").trim()
  : "not linked"
const localSupabaseUrl = dotenvValue(
  path.join(root, ".env.local"),
  "NEXT_PUBLIC_SUPABASE_URL"
)
const envStatus =
  localSupabaseUrl === targets.supabase.url
    ? "correct project"
    : localSupabaseUrl
      ? "WRONG project"
      : "not configured"

let vercelGit = "unavailable"
try {
  const raw = run(
    "vercel",
    ["api", `/v9/projects/${targets.vercel.projectId}`, "--raw"],
    { timeout: 15000 }
  )
  const project = JSON.parse(raw)
  vercelGit = project.link
    ? `${project.link.org}/${project.link.repo} (${project.link.productionBranch})`
    : "not connected; automatic deploy is off"
} catch {
  // The local status command remains useful without Vercel authentication.
}

console.log("Plexus project status")
console.log(`Git branch:       ${branch}`)
console.log(`Git commit:       ${commit}`)
console.log(`Git upstream:     ${upstream}`)
console.log(`Git push target:  ${pushRemote} -> ${pushUrl}`)
console.log(`Working tree:     ${changedFiles} changed/untracked file(s)`)
console.log(
  `Supabase target: ${targets.supabase.projectName} (${targets.supabase.projectRef})`
)
console.log(`Supabase CLI:     ${linkedRef}`)
console.log(`Local env:        ${envStatus}`)
console.log(
  `Vercel target:   ${targets.vercel.projectName} (${targets.vercel.projectId})`
)
console.log(`Vercel Git:       ${vercelGit}`)
console.log("Change record:    CHANGELOG.md")
