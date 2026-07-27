import { execFileSync, spawnSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import process from "node:process"
import readline from "node:readline/promises"

const root = process.cwd()
const mode = process.argv[2]
if (!["preview", "production"].includes(mode)) {
  throw new Error("Use preview or production.")
}

const targets = JSON.parse(
  fs.readFileSync(path.join(root, ".deployment-targets.json"), "utf8")
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
  [path.join(root, "scripts", "verify-deployment-targets.mjs")],
  { cwd: root, stdio: "inherit" }
)
if (targetCheck.status !== 0) process.exit(targetCheck.status ?? 1)

const status = run("git", ["status", "--porcelain"])
if (status) {
  throw new Error("Commit or stash every change before deployment.")
}

const branch = run("git", ["branch", "--show-current"])
if (mode === "production" && branch !== targets.vercel.productionBranch) {
  throw new Error("Production deploys are allowed from main only.")
}

const localSha = run("git", ["rev-parse", "HEAD"])
const remoteLine = run("git", [
  "ls-remote",
  "--heads",
  targets.github.remote,
  `refs/heads/${branch}`,
])
const remoteSha = remoteLine.split(/\s+/, 1)[0]
if (!remoteSha || remoteSha !== localSha) {
  throw new Error("Push this exact commit to the approved GitHub repo first.")
}

execFileSync("npm", ["run", "verify:release"], {
  cwd: root,
  stdio: "inherit",
})

if (!process.stdin.isTTY) {
  throw new Error("Deployment confirmation requires an interactive terminal.")
}

const expected = `DEPLOY ${targets.vercel.projectName} ${mode}`
const prompt = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})
const answer = await prompt.question(
  `Type "${expected}" to deploy commit ${localSha.slice(0, 12)}: `
)
prompt.close()
if (answer !== expected) {
  throw new Error("Deployment cancelled.")
}

const args = ["deploy"]
if (mode === "production") args.push("--prod")

const result = spawnSync("vercel", args, {
  cwd: root,
  stdio: "inherit",
})
if (result.status !== 0) process.exit(result.status ?? 1)
