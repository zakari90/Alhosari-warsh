# Quran PWA (Alhosari Warsh) - Developer Skill Guide

This guide documents the core architecture, design patterns, and development standards for the Quran PWA project.

## 🚀 Project Overview
A highly optimized, offline-first Progressive Web App for listening to the Quran (Alhosari Warsh). The app prioritizes user data conservation and reliable offline playback.

### Tech Stack
- **Framework**: Next.js 16 + React 19
- **PWA Engine**: [Serwist](https://serwist.js.org/)
- **State Management**: React Hooks (useState, useEffect, useCallback)
- **Styling**: Vanilla CSS (Global and Component-based)
- **Storage**: Browser Cache API (backed by IndexedDB)

---

## 📡 Connectivity Strategy (`useConnectivity`)

The app uses a "Zero-Cost Connectivity" pattern to prevent unnecessary data usage.

### Core Rules:
1.  **No Auto-Pings**: The app does **not** ping the server on page load or on a timer. It relies on the browser's native `navigator.onLine` and `online`/`offline` events.
2.  **Manual Verification**: Use the `verify()` function from the hook or call `pingAudioServer()` explicitly only when a network-intensive action (like a download) is about to start.
3.  **Hydration Resilience**: Always initialize connectivity state to `true` (server-safe) and sync in `useEffect` to avoid React Error #418.

### Usage Example:
```typescript
const { isOnline, isChecking, verify } = useConnectivity();

async function startDownload() {
  const reachable = await verify(); // Real check only when needed
  if (!reachable) return; 
  // ...
}
```

---

## 📦 Storage & Caching (`sw.ts`)

### Caching Strategy:
- **App Shell**: Pre-cached during build. Served via `CacheFirst` to ensure the UI loads instantly even offline.
- **Audio Files**: Handled by a dedicated `CacheFirst` strategy (`quran-audio-cache`). Files are only cached when explicitly played or downloaded by the user.
- **Static Assets**: JS/CSS/Fonts are cached with versioned names to allow clean updates.

### ⚠️ Important:
**Never use `defaultCache` from Serwist.** It includes `NetworkFirst` strategies for pages which causes the browser to fetch the HTML from the server on every reload, defeating the offline-first goal and wasting data.

---

## 📜 Standardized Logging

To make network activity transparent, use the following logging emojis:

- 📡 **[Network Request]**: Manual pings or connectivity checks.
- 📥 **[Network Request]**: File downloads initiated by `DownloadManager`.
- 🎧 **[Network Request]**: Background caching triggered by `AudioPlayer`.
- 🌐 **[Browser Event]**: Native browser status changes.
- 🔍 **[use indexed]**: Any interaction with the Cache API / IndexedDB.

---

## 🛠 Troubleshooting

### React Hydration Error #418
**Cause**: Mismatch between Server-rendered HTML and Client-rendered HTML (usually due to `navigator.onLine` or `localStorage` checks).
**Fix**: Ensure the initial state in `useState` is a static value (e.g., `true` or `null`) and update to the real browser value inside `useEffect`.

### Service Worker Not Updating
**Fix**: Bump the `VERSION` constant in `src/app/sw.ts`. This forces the browser to install the new worker and clear old static asset caches.

---

## 🧞 Custom Skill Phrases
When developing this project, ensure every function that touches the database includes a log prefixed with:
`console.log("use indexed - [description]");`
