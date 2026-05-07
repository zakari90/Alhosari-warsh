import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { CacheFirst, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope & typeof globalThis;

const VERSION = "v0.1.5";

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  // navigationPreload removed — it caused an extra network request on every
  // page navigation even when the shell is already precached.
  runtimeCaching: [
    // Audio files: served from cache if available, otherwise fetched on demand.
    // Nothing is downloaded proactively — only files the user explicitly
    // requests will be stored here.
    {
      matcher: /\/audio\/.*\.mp3$/,
      handler: new CacheFirst({
        cacheName: "quran-audio-cache", // Persistent — survives SW version bumps
      }),
    },
    // Static assets (JS, CSS, fonts): cache-first after first load.
    {
      matcher: /\.(js|css|woff2?)$/,
      handler: new CacheFirst({
        cacheName: `static-assets-cache-${VERSION}`,
      }),
    },
    // NOTE: defaultCache from @serwist/next is intentionally NOT included.
    // It adds NetworkFirst for pages/navigation which causes the SW to fetch
    // the page from the server on every reload, creating unwanted downloads.
  ],
});

serwist.addEventListeners();
