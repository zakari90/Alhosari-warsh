"use client";

import { useEffect, useState, useRef } from "react";

export default function PwaUpdater() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const waitingWorkerRef = useRef<ServiceWorker | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      console.log("ℹ️ [PWA Update] Service Worker not supported or running on server.");
      return;
    }

    console.log("🔍 [PWA Update] Initializing update listener...");

    const checkForWaiting = (registration: ServiceWorkerRegistration) => {
      if (registration.waiting) {
        console.log("✨ [PWA Update] Found waiting Service Worker!");
        waitingWorkerRef.current = registration.waiting;
        setShowUpdate(true);
      }
    };

    // Check existing registrations immediately
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (reg) {
        console.log("📋 [PWA Update] Current SW registration found:", reg);
        checkForWaiting(reg);

        // Listen for new service worker being installed
        reg.addEventListener("updatefound", () => {
          console.log("📥 [PWA Update] New Service Worker update found (installing)...");
          const installing = reg.installing;
          if (installing) {
            installing.addEventListener("statechange", () => {
              console.log(`🔄 [PWA Update] Installing SW state changed to: ${installing.state}`);
              if (installing.state === "installed" && navigator.serviceWorker.controller) {
                console.log("✨ [PWA Update] New Service Worker installed and waiting!");
                waitingWorkerRef.current = installing;
                setShowUpdate(true);
              }
            });
          }
        });
      }
    });

    // Also attach to window.serwist if available
    const checkSerwist = () => {
      if (window.serwist) {
        console.log("🔗 [PWA Update] Hooking into window.serwist instance");
        window.serwist.addEventListener("waiting", () => {
          console.log("✨ [PWA Update] Serwist fired 'waiting' event!");
          setShowUpdate(true);
        });
      }
    };

    if (window.serwist) {
      checkSerwist();
    } else {
      const interval = setInterval(() => {
        if (window.serwist) {
          clearInterval(interval);
          checkSerwist();
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, []);

  const handleUpdate = async () => {
    console.log("🔘 [PWA Update] 'Update Now' clicked");
    setError(null);
    setUpdating(true);

    let reloaded = false;
    const triggerReload = () => {
      if (!reloaded) {
        reloaded = true;
        console.log("🔄 [PWA Update] Reloading page to apply update...");
        window.location.reload();
      }
    };

    // Listen for controllerchange
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      console.log("⚡ [PWA Update] controllerchange event detected! Applying new version.");
      triggerReload();
    });

    try {
      // 1. Clear old caches (except audio cache) before activating new SW
      if ("caches" in window) {
        console.log("🧹 [PWA Update] Clearing old caches...");
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
          if (!cacheName.includes("quran-audio-cache")) {
            console.log(`🗑️ [PWA Update] Deleting cache: ${cacheName}`);
            await caches.delete(cacheName);
          }
        }
      }

      // 2. Tell window.serwist to skip waiting if available
      if (window.serwist && typeof window.serwist.messageSkipWaiting === "function") {
        console.log("📨 [PWA Update] Calling window.serwist.messageSkipWaiting()...");
        window.serwist.messageSkipWaiting();
      }

      // 2. Also send SKIP_WAITING directly to registration.waiting
      const reg = await navigator.serviceWorker.getRegistration();
      const waitingWorker = reg?.waiting || waitingWorkerRef.current;

      if (waitingWorker) {
        console.log("📨 [PWA Update] Posting SKIP_WAITING directly to waiting worker:", waitingWorker);
        waitingWorker.postMessage({ type: "SKIP_WAITING" });
      } else {
        console.warn("⚠️ [PWA Update] No waiting worker reference found in registration. Calling registration.update()...");
        if (reg) {
          await reg.update();
        }
      }

      // Fallback reload timeout in case controllerchange doesn't fire
      setTimeout(() => {
        console.log("⏱️ [PWA Update] Fallback reload timer fired (1.5s). Forcing reload...");
        triggerReload();
      }, 1500);

    } catch (err: any) {
      console.error("❌ [PWA Update] Error during update:", err);
      setError("حدث خطأ أثناء التحديث. سيتم إعادة التحميل...");
      setTimeout(() => triggerReload(), 1500);
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
          {updating ? "جارٍ التحديث..." : "تحديث الآن"}
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
