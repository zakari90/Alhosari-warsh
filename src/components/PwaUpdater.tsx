"use client";

import { useEffect, useState } from "react";
import { useConnectivity } from "@/lib/useConnectivity";

export default function PwaUpdater() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const { verify } = useConnectivity();

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    let cancelled = false;

    const setup = () => {
      if (cancelled || !window.serwist) return;

      const serwist = window.serwist;

      // Check if a service worker is already waiting (e.g. page was refreshed)
      if (serwist.getSW && serwist.getSW()?.state === "installed") {
        setShowUpdate(true);
      }

      // Listen for when a new service worker enters the waiting state
      const onWaiting = () => {
        setShowUpdate(true);
      };

      serwist.addEventListener("waiting", onWaiting);

      return () => {
        serwist.removeEventListener("waiting", onWaiting);
      };
    };

    // window.serwist is set asynchronously by SerwistInit, so retry if not ready
    if (window.serwist) {
      setup();
    } else {
      const interval = setInterval(() => {
        if (window.serwist) {
          clearInterval(interval);
          setup();
        }
      }, 200);
      // Stop trying after 10 seconds
      const timeout = setTimeout(() => clearInterval(interval), 10000);
      return () => {
        cancelled = true;
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }

    return () => {
      cancelled = true;
    };
  }, []);

  const handleUpdate = async () => {
    setError(null);
    setUpdating(true);

    // Verify real connectivity before applying the update
    const reachable = await verify();
    if (!reachable) {
      setError("لا يوجد اتصال بالإنترنت. جرب لاحقاً.");
      setUpdating(false);
      return;
    }

    if (typeof window !== "undefined" && window.serwist) {
      // Wait for the new service worker to take control before reloading
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        window.location.reload();
      });
      
      window.serwist.messageSkipWaiting();
    }
  };

  if (!showUpdate) return null;

  return (
    <div className="pwa-update-banner">
      <div className="pwa-update-content">
        <span className="pwa-update-icon">✨</span>
        <div className="pwa-update-text">
          <strong>تحديث جديد متاح</strong>
          <p>
            يتوفر إصدار جديد من التطبيق. قم بالتحديث للحصول على آخر التحسينات.
          </p>
          {error && <p className="pwa-update-error">{error}</p>}
        </div>
        <button
          className="pwa-update-btn"
          onClick={handleUpdate}
          disabled={updating}
        >
          {updating ? "جارٍ التحقق..." : "تحديث الآن"}
        </button>
      </div>
    </div>
  );
}

declare global {
  interface Window {
    serwist: any;
  }
}
