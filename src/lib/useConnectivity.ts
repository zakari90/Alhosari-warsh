"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import { getAudioUrl } from "./quran-data";

// ─── Internet checking is intentionally DISABLED for auto-run ────────────────
// All automatic ping-based verification is disabled to prevent extra
// network requests on page load or on a timer.
// The hook relies on the browser's native navigator.onLine for general status.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Verifies if the audio server is reachable.
 * Call this ON-DEMAND only.
 */
export async function pingAudioServer(): Promise<boolean> {
  console.log("📡 [Network Request] pingAudioServer() - Checking audio server reachability...");
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
    const ok = (res.ok || res.status === 206) &&
               (contentType.includes("audio") || contentType.includes("octet-stream"));
    console.log(`📡 [Network Response] pingAudioServer() - ${ok ? "Success" : "Failed"}`);
    return ok;
  } catch {
    console.log("📡 [Network Error] pingAudioServer() - Connection failed or timed out");
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Hook that provides online/offline status.
 * Zero extra network requests are made automatically.
 */
export function useConnectivity() {
  const isOnline = useSyncExternalStore(
    (callback) => {
      window.addEventListener("online", callback);
      window.addEventListener("offline", callback);
      return () => {
        window.removeEventListener("online", callback);
        window.removeEventListener("offline", callback);
      };
    },
    () => navigator.onLine,
    () => true // SSR value
  );

  const [isRestricted, setIsRestricted] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  // Sync isRestricted when going offline
  useEffect(() => {
    if (!isOnline) {
      Promise.resolve().then(() => {
        setIsRestricted(false);
      });
    }
  }, [isOnline]);

  /**
   * On-demand verification used by DownloadManager.
   */
  const verify = useCallback(async () => {
    setIsChecking(true);
    const reachable = await pingAudioServer();
    setIsRestricted(!reachable);
    setIsChecking(false);
    return reachable;
  }, []);

  return { isOnline, isRestricted, setIsRestricted, isChecking, verify };
}
