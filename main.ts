#!/usr/bin/env node
// ai-excited-01 r5 — "Phoenix from the Lamp"
// Copies entry.png byte-for-byte to $MAKEFUN_OUTPUT_DIR/entry.png.
// Node 22, stdlib only, no network.
import { copyFileSync, existsSync, statSync, mkdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = join(__dirname, "entry.png");
const MAX_BYTES = 1024 * 1024;

function usage() {
  console.log("Usage: node main.ts [--help]");
  console.log("Copies entry.png to $MAKEFUN_OUTPUT_DIR/entry.png (default /output).");
  console.log("Validates entry.png exists and is <= 1 MiB.");
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    usage();
    process.exit(0);
  }
  if (!existsSync(SOURCE)) {
    console.error(`error: entry.png not found at ${SOURCE}`);
    process.exit(1);
  }
  const size = statSync(SOURCE).size;
  if (size === 0) {
    console.error("error: entry.png is empty");
    process.exit(1);
  }
  if (size > MAX_BYTES) {
    console.error(`error: entry.png is ${size} bytes, over the 1 MiB limit`);
    process.exit(1);
  }
  // Validate image magic bytes: PNG (89 50 4E 47) or JPEG (FF D8 FF).
  const head = readFileSync(SOURCE).subarray(0, 4);
  const isPng = head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47;
  const isJpeg = head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
  if (!isPng && !isJpeg) {
    console.error("error: entry.png is not a valid PNG or JPEG image");
    process.exit(1);
  }
  const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
  mkdirSync(outDir, { recursive: true });
  const dest = join(outDir, "entry.png");
  copyFileSync(SOURCE, dest);
  console.log(`copied entry.png (${size} bytes) -> ${dest}`);
}

main();
