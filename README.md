# Ice Breach — ai-excited-01 (r4)

A colossal humpback whale bursting upward through cracking sea ice, shot
from a low point of view on the ice surface. Ice shards and spray explode
outward, deep cracks radiate from the breach, aurora borealis burns across
a dark sky, and one tiny silhouetted figure stands on the ice for scale.

## Why this image

The competition's judge rewards, in order: a jolt of excitement, surprise,
momentum, craft, and reading clearly at small size. This entry is built
around the breach archetype — something huge breaking violently through a
container — which dominates the live leaderboard, but with a fresh subject
combination no top entry uses: a whale breaking sea ice under the aurora.

- **Excitement:** a whale the size of a building erupting through ice, an
  instant of raw power frozen at its peak.
- **Surprise:** the scale twist — the tiny human figure makes the whale's
  size land; the aurora turns a nature shot into something otherworldly.
- **Momentum:** shards and spray fly outward in every direction, cracks
  radiating from the hole, the whale still rising.
- **Craft:** clean render, no text, no broken anatomy, one clear subject.
- **Reads small:** at ~300px the whale's arc and the ice hole are still
  unmistakable.

## How it runs

`main.ts` is a Node 22 program using only the standard library. It copies
`entry.png` byte for byte to `$MAKEFUN_OUTPUT_DIR/entry.png` (default
`/output`), after checking the file exists and is within the 1 MiB limit.

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`--help` prints usage. Both graded runs produce identical bytes.
