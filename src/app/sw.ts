import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { CacheFirst, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope & typeof globalThis;

const VERSION = "v0.1.9";

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
    //
    // MOBILE FIX: Next.js RSC requests include dynamic query params (_rsc,
    // _next_router_state_tree) that change on every navigation. On desktop,
    // the browser may be more lenient, but mobile browsers (especially Chrome
    // on Android & Safari on iOS) do strict URL matching. We strip these
    // params before caching and matching so offline lookups succeed.
    {
      matcher: ({ request, url }) => {
        const isNavigation = request.mode === "navigate";
        // Match RSC data payloads but NOT /_next/static/ chunks (those use CacheFirst)
        const isRsc =
          url.searchParams.has("_rsc") ||
          (url.pathname.startsWith("/_next/") &&
            !url.pathname.startsWith("/_next/static/"));
        return isNavigation || isRsc;
      },
      handler: {
        handle: async ({ request }: { request: Request }) => {
          // Build a "canonical" URL without dynamic RSC query params so the
          // same page always maps to the same cache key.
          const canonicalUrl = new URL(request.url);
          canonicalUrl.searchParams.delete("_rsc");
          canonicalUrl.searchParams.delete("_next_router_state_tree");
          const canonicalKey = canonicalUrl.toString();

          const CACHE_NAME = `pages-cache-${VERSION}`;

          try {
            // Try network first
            const networkResponse = await fetch(request);
            // Cache the response under the canonical (stripped) URL
            const cache = await caches.open(CACHE_NAME);
            cache.put(canonicalKey, networkResponse.clone());
            return networkResponse;
          } catch {
            // Offline: try the canonical cache key first
            const cache = await caches.open(CACHE_NAME);
            const cached = await cache.match(canonicalKey);
            if (cached) return cached;

            // Fallback: try matching by pathname only (ignoreSearch)
            const pathnameOnly = new URL(request.url);
            pathnameOnly.search = "";
            const byPath = await cache.match(pathnameOnly.toString());
            if (byPath) return byPath;

            // Try across ALL caches (precache may hold the page shell)
            const anyCache = await caches.match(canonicalKey);
            if (anyCache) return anyCache;

            // Last resort: serve the precached root shell so the SPA can
            // hydrate and render the correct page client-side.
            const shell = await caches.match("/");
            if (shell) return shell;

            return new Response("Offline — المحتوى غير متوفر بدون إنترنت", {
              status: 503,
              headers: { "Content-Type": "text/plain; charset=utf-8" },
            });
          }
        },
      },
    },
  ],
});

serwist.addEventListeners();
