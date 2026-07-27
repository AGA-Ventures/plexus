import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import process from "node:process"

const root = process.cwd()
const targets = JSON.parse(
  fs.readFileSync(path.join(root, ".deployment-targets.json"), "utf8")
)
const approvedUrls = [
  ...targets.github.pushUrls,
  ...targets.github.migrationAliases,
]

function git(args, { allowFailure = false } = {}) {
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

function normalize(value) {
  return value
    .trim()
    .replace(/\/$/, "")
    .replace(/\.git$/, "")
}

function remoteNames() {
  return git(["remote"]).split(/\r?\n/).filter(Boolean)
}

function remoteUrl(remote) {
  return git(["remote", "get-url", remote], { allowFailure: true })
}

let remotes = remoteNames()
let targetRemote = remotes.find((remote) =>
  approvedUrls.map(normalize).includes(normalize(remoteUrl(remote)))
)

if (remotes.includes("origin") && targetRemote !== "origin") {
  let archiveName = "archive-cstan"
  let suffix = 2
  while (remotes.includes(archiveName)) {
    archiveName = `archive-cstan-${suffix}`
    suffix += 1
  }
  git(["remote", "rename", "origin", archiveName])
  remotes = remoteNames()
}

targetRemote = remotes.find((remote) =>
  approvedUrls.map(normalize).includes(normalize(remoteUrl(remote)))
)

if (targetRemote && targetRemote !== targets.github.remote) {
  git(["remote", "rename", targetRemote, targets.github.remote])
} else if (!targetRemote) {
  git(["remote", "add", targets.github.remote, targets.github.pushUrls[0]])
}

git(["remote", "set-url", targets.github.remote, targets.github.pushUrls[0]])
git(["config", "remote.pushDefault", targets.github.remote])
git(["config", "core.hooksPath", ".githooks"])

for (const branch of git([
  "for-each-ref",
  "--format=%(refname:short)",
  "refs/heads",
])
  .split(/\r?\n/)
  .filter(Boolean)) {
  git(["config", `branch.${branch}.pushRemote`, targets.github.remote])
}

for (const remote of remoteNames()) {
  if (remote === targets.github.remote) continue
  git(["config", "--unset-all", `remote.${remote}.pushurl`], {
    allowFailure: true,
  })
  git(["config", "--add", `remote.${remote}.pushurl`, "DISABLED"])
}

console.log(`Configured push target: ${targets.github.repository}`)
console.log("Configured tracked pre-push guard: .githooks/pre-push")

execFileSync(
  process.execPath,
  [path.join(root, "scripts", "verify-deployment-targets.mjs")],
  { cwd: root, stdio: "inherit" }
)
