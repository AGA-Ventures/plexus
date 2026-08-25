#!/usr/bin/env node

import sharp from "sharp";
import { fileURLToPath } from "node:url";

const [source, destination, patchColor = "#071326", mode = "desktop"] = process.argv.slice(2);

if (!source || !destination) {
  console.error("usage: apply-plexus-logo.mjs <source> <destination> [patch-color]");
  process.exit(1);
}

const logoPath = fileURLToPath(new URL("../../public/plexus-wordmark-transparent-trimmed.png", import.meta.url));
const mobile = mode === "mobile";
const width = mobile ? 1024 : 1536;
const height = mobile ? 1536 : 1024;
const logo = await sharp(logoPath)
  .resize({ width: mobile ? 220 : 198 })
  .png()
  .toBuffer();
const patch = await sharp({
  create: {
    width: mobile ? 334 : 286,
    height: mobile ? 112 : 92,
    channels: 4,
    background: patchColor,
  },
}).png().toBuffer();

await sharp(source)
  .resize(width, height, { fit: "cover" })
  .composite([
    { input: patch, left: 0, top: 0 },
    { input: logo, left: 34, top: mobile ? 37 : 30 },
  ])
  .webp({ quality: 88 })
  .toFile(destination);

console.log(`LOGO APPLIED: ${destination}`);
