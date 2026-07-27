import { execFileSync, spawnSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import process from "node:process"
import readline from "node:readline/promises"

const root = process.cwd()
const mode = process.argv[2]
if (!["plan", "apply"].includes(mode)) {
  throw new Error("Use plan or apply.")
}

const targets = JSON.parse(
  fs.readFileSync(path.join(root, ".deployment-targets.json"), "utf8")
)
const supabaseBin = path.join(
  root,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "supabase.cmd" : "supabase"
)

function run(command, args) {
  return execFileSync(command, args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim()
}

const targetCheck = spawnSync(
  process.execPath,
  [
    path.join(root, "scripts", "verify-deployment-targets.mjs"),
    "--require-supabase-link",
  ],
  { cwd: root, stdio: "inherit" }
)
if (targetCheck.status !== 0) process.exit(targetCheck.status ?? 1)

const dryRun = spawnSync(supabaseBin, ["db", "push", "--linked", "--dry-run"], {
  cwd: root,
  stdio: "inherit",
})
if (dryRun.status !== 0) process.exit(dryRun.status ?? 1)
if (mode === "plan") process.exit(0)

if (run("git", ["status", "--porcelain"])) {
  throw new Error("Commit or stash every change before a database push.")
}

const branch = run("git", ["branch", "--show-current"])
const localSha = run("git", ["rev-parse", "HEAD"])
const remoteLine = run("git", [
  "ls-remote",
  "--heads",
  targets.github.remote,
  `refs/heads/${branch}`,
])
if (remoteLine.split(/\s+/, 1)[0] !== localSha) {
  throw new Error("Push this exact migration commit to GitHub first.")
}

if (!process.stdin.isTTY) {
  throw new Error("Database confirmation requires an interactive terminal.")
}

const expected = `PUSH ${targets.supabase.projectRef}`
const prompt = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})
const answer = await prompt.question(
  `Type "${expected}" to apply migrations to ${targets.supabase.projectName}: `
)
prompt.close()
if (answer !== expected) {
  throw new Error("Database push cancelled.")
}

const push = spawnSync(supabaseBin, ["db", "push", "--linked"], {
  cwd: root,
  stdio: "inherit",
})
if (push.status !== 0) process.exit(push.status ?? 1)

const advisors = spawnSync(
  supabaseBin,
  ["db", "advisors", "--linked", "--type", "all", "--fail-on", "error"],
  { cwd: root, stdio: "inherit" }
)
if (advisors.status !== 0) process.exit(advisors.status ?? 1)
