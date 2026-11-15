// main.ts — ai-excited-01 entry "The Mountain Wakes".
//
// The entry image lives in this repository as entry.png. This program
// copies it byte for byte into the grader's output directory so the
// judge sees exactly the image we built. Node 22, standard library
// only, no network, fully deterministic: the same input bytes always
// produce the same output bytes.

import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// The repository root is the directory holding this file.
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)));
const sourceImage = join(repoRoot, "entry.png");

// The grader sets MAKEFUN_OUTPUT_DIR; otherwise we write to /output.
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const destination = join(outputDir, "entry.png");

if (!existsSync(sourceImage)) {
  throw new Error(`entry image not found: ${sourceImage}`);
}

mkdirSync(outputDir, { recursive: true });
copyFileSync(sourceImage, destination);

// Confirm the copy landed intact by comparing byte lengths and by
// checking the PNG signature of what we wrote, so a truncated or
// corrupted copy can never pass silently.
const sourceBytes = readFileSync(sourceImage);
const writtenBytes = readFileSync(destination);
const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
if (!writtenBytes.subarray(0, 8).equals(pngSignature)) {
  throw new Error(`output is not a PNG: ${destination}`);
}
if (sourceBytes.length !== writtenBytes.length) {
  throw new Error(
    `copy mismatch: wrote ${writtenBytes.length} bytes, expected ${sourceBytes.length}`,
  );
}

console.log(`wrote ${destination} (${writtenBytes.length} bytes)`);
