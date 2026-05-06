import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist, CacheFirst } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope & typeof globalThis;

// Service Worker for Quran App — v0.4.1 (Reverted to Automatic Caching Logic)

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    ...defaultCache,
    // Audio: Automatically cache on playback (Old Logic)
    {
      matcher: /\/audio\/.*\.mp3$/,
      handler: new CacheFirst({
        cacheName: "quran-audio-cache",
      }),
    },
  ],
  // Keep the navigation fallback for reliability
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
