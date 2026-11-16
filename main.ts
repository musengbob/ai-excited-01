// ai-excited-01 entry: validates and copies the bundled image byte-for-byte
// to the output directory. Node 22, standard library only, no network.
//
// Usage:  MAKEFUN_OUTPUT_DIR=<dir> node main.ts [--help]
// Output: a single entry.png in the output directory, identical to the
// bundled entry.png. Exits non-zero with a clear message on any failure.
import { copyFileSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const MAX_BYTES = 1048576;
const MAX_DIM = 1024;

const here = dirname(fileURLToPath(import.meta.url));
const source = join(here, "entry.png");
const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
const target = join(outDir, "entry.png");

if (process.argv.slice(2).includes("--help")) {
  console.log(
    "Usage: MAKEFUN_OUTPUT_DIR=<dir> node main.ts [--help]\n" +
      "Validates the bundled entry.png (JPEG/PNG, 1..1048576 bytes, at most " +
      "1024x1024) and copies it byte-for-byte to <dir>/entry.png.",
  );
  process.exit(0);
}

function fail(message: string): never {
  console.error(`error: ${message}`);
  process.exit(1);
}

function isPng(bytes: Buffer): boolean {
  return (
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e &&
    bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a &&
    bytes[6] === 0x1a && bytes[7] === 0x0a
  );
}

function isJpeg(bytes: Buffer): boolean {
  return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

// Minimal dimension parse: PNG IHDR (width/height at bytes 16..24) or JPEG
// SOF0/SOF2 marker scan (height/width in the frame header).
function parseDimensions(bytes: Buffer): { kind: string; width: number; height: number } {
  if (isPng(bytes)) {
    if (bytes.length < 24 || bytes.readUInt32BE(12) !== 0x49484452) {
      fail("entry.png has a truncated or corrupt PNG header (no IHDR)");
    }
    return {
      kind: "PNG",
      width: bytes.readUInt32BE(16),
      height: bytes.readUInt32BE(20),
    };
  }
  if (isJpeg(bytes)) {
    let i = 2;
    while (i + 9 < bytes.length) {
      if (bytes[i] !== 0xff) {
        fail("entry.png has a corrupt JPEG marker stream");
      }
      const marker = bytes[i + 1];
      if (marker === 0xd9 || marker === 0xda) break; // EOI / SOS: no SOF found
      const len = bytes.readUInt16BE(i + 2);
      if (len < 2 || i + 2 + len > bytes.length) {
        fail("entry.png has a corrupt JPEG segment length");
      }
      if (marker === 0xc0 || marker === 0xc2) {
        // SOF0/SOF2: [precision:1][height:2][width:2]
        return {
          kind: "JPEG",
          height: bytes.readUInt16BE(i + 5),
          width: bytes.readUInt16BE(i + 7),
        };
      }
      i += 2 + len;
    }
    fail("entry.png is a JPEG but has no SOF0/SOF2 frame header");
  }
  fail("entry.png is neither PNG nor JPEG (bad magic bytes)");
}

const bytes = readFileSync(source);
if (bytes.length < 1 || bytes.length > MAX_BYTES) {
  fail(`entry.png is ${bytes.length} bytes, must be 1..${MAX_BYTES}`);
}
const info = parseDimensions(bytes);
if (info.width < 1 || info.height < 1) {
  fail(`entry.png has invalid dimensions ${info.width}x${info.height}`);
}
if (info.width > MAX_DIM || info.height > MAX_DIM) {
  fail(
    `entry.png is ${info.width}x${info.height}, larger than the ${MAX_DIM}x${MAX_DIM} limit`,
  );
}

mkdirSync(outDir, { recursive: true });
copyFileSync(source, target);
const written = statSync(target).size;
if (written !== bytes.length) {
  fail(
    `copy incomplete: wrote ${written} of ${bytes.length} bytes to ${resolve(target)} — ` +
      "delete the partial file and re-run",
  );
}
console.log(
  `wrote ${written} bytes (${info.width}x${info.height} ${info.kind}) to ${resolve(target)}`,
);
