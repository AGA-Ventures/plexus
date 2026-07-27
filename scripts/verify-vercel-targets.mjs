import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import process from "node:process"

const root = process.cwd()
const targets = JSON.parse(
  fs.readFileSync(path.join(root, ".deployment-targets.json"), "utf8")
)
const failures = []

function vercelApi(endpoint) {
  return JSON.parse(
    execFileSync("vercel", ["api", endpoint, "--raw"], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 20000,
    })
  )
}

const localProjectPath = path.join(root, ".vercel", "project.json")
if (!fs.existsSync(localProjectPath)) {
  failures.push("Run vercel link and select the approved plexus project.")
} else {
  const localProject = JSON.parse(fs.readFileSync(localProjectPath, "utf8"))
  if (
    localProject.projectId !== targets.vercel.projectId ||
    localProject.orgId !== targets.vercel.orgId
  ) {
    failures.push("The local Vercel link points to the wrong project.")
  }
}

try {
  const project = vercelApi(`/v9/projects/${targets.vercel.projectId}`)
  const expectedRepository = targets.github.repository.toLowerCase()
  const linkedRepository = project.link
    ? `${project.link.org}/${project.link.repo}`.toLowerCase()
    : ""

  if (!project.link) {
    failures.push(
      "Vercel Git is disconnected. Grant the Vercel GitHub app access to AGA-Ventures/plexus, then reconnect it."
    )
  } else if (linkedRepository !== expectedRepository) {
    failures.push(
      `Vercel Git points to ${linkedRepository}, not ${expectedRepository}.`
    )
  }

  if (
    project.link &&
    project.link.productionBranch !== targets.vercel.productionBranch
  ) {
    failures.push("Vercel production branch is not main.")
  }

  const environment = vercelApi(
    `/v10/projects/${targets.vercel.projectId}/env`
  ).envs
  const byKey = new Map(environment.map((entry) => [entry.key, entry]))

  for (const key of [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  ]) {
    const entry = byKey.get(key)
    if (!entry) {
      failures.push(`Vercel is missing ${key}.`)
      continue
    }
    for (const environmentName of ["production", "preview"]) {
      if (!entry.target.includes(environmentName)) {
        failures.push(`${key} is missing from Vercel ${environmentName}.`)
      }
    }
  }

  const secret = byKey.get("SUPABASE_SECRET_KEY")
  if (!secret?.target.includes("production")) {
    failures.push("SUPABASE_SECRET_KEY is missing from Vercel production.")
  }
  if (secret?.target.some((target) => target !== "production")) {
    failures.push("SUPABASE_SECRET_KEY must remain production-only in Vercel.")
  }
} catch (error) {
  failures.push(`Unable to inspect Vercel: ${error.message.split("\n")[0]}`)
}

for (const failure of failures) console.error(`✗ ${failure}`)
if (failures.length > 0) {
  process.exitCode = 1
} else {
  console.log(
    "✓ Vercel project, Git repository, branch, and env scopes are safe."
  )
}
