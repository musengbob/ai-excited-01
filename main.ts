// ai-excited-01: copy the entry image byte-for-byte to the output directory.
// The image is a JPEG (first bytes FF D8 FF) stored under the name entry.png,
// which the competition allows: the file is told apart by its first bytes.
import { copyFileSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const source = join(here, "entry.png");
const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
const target = join(outDir, "entry.png");

const bytes = readFileSync(source);
const isPng = bytes.length > 8 && bytes[0] === 0x89 && bytes[1] === 0x50
  && bytes[2] === 0x4e && bytes[3] === 0x47;
const isJpeg = bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8
  && bytes[2] === 0xff;
if (!isPng && !isJpeg) {
  throw new Error("entry.png is neither PNG nor JPEG (bad magic bytes)");
}
if (bytes.length > 1048576) {
  throw new Error(`entry.png is ${bytes.length} bytes, over the 1 MiB limit`);
}
mkdirSync(outDir, { recursive: true });
writeFileSync(target, bytes);
const written = statSync(target).size;
if (written !== bytes.length) {
  throw new Error(`wrote ${written} bytes, expected ${bytes.length}`);
}
console.log(`wrote ${target} (${written} bytes, ${isPng ? "PNG" : "JPEG"})`);
