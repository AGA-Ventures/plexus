import { createServer } from "node:http"
import { readFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"

const host = "127.0.0.1"
const port = Number.parseInt(
  process.env.PLEXUS_EMAIL_PREVIEW_PORT ?? "4174",
  10
)
const templateUrl = new URL(
  "../supabase/templates/recovery.html",
  import.meta.url
)

function renderPreview(template) {
  const previewLink =
    "http://localhost:3000/en/reset-password?tenant=plexus-managed"

  return template
    .replaceAll("{{ .Email }}", "admin@plexus.example")
    .replaceAll("{{ .ConfirmationURL }}", previewLink)
}

const server = createServer(async (request, response) => {
  if (request.url === "/health") {
    response.writeHead(200, { "content-type": "text/plain; charset=utf-8" })
    response.end("ok")
    return
  }

  if (request.url !== "/" && request.url !== "/index.html") {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" })
    response.end("Not found")
    return
  }

  try {
    const template = await readFile(fileURLToPath(templateUrl), "utf8")
    response.writeHead(200, {
      "cache-control": "no-store",
      "content-type": "text/html; charset=utf-8",
    })
    response.end(renderPreview(template))
  } catch (error) {
    response.writeHead(500, { "content-type": "text/plain; charset=utf-8" })
    response.end(error instanceof Error ? error.message : "Preview failed")
  }
})

server.listen(port, host, () => {
  console.log(`Plexus recovery email preview: http://${host}:${port}`)
})
