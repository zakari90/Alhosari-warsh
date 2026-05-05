import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist, CacheFirst } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope & typeof globalThis;

// Service Worker for Quran App — v0.4.0
// Enhanced for older devices (Huawei, etc.) with explicit navigation caching.

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: false,

  runtimeCaching: [
    // 1. Explicitly handle navigation (pages) to ensure offline fallback works on all browsers.
    {
      matcher: ({ request }) => request.mode === "navigate",
      handler: new CacheFirst({
        cacheName: "pages-cache",
      }),
    },
    // 2. Audio: serve from the user-downloaded cache only.
    {
      matcher: /\/audio\/.*\.mp3$/,
      handler: async ({ request }) => {
        const cache = await caches.open("quran-audio-cache");
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request);
      },
    },
  ],
  // 3. Global fallback for when everything else fails
  fallbacks: {
    entries: [
      {
        url: "/",
        matcher: ({ request }) => request.mode === "navigate",
      },
    ],
  },
});

serwist.addEventListeners();
