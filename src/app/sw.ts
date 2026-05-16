import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { CacheFirst, NetworkFirst, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope & typeof globalThis;


const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST || [],
  skipWaiting: true,
  clientsClaim: true,
  // navigationPreload removed — it caused an extra network request on every
  // page navigation even when the shell is already precached.
  runtimeCaching: [
    {
      matcher: ({ request }) => request.mode === "navigate",
      handler: new NetworkFirst({
        cacheName: "pages-cache",
        networkTimeoutSeconds: 5,
      }),
    },
    {
      matcher: ({ url }) => url.pathname.includes("/audio/") && url.pathname.endsWith(".mp3"),
      handler: new CacheFirst({
        cacheName: "quran-audio-cache",
      }),
    },
    ...defaultCache,
  ],
});

serwist.addEventListeners();
