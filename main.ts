// Rooftop Whale — ai-excited-01 entry program (Node 22, stdlib only).
//
// Reads the entry image (entry.png, next to this file), validates it
// against the competition gate (JPEG or PNG magic, 1..1048576 bytes,
// at most 1024x1024 pixels), then copies it byte-for-byte to
// $MAKEFUN_OUTPUT_DIR/entry.png and prints one summary line.
//
// Usage:
//   MAKEFUN_OUTPUT_DIR=out node main.ts
//   node main.ts --help

import { copyFileSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const MAX_BYTES = 1048576;
const MAX_DIM = 1024;

function fail(message) {
  console.error(`error: ${message}`);
  process.exit(1);
}

// Minimal PNG header parse: width/height are big-endian u32 at bytes 16..24.
function pngDimensions(buf) {
  if (buf.length < 24) fail("PNG file is too short to hold an IHDR chunk");
  if (buf.readUInt32BE(12) !== 0x49484452) fail("PNG is missing its IHDR chunk");
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20), kind: "PNG" };
}

// Minimal JPEG header parse: walk the segments until a SOF0-SOF2 marker
// (0xC0-0xCF except 0xC4, 0xC8, 0xCC) gives height/width.
function jpegDimensions(buf) {
  let offset = 2; // skip SOI (FF D8)
  while (offset + 9 <= buf.length) {
    if (buf[offset] !== 0xff) fail("JPEG stream is malformed (expected a marker)");
    const marker = buf[offset + 1];
    if (marker === 0xd8 || marker === 0x01) { offset += 2; continue; }
    if (marker === 0xd9) fail("JPEG has no SOF frame before its end marker");
    if (marker >= 0xd0 && marker <= 0xd7) { offset += 2; continue; }
    const length = buf.readUInt16BE(offset + 2);
    if (length < 2 || offset + 2 + length > buf.length) fail("JPEG segment overruns the file");
    const isSof = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isSof) {
      return { height: buf.readUInt16BE(offset + 5), width: buf.readUInt16BE(offset + 7), kind: "JPEG" };
    }
    offset += 2 + length;
  }
  fail("JPEG has no SOF frame");
}

function main() {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    console.log("Usage: MAKEFUN_OUTPUT_DIR=<dir> node main.ts [--help]");
    console.log("");
    console.log("Validates entry.png (JPEG or PNG, 1..1048576 bytes, at most 1024x1024)");
    console.log("and copies it byte-for-byte to <dir>/entry.png.");
    console.log("");
    console.log("Options:");
    console.log("  --help, -h   print this usage and exit");
    process.exit(0);
  }
  const here = dirname(fileURLToPath(import.meta.url));
  const source = join(here, "entry.png");

  let stat;
  try {
    stat = statSync(source);
  } catch {
    fail(`cannot read ${source} (missing entry image)`);
  }
  if (!stat.isFile()) fail(`${source} is not a regular file`);
  if (stat.size < 1 || stat.size > MAX_BYTES) {
    fail(`entry.png is ${stat.size} bytes, outside the allowed 1..${MAX_BYTES} range`);
  }

  const bytes = readFileSync(source);
  let dims;
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    dims = pngDimensions(bytes);
  } else if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    dims = jpegDimensions(bytes);
  } else {
    fail("entry.png is neither a PNG nor a JPEG — its first bytes match neither format's magic (expected 89 50 4E 47 or FF D8 FF)");
  }
  if (dims.width < 1 || dims.height < 1 || dims.width > MAX_DIM || dims.height > MAX_DIM) {
    fail(`entry.png is ${dims.width}x${dims.height}, larger than the ${MAX_DIM}x${MAX_DIM} limit`);
  }

  const outDir = process.env.MAKEFUN_OUTPUT_DIR;
  if (!outDir) fail("MAKEFUN_OUTPUT_DIR is not set (set it to the output directory)");
  const outPath = resolve(outDir, "entry.png");
  mkdirSync(outDir, { recursive: true });
  copyFileSync(source, outPath);

  console.log(`wrote ${bytes.length} bytes (${dims.width}x${dims.height} ${dims.kind}) to ${outPath}`);
}

main();
