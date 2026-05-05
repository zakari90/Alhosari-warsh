import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope & typeof globalThis;

// Service Worker for Quran App — v0.3.0
// Strategy: precache app shell only; audio served from explicit user downloads.
// No automatic background caching of pages or audio.

const serwist = new Serwist({
  // Precache the full app shell (HTML, JS, CSS) injected by next build.
  // This ensures the app loads correctly even when fully offline.
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  // navigationPreload disabled — we're not using NetworkFirst for navigation,
  // so preload would be wasted bandwidth.
  navigationPreload: false,

  runtimeCaching: [
    // Audio: serve from the user-downloaded cache only.
    // If not cached, pass through to the network without saving.
    {
      matcher: /\/audio\/.*\.mp3$/,
      handler: async ({ request }) => {
        const cache = await caches.open("quran-audio-cache");
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }
        // Not downloaded — stream directly without caching
        return fetch(request);
      },
    },
    // All other requests (pages, assets) fall through to precache or network.
    // No automatic runtime caching is performed.
  ],
});

serwist.addEventListeners();
