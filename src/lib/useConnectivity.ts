"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getAudioUrl } from "./quran-data";

const PING_TIMEOUT_MS = 4000;
const RECHECK_INTERVAL_MS = 30000;

/**
 * Verify real connectivity by making a HEAD request to the origin.
 * Returns true only if the server responds within the timeout.
 */
async function pingServer(): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PING_TIMEOUT_MS);

  try {
    // Ping manifest.json with a cache-buster instead of the root /
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
 * Verifies if the audio server specifically is reachable and not blocked
 * by a captive portal (which often returns 200 OK but HTML content).
 */
async function pingAudioServer(): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PING_TIMEOUT_MS);

  try {
    // Check the first MP3 file using GET with Range: 0-0 for better proxy compatibility
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
 * Unlike raw `navigator.onLine`, this hook **pings the server** when
 * the browser fires the `online` event to confirm real connectivity.
 * While offline it re-checks every 30 seconds for auto-recovery.
 */
export function useConnectivity() {
  const [isOnline, setIsOnline] = useState(true);
  const [isRestricted, setIsRestricted] = useState(false); // True if basic ping works but audio ping fails
  const [isStable, setIsStable] = useState(false); // True if fully verified
  const [isChecking, setIsChecking] = useState(false);
  const recheckRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const verify = useCallback(async () => {
    setIsChecking(true);
    const basicReach = await pingServer();
    let fullyReachable = false;

    if (basicReach) {
      fullyReachable = await pingAudioServer();
      setIsRestricted(!fullyReachable);
      setIsStable(fullyReachable);
    } else {
      setIsRestricted(false);
      setIsStable(false);
    }

    setIsOnline(basicReach);
    setIsChecking(false);
    return fullyReachable; // Return true only if fully capable of downloading audio
  }, []);

  // Start / stop the periodic recheck when offline
  const startRecheck = useCallback(() => {
    if (recheckRef.current) return;
    recheckRef.current = setInterval(async () => {
      const ok = await pingServer();
      if (ok) {
        setIsOnline(true);
        // Stop polling once back online
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
    let active = true;

    const initialCheck = async () => {
      if (typeof navigator === "undefined" || !active) return;

      if (!navigator.onLine) {
        setIsOnline(false);
        startRecheck();
      } else {
        // Initial ping can be slow or stall during some browser refresh cycles
        try {
          await verify();
        } catch {
          // Ignore initial verification failure during mount
        }
      }
    };

    initialCheck();

    const handleOnline = async () => {
      if (!active) return;
      const reachable = await verify();
      if (!reachable) {
        startRecheck();
      } else {
        stopRecheck();
      }
    };

    const handleOffline = () => {
      if (!active) return;
      setIsOnline(false);
      setIsStable(false);
      setIsRestricted(false);
      startRecheck();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      active = false;
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      stopRecheck();
    };
  }, [verify, startRecheck, stopRecheck]);

  return { isOnline, isRestricted, isStable, isChecking, verify };
}
