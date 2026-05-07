"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getAudioUrl } from "./quran-data";

const PING_TIMEOUT_MS = 4000;
const RECHECK_INTERVAL_MS = 30000;

/**
 * Verify real connectivity by making a GET request to the app manifest.
 * Returns true only if the server responds within the timeout.
 */
async function pingServer(): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PING_TIMEOUT_MS);

  try {
    // Ping manifest.json with a cache-buster to bypass SW/browser cache
    const res = await fetch("/manifest.json?v=" + Date.now(), {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Verifies if the audio server is reachable and not blocked by a captive
 * portal (which often returns 200 OK but with HTML content).
 *
 * Call this ON-DEMAND only (e.g. right before starting a download).
 * Do NOT call it on page load — it makes a real network request to the
 * audio CDN and will be cached by the service worker unnecessarily.
 */
export async function pingAudioServer(): Promise<boolean> {
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
 * Hook that provides reliable online/offline status.
 *
 * Unlike raw `navigator.onLine`, this hook pings the app server when
 * the browser fires the `online` event to confirm real connectivity.
 * While offline it re-checks every 30 seconds for auto-recovery.
 *
 * Audio-server reachability (`isRestricted`) is NOT checked automatically
 * on mount or browser events — call `pingAudioServer()` explicitly before
 * initiating a download to avoid unwanted requests on every page reload.
 */
export function useConnectivity() {
  const [isOnline, setIsOnline] = useState(true);
  const [isRestricted, setIsRestricted] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const recheckRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const verify = useCallback(async () => {
    setIsChecking(true);
    const basicReach = await pingServer();

    if (!basicReach) {
      // Clear restricted state when fully offline
      setIsRestricted(false);
    }

    setIsOnline(basicReach);
    setIsChecking(false);
    return basicReach;
  }, []);

  const startRecheck = useCallback(() => {
    if (recheckRef.current) return;
    recheckRef.current = setInterval(async () => {
      const ok = await pingServer();
      if (ok) {
        setIsOnline(true);
        if (recheckRef.current) {
          clearInterval(recheckRef.current);
          recheckRef.current = null;
        }
      }
    }, RECHECK_INTERVAL_MS);
  }, []);

  const stopRecheck = useCallback(() => {
    if (recheckRef.current) {
      clearInterval(recheckRef.current);
      recheckRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (typeof navigator !== "undefined") {
      if (!navigator.onLine) {
        setIsOnline(false);
        startRecheck();
      } else {
        // Verify on mount — navigator.onLine can lie (e.g. captive portals)
        verify();
      }
    }

    const handleOnline = async () => {
      const reachable = await verify();
      if (!reachable) {
        startRecheck();
      } else {
        stopRecheck();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      startRecheck();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      stopRecheck();
    };
  }, [verify, startRecheck, stopRecheck]);

  return { isOnline, isRestricted, setIsRestricted, isChecking, verify };
}
