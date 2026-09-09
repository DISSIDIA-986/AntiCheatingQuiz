---
name: Wrangler dependency compatibility
description: A package-resolution mismatch in the imported Cloudflare Workers toolchain.
---

The imported dependency ranges can resolve `@cloudflare/workers-types` to a major version outside Wrangler's declared optional peer range.

**Why:** A routine dependency install failed with `ERESOLVE`; accepting the installer's proposed resolution rewrote hundreds of lockfile lines and registry URLs, creating unrelated deployment risk. Those changes were reverted.

**How to apply:** Do not use `--force` or accept broad lockfile churn. If dependencies genuinely need updating, handle the toolchain upgrade as a focused change and validate installation outside Replit as well as locally.