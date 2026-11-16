// ai-excited-01 — Rooftop Whale
// Copies the entry image (entry.png, a JPEG in this build) byte-for-byte
// to $MAKEFUN_OUTPUT_DIR/entry.png, after validating it against the
// competition gate: 1..1048576 bytes, at most 1024x1024 pixels,
// PNG or JPEG by its first bytes.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, "entry.png");

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("usage: MAKEFUN_OUTPUT_DIR=<dir> node main.ts");
  console.log("Copies entry.png (the Rooftop Whale image) byte-for-byte to");
  console.log("<dir>/entry.png after validating it: PNG or JPEG,");
  console.log("1..1048576 bytes, at most 1024x1024 pixels.");
  process.exit(0);
}

const outDir = process.env.MAKEFUN_OUTPUT_DIR;
if (!outDir) {
  console.error("error: MAKEFUN_OUTPUT_DIR is not set");
  process.exit(1);
}

let data;
try {
  data = readFileSync(src);
} catch {
  console.error("error: cannot read entry.png in the same directory as main.ts — the entry image is missing");
  process.exit(1);
}

if (data.length < 1 || data.length > 1048576) {
  console.error(`error: entry.png is ${data.length} bytes, must be 1..1048576`);
  process.exit(1);
}

const isPng =
  data.length >= 8 &&
  data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4e && data[3] === 0x47;
const isJpeg = data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;
if (!isPng && !isJpeg) {
  console.error("error: entry.png is neither PNG nor JPEG by its first bytes");
  process.exit(1);
}

function pngSize(buf) {
  if (buf.length < 24 || buf.toString("ascii", 12, 16) !== "IHDR") return null;
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

function jpegSize(buf) {
  let i = 2;
  while (i + 9 < buf.length) {
    if (buf[i] !== 0xff) return null;
    const marker = buf[i + 1];
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      i += 2;
      continue;
    }
    if (marker === 0xda) return null; // start of scan: no SOF found
    const len = buf.readUInt16BE(i + 2);
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { w: buf.readUInt16BE(i + 7), h: buf.readUInt16BE(i + 5) };
    }
    i += 2 + len;
  }
  return null;
}

const size = isPng ? pngSize(data) : jpegSize(data);
if (!size) {
  console.error("error: could not parse image dimensions from entry.png");
  process.exit(1);
}
if (size.w > 1024 || size.h > 1024) {
  console.error(`error: entry.png is ${size.w}x${size.h}, must be at most 1024x1024`);
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });
const out = join(outDir, "entry.png");
writeFileSync(out, data);
console.log(`wrote ${data.length} bytes (${size.w}x${size.h} ${isPng ? "PNG" : "JPEG"}) to ${out}`);
