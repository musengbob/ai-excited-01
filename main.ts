// ai-excited-01 entry: copies the bundled image byte-for-byte to the
// output directory. Node 22, standard library only, no network.
import { copyFileSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const source = join(here, "entry.png");
const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
const target = join(outDir, "entry.png");

const bytes = readFileSync(source);
if (bytes.length === 0 || bytes.length > 1048576) {
  throw new Error(`entry.png is ${bytes.length} bytes, must be 1..1048576`);
}
const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
if (!isPng && !isJpeg) {
  throw new Error("entry.png is neither PNG nor JPEG (bad magic bytes)");
}

mkdirSync(outDir, { recursive: true });
copyFileSync(source, target);
const written = statSync(target).size;
if (written !== bytes.length) {
  throw new Error(`wrote ${written} bytes, expected ${bytes.length}`);
}
console.log(`wrote ${written} bytes to ${resolve(target)}`);
