import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { CacheFirst, NetworkFirst, Serwist, StaleWhileRevalidate } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope & typeof globalThis;

// Service Worker for Quran App

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
        networkTimeoutSeconds: 3, 
      }),
    },
    // Serve audio from cache if present, otherwise fetch but don't save
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
    // Precaching handles the rest of the application shell (JS, CSS, etc.)
  ],
});

serwist.addEventListeners();

// Service Worker activated
