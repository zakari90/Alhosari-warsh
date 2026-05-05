import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { CacheFirst, NetworkFirst, Serwist, StaleWhileRevalidate } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope & typeof globalThis;

const VERSION = "v0.2.0";

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,

  runtimeCaching: [
    {
      matcher: ({ request }) => request.mode === "navigate",
      handler: new NetworkFirst({
        cacheName: "pages",
        networkTimeoutSeconds: 3, // Fallback to cache after 3s to prevent hanging on slow mobile networks
      }),
    },
    // Cache audio files with CacheFirst (offline playback)
    {
      matcher: /\/audio\/.*\.mp3$/,
      handler: new CacheFirst({
        cacheName: "quran-audio-cache",
      }),
    },
    // Instant manifest load with background update
    {
      matcher: /\/manifest\.json(\?.*)?$/,
      handler: new StaleWhileRevalidate({
        cacheName: "manifest-cache",
      }),
    },

    // Let Serwist gracefully handle everything else (Next.js assets, RSC, etc.)
    ...defaultCache,
  ],
});

serwist.addEventListeners();

// Manual cleanup for non-standard/legacy caches created in previous fixes
self.addEventListener("activate", (event) => {
  console.log("Service Worker activating version:", VERSION);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            // Delete old static-assets versions that are not the current one
            return cacheName.startsWith("static-assets-") && cacheName !== `static-assets-${VERSION}`;
          })
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
});
