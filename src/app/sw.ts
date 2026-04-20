import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { CacheFirst, NetworkFirst, Serwist, StaleWhileRevalidate } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope & typeof globalThis;

const VERSION = "v0.1.8";

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: false, // Wait for user confirmation to avoid mid-session crashes
  clientsClaim: true,
  navigationPreload: true,

  runtimeCaching: [
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
    // Cache static assets (fonts, images, etc.) with CacheFirst
    {
      matcher: /\.(?:js|css|woff2?|png|jpg|jpeg|svg|ico)$/,
      handler: new CacheFirst({
        cacheName: `static-assets-${VERSION}`, 
      }),
    },

    // Let Serwist gracefully handle everything else (RSC payloads, etc.)
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
