"use client";

import { useState, useEffect, useCallback, useRef } from "react";

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
    const res = await fetch("/", {
      method: "HEAD",
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
 * Hook that provides reliable online/offline status.
 *
 * Unlike raw `navigator.onLine`, this hook **pings the server** when
 * the browser fires the `online` event to confirm real connectivity.
 * While offline it re-checks every 30 seconds for auto-recovery.
 */
export function useConnectivity() {
  const [isOnline, setIsOnline] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const recheckRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const verify = useCallback(async () => {
    setIsChecking(true);
    const reachable = await pingServer();
    setIsOnline(reachable);
    setIsChecking(false);
    return reachable;
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
    // Initial check
    if (typeof navigator !== "undefined") {
      if (!navigator.onLine) {
        setIsOnline(false);
        startRecheck();
      } else {
        // Verify on mount too — navigator.onLine can lie
        verify();
      }
    }

    const handleOnline = async () => {
      // Browser says online, but verify first
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

  return { isOnline, isChecking, verify };
}
