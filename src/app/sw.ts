import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { CacheFirst, NetworkFirst, NetworkOnly, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope & typeof globalThis;

const VERSION = "v0.1.4";

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
    // Ignore pings and manifest to prevent IndexedDB bloat from unique URLs (?v=...)
    {
      matcher: ({ url }) => url.pathname === "/manifest.json" || url.searchParams.has("v"),
      handler: new NetworkOnly(),
    },
    // Cache audio files with CacheFirst (offline playback)
    {
      matcher: /\/audio\/.*\.mp3$/,
      handler: new CacheFirst({
        cacheName: "quran-audio-cache",
      }),
    },
    // Cache CSS/JS/fonts with CacheFirst
    {
      matcher: /\.(js|css|woff2?)$/,
      handler: new CacheFirst({
        cacheName: `static-assets-cache-${VERSION}`,
      }),
    },
    // Default caching strategies from Serwist
    ...defaultCache,
  ],
});

serwist.addEventListeners();
