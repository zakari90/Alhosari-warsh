import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { CacheFirst, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope & typeof globalThis;

const VERSION = "v0.1.8";

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST || [],
  skipWaiting: true,
  clientsClaim: true,
  // navigationPreload removed — it caused an extra network request on every
  // page navigation even when the shell is already precached.
  runtimeCaching: [
    // Audio files: served from cache if available, otherwise fetched on demand.
    // Nothing is downloaded proactively — only files the user explicitly
    // requests will be stored here.
    {
      matcher: ({ url }) => {
        const isAudio = url.pathname.includes("/audio/") && url.pathname.endsWith(".mp3");
        if (isAudio) {
          console.log("use indexed - SW audio request detected");
        }
        return isAudio;
      },
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
    // Google Fonts: cache-first so they work offline after first load.
    {
      matcher: ({ url }) =>
        url.origin === "https://fonts.googleapis.com" ||
        url.origin === "https://fonts.gstatic.com",
      handler: new CacheFirst({
        cacheName: "google-fonts-cache",
      }),
    },
    // Next.js page navigation & RSC payloads: serve from cache when offline.
    // This is the critical handler — without it, Next.js throws a client-side
    // exception in airplane mode because RSC fetch requests fail with no handler.
    {
      matcher: ({ request, url }) => {
        const isNavigation = request.mode === "navigate";
        const isRsc =
          url.pathname.startsWith("/_next/") ||
          url.searchParams.has("_rsc");
        return isNavigation || isRsc;
      },
      handler: {
        handle: async ({ request }: { request: Request }) => {
          try {
            // Try network first
            const networkResponse = await fetch(request);
            // Cache successful responses for offline use
            const cache = await caches.open(`pages-cache-${VERSION}`);
            cache.put(request, networkResponse.clone());
            return networkResponse;
          } catch {
            // Offline: try the cache
            const cached = await caches.match(request);
            if (cached) return cached;
            // Last resort: serve the precached root shell
            const shell = await caches.match("/");
            if (shell) return shell;
            return new Response("Offline", { status: 503 });
          }
        },
      },
    },
  ],
});

serwist.addEventListeners();
