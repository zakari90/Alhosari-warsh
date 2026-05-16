# Service Worker Caching Comparison

This document summarizes the differences between the working version and the current version of the Quran App's Service Worker (`sw.ts`) and caching strategy.

## Key Differences

### 1. Missing `defaultCache` (Primary Issue)
- **Working Version:** Includes `...defaultCache` from `@serwist/next/worker`. This provides out-of-the-box caching for:
    - Static chunks and scripts.
    - Images, fonts, and icons.
    - Next.js internal data (RSC payloads, metadata).
    - API responses and manifests.
- **Current Version:** Removes `defaultCache` entirely. This means most of the application shell and Next.js internal requests are not being cached unless they happen to match a custom rule.

### 2. Manual Page/RSC Handling
- **Current Version:** Uses a custom `handler` for page navigation and RSC (`_rsc` params).
- **Strategy:** It uses a **Network First** approach.
- **Problem:** When online, it always hits the network. This makes it appear as if caching "isn't working" because files are served from the cache only when the network fails. The working version's `defaultCache` uses optimized strategies (like `StaleWhileRevalidate`) that make the app feel faster while online.

### 3. Narrow Static Asset Matching
- **Current Version:** The matcher `/\.(js|css|woff2?)$/` is too restrictive.
- **Missing:** It excludes `.json`, `.png`, `.ico`, `.svg`, and other assets that the working version handles automatically via `defaultCache`.

### 4. Cache Versioning
- **Current Version:** Uses a hardcoded `VERSION = "v0.1.9"` in cache names (e.g., `pages-cache-${VERSION}`).
- **Problem:** If the version is changed or managed inconsistently between the SW and the app, it leads to cache misses or redundant storage. The working version relies on Serwist's default management which is more seamless.

### 5. Audio Matching Strategy
- **Working Version:** Uses a direct regex: `urlPattern: /\/audio\/.*\.mp3$/`.
- **Current Version:** Uses a functional `matcher` with `console.log`. While functionally similar, the working version's approach is simpler and less prone to execution overhead.

---

## Recommended Fix

To resolve the caching issues in the current project, it is recommended to restore the `defaultCache` while keeping the persistent audio cache logic from your "Offline Plan."

### Proposed `sw.ts` Structure:

```typescript
import { defaultCache } from "@serwist/next/worker";
import { CacheFirst, Serwist } from "serwist";
// ... types and declarations

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  runtimeCaching: [
    // 1. Your Persistent Audio Cache (Keep this)
    {
      urlPattern: /\/audio\/.*\.mp3$/,
      handler: new CacheFirst({
        cacheName: "quran-audio-cache",
      }),
    },
    // 2. Restore Standard Next.js Caching
    ...defaultCache,
  ],
});

serwist.addEventListeners();
```
