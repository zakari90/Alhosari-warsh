import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { CacheFirst, NetworkFirst, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope & typeof globalThis;

// VERSION = "v0.1.4"

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  fallbacks: {
    entries: [
      {
        url: "/", // Fallback to the precached root page if offline navigation fails
        matcher({ request }) {
          return request.mode === "navigate";
        },
      },
    ],
  },
  runtimeCaching: [
    // Cache audio files with CacheFirst (offline playback)
    // Must remain separate from defaultCache so it's not flushed across versions
    {
      matcher: /\/audio\/.*\.mp3$/,
      handler: new CacheFirst({
        cacheName: "quran-audio-cache",
      }),
    },
    // Ping check expects the raw manifest. Use NetworkFirst resiliently and allow the ?v=... param
    {
      matcher: /\/manifest\.json(\?.*)?$/,
      handler: new NetworkFirst({
        cacheName: "manifest-cache",
      }),
    },
    // Let Serwist gracefully handle Next.js static chunks, CSS, Google Fonts, RSC, etc.
    // The previous generic \.(js|css) matcher was causing hydration failures
    ...defaultCache,
  ],
});

serwist.addEventListeners();
