"use client";

import { useState, useEffect } from "react";
import { getAudioUrl } from "./quran-data";

// ─── Internet checking is intentionally DISABLED ─────────────────────────────
// All ping-based verification has been commented out to prevent any extra
// network requests on page load or on a timer.
// The hook relies solely on the browser's native navigator.onLine + events,
// which are zero-cost (no network traffic).
//
// If you need to re-enable deep checking in the future, un-comment the
// pingServer / pingAudioServer blocks and the verify() / startRecheck() calls
// inside useConnectivity().
// ─────────────────────────────────────────────────────────────────────────────

// const PING_TIMEOUT_MS = 4000;
// const RECHECK_INTERVAL_MS = 30000;

// /**
//  * Verify real connectivity by making a GET request to the app manifest.
//  * Returns true only if the server responds within the timeout.
//  */
// async function pingServer(): Promise<boolean> {
//   const controller = new AbortController();
//   const timer = setTimeout(() => controller.abort(), PING_TIMEOUT_MS);
//   try {
//     const res = await fetch("/manifest.json?v=" + Date.now(), {
//       method: "GET",
//       cache: "no-store",
//       signal: controller.signal,
//     });
//     return res.ok;
//   } catch {
//     return false;
//   } finally {
//     clearTimeout(timer);
//   }
// }

/**
 * Verifies if the audio server is reachable and not blocked by a captive
 * portal (which often returns 200 OK but with HTML content).
 *
 * Call this ON-DEMAND only (e.g. right before starting a download).
 * NEVER call it on page load — it hits the audio CDN unnecessarily.
 */
export async function pingAudioServer(): Promise<boolean> {
  const PING_TIMEOUT_MS = 4000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PING_TIMEOUT_MS);
  try {
    const res = await fetch(getAudioUrl(1, 1), {
      method: "GET",
      headers: { Range: "bytes=0-0" },
      cache: "no-store",
      signal: controller.signal,
    });
    const contentType = res.headers.get("content-type") || "";
    return (
      (res.ok || res.status === 206) &&
      (contentType.includes("audio") || contentType.includes("octet-stream"))
    );
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Hook that provides online/offline status using only the browser's native
 * navigator.onLine and window online/offline events.
 *
 * Zero extra network requests are made — no pings, no polling timers.
 * Audio downloads must be gated by calling pingAudioServer() manually.
 */
export function useConnectivity() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [isRestricted, setIsRestricted] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
      setIsRestricted(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // ── Deep verify (disabled) ──────────────────────────────────────────────
  // const verify = useCallback(async () => {
  //   const ok = await pingServer();
  //   setIsOnline(ok);
  //   if (!ok) setIsRestricted(false);
  //   return ok;
  // }, []);
  //
  // const startRecheck = useCallback(() => {
  //   if (recheckRef.current) return;
  //   recheckRef.current = setInterval(async () => {
  //     const ok = await pingServer();
  //     if (ok) {
  //       setIsOnline(true);
  //       clearInterval(recheckRef.current!);
  //       recheckRef.current = null;
  //     }
  //   }, RECHECK_INTERVAL_MS);
  // }, []);
  // ───────────────────────────────────────────────────────────────────────

  return { isOnline, isRestricted, setIsRestricted };
}
