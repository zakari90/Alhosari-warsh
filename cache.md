# Caching Strategy & Offline Support

This document outlines the current caching strategy implemented in the Quran App to ensure reliable offline support and performance.

## 1. Service Worker Configuration (`sw.ts`)

The Service Worker uses **Serwist** to manage caching. It implements the following strategies:

### A. Navigation Requests (The App Shell)
- **Strategy:** `NetworkFirst`
- **Cache Name:** `pages-cache`
- **Fallback:** If the network is unavailable, it serves the cached version of the requested page (primarily the homepage `/`).
- **Timeout:** 5 seconds before falling back to cache.

### B. Audio Files (`/audio/*.mp3`)
- **Strategy:** `CacheFirst`
- **Cache Name:** `quran-audio-cache`
- **Persistent:** This cache is NOT versioned with the app version to ensure that downloaded audio files (Ahzab) survive application updates.

### C. Static Assets & Next.js Internals
- **Strategy:** `defaultCache` (from `@serwist/next/worker`)
- **Coverage:** Automatically handles Next.js chunks, CSS, JS, images, and RSC payloads using optimized strategies (mostly `StaleWhileRevalidate`).

---

## 2. PWA Configuration (`next.config.ts`)

To ensure the homepage is always available offline, we use explicit precaching:
- **Precache Entry:** `{ url: "/", revision: "v0.1.9" }`
- **Rationale:** Providing an explicit revision ensures that the Service Worker correctly identifies, caches, and updates the root document, which is critical for mobile browsers.

---

## 3. Mobile-Specific Enhancements

Mobile browsers (Chrome Android, Safari iOS) can be more restrictive with Service Workers. We've implemented:
1. **Explicit Revisions:** Prevents the browser from serving a stale `/` or failing to cache it.
2. **UI Error Reporting:** `SerwistInit.tsx` now displays registration errors directly in a red banner at the top of the UI for easier debugging without a console.
3. **Connectivity Verification:** `useConnectivity.ts` and `DownloadManager.tsx` verify actual reachability of the audio server, not just the device's "Online" status.

---

## 4. Troubleshooting

- **Buttons stay white even after download:** 
  - Check if the Service Worker is registered (Look for the "🚀 Serwist Service Worker registered successfully" log).
  - Verify that the audio files are actually in the `quran-audio-cache` using DevTools -> Application -> Cache Storage.
- **App doesn't load offline:**
  - Check for "SW Error" banner at the top.
  - Ensure the site is served over HTTPS (required for Service Workers).
  - On mobile, try "Add to Home Screen" to see if the PWA behavior improves.
