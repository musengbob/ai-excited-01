// ai-excited-01 entry: copies the entry image to the output directory.
//
// The program is deliberately tiny: it locates entry.png next to this file,
// validates it, creates the output directory, and copies the image byte for
// byte so both graded runs produce identical output.
//
// Usage: node main.ts [--help]
// Environment: MAKEFUN_OUTPUT_DIR (default /output)
import { copyFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const MAX_BYTES = 1048576; // 1 MiB competition limit

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('Usage: node main.ts [--help]');
  console.log('Copies entry.png (max 1 MiB) to $MAKEFUN_OUTPUT_DIR/entry.png (default /output).');
  process.exit(0);
}

const scriptDir = dirname(fileURLToPath(import.meta.url));
const sourceImage = join(scriptDir, 'entry.png');
const outputDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';

if (!existsSync(sourceImage)) {
  console.error(`error: source image not found: ${sourceImage}`);
  process.exit(1);
}
const size = statSync(sourceImage).size;
if (size > MAX_BYTES) {
  console.error(`error: entry.png is ${size} bytes, over the ${MAX_BYTES}-byte limit`);
  process.exit(1);
}

mkdirSync(outputDir, { recursive: true });
const destination = join(outputDir, 'entry.png');
copyFileSync(sourceImage, destination);
console.log(`wrote ${destination} (${size} bytes)`);
