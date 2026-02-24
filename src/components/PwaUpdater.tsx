"use client";

import { useEffect, useState } from "react";
import { useConnectivity } from "@/lib/useConnectivity";

export default function PwaUpdater() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const { verify } = useConnectivity();

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      window.serwist
    ) {
      const serwist = window.serwist;

      // Listen for when a new service worker is waiting
      const onWaiting = () => {
        setShowUpdate(true);
      };

      serwist.addEventListener("waiting", onWaiting);

      return () => {
        serwist.removeEventListener("waiting", onWaiting);
      };
    }
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
      window.serwist.messageSkipWaiting();
      window.location.reload();
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
